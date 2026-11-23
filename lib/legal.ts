import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";
import { createDeskClient } from "@/lib/supabase";

export const legalSlugs = ["privacy", "terms", "delete"] as const;

export type LegalSlug = (typeof legalSlugs)[number];

export type LegalDocument = {
  slug: LegalSlug;
  title: string;
  body: string;
  updatedAt: string | null;
  source: "supabase" | "website" | "default";
};

const fallbackCopy: Record<LegalSlug, { title: string; body: string }> = {
  privacy: { title: "Privacy", body: "The privacy notice has not been written yet." },
  terms: { title: "Terms of use", body: "The terms of use have not been written yet." },
  delete: { title: "Delete account", body: "The deletion notice has not been written yet." },
};

export function isLegalSlug(value: string): value is LegalSlug {
  return (legalSlugs as readonly string[]).includes(value);
}

function contentDir() {
  return path.resolve(process.cwd(), "..", "bookreview", "content");
}

function asDocument(slug: LegalSlug, value: unknown, source: LegalDocument["source"]): LegalDocument | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  const title = typeof row.title === "string" ? row.title.trim() : "";
  const body = typeof row.body === "string" ? row.body.trim() : "";
  const updatedAt = typeof row.updatedAt === "string" ? row.updatedAt : typeof row.updated_at === "string" ? row.updated_at : null;

  if (!title || !body) {
    return null;
  }

  return { slug, title, body, updatedAt, source };
}

async function readJson(filePath: string) {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function loadLegalDocument(slug: LegalSlug): Promise<LegalDocument> {
  await connection();
  const desk = createDeskClient();

  if (desk) {
    const { data, error } = await desk.supabase.from("site_pages").select("title, body, updated_at").eq("slug", slug).maybeSingle();
    const stored = !error && data ? asDocument(slug, data, "supabase") : null;
    if (stored) {
      return stored;
    }
  }

  const local = asDocument(slug, (await readJson(path.join(contentDir(), "legal.json")))?.[slug], "website");
  if (local) {
    return local;
  }

  const defaults = asDocument(slug, (await readJson(path.join(contentDir(), "legal-defaults.json")))?.[slug], "default");
  return defaults ?? { slug, ...fallbackCopy[slug], updatedAt: null, source: "default" };
}

export async function saveLegalDocument(document: LegalDocument): Promise<{ where: "both" | "website" | "supabase"; fileError: string | null; databaseError: string | null }> {
  const dir = contentDir();
  const filePath = path.join(dir, "legal.json");
  let fileError: string | null = null;

  try {
    const current = (await readJson(filePath)) ?? {};
    current[document.slug] = {
      title: document.title,
      body: document.body,
      updatedAt: document.updatedAt,
    };
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, `${JSON.stringify(current, null, 2)}\n`, "utf8");
  } catch (error) {
    fileError = error instanceof Error ? error.message : "The website copy could not be saved.";
  }

  let databaseError: string | null = null;
  const desk = createDeskClient();
  if (!desk) {
    databaseError = "Supabase is not configured.";
  } else {
    const { data, error } = await desk.supabase
      .from("site_pages")
      .upsert(
        {
          slug: document.slug,
          title: document.title,
          body: document.body,
          updated_at: document.updatedAt,
        },
        { onConflict: "slug" },
      )
      .select("slug");

    if (error) {
      databaseError = /site_pages|schema cache|PGRST205/i.test(error.message)
        ? "Supabase does not have the site_pages table yet. Run bookreview/supabase/site-pages.sql, then save with SUPABASE_SECRET_KEY."
        : /row-level security|permission|42501/i.test(error.message)
          ? "Add SUPABASE_SECRET_KEY so the desk can store this page in Supabase."
          : error.message;
    } else if (!data || data.length === 0) {
      databaseError = "Supabase did not store the page. Add SUPABASE_SECRET_KEY, then save again.";
    }
  }

  if (fileError && databaseError) {
    throw new Error(databaseError);
  }

  const where = !fileError && !databaseError ? "both" : fileError ? "supabase" : "website";
  return { where, fileError, databaseError };
}
