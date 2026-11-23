import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LegalForm } from "@/components/legal-form";
import { isLegalSlug, legalSlugs, loadLegalDocument, type LegalSlug } from "@/lib/legal";

const pageTitle: Record<LegalSlug, string> = {
  privacy: "Privacy",
  terms: "Terms of use",
  delete: "Delete account",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: isLegalSlug(slug) ? pageTitle[slug] : "Legal" };
}

export default function LegalEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ notice?: string; where?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Opening the page…</p>}>
      <LegalEdit params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function LegalEdit({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ notice?: string; where?: string }>;
}) {
  const { slug } = await params;
  const { notice, where } = await searchParams;
  if (!isLegalSlug(slug)) {
    notFound();
  }

  const document = await loadLegalDocument(slug);
  const origin = (process.env.NEXT_PUBLIC_READER_ORIGIN || "http://localhost:3000").replace(/\/$/, "");

  return (
    <>
      <div className="flex flex-wrap gap-4 text-sm font-semibold">
        <Link href="/legal" className="text-lake-deep">
          Legal pages
        </Link>
        {legalSlugs
          .filter((item) => item !== slug)
          .map((item) => (
            <Link key={item} href={`/legal/${item}`} className="text-lake-deep">
              Edit {pageTitle[item].toLowerCase()}
            </Link>
          ))}
        <a href={`${origin}/${slug}`} className="text-lake-deep">
          View on the website
        </a>
      </div>
      <header className="max-w-2xl">
        <p className="text-sm font-semibold tracking-wide text-clay">Website page</p>
        <h1 className="mt-1 font-serif text-3xl sm:text-4xl">{document.title}</h1>
        <p className="mt-2 leading-7 text-ink-soft">{sourceLine(document.source, document.updatedAt)}</p>
      </header>
      <SaveNote notice={notice} where={where} />
      <LegalForm key={`${slug}-${document.updatedAt ?? "new"}`} slug={slug} title={document.title} body={document.body} />
    </>
  );
}

function sourceLine(source: "supabase" | "website" | "default", updatedAt: string | null) {
  const when = updatedAt ? ` Last edit ${formatWhen(updatedAt)}.` : "";
  if (source === "supabase") {
    return `This text is the copy stored in Supabase.${when}`;
  }
  if (source === "website") {
    return `This text is the copy saved for the website on this machine.${when}`;
  }
  return "This is the text that ships with the shelf. Save it after you change it.";
}

function SaveNote({ notice, where }: { notice?: string; where?: string }) {
  if (notice !== "saved") {
    return null;
  }

  const message =
    where === "both"
      ? "Saved. The website and Supabase both have this text."
      : where === "supabase"
        ? "Saved in Supabase. The website copy on this machine could not be written."
        : "Saved for the website on this machine. Supabase will keep a copy after you run bookreview/supabase/site-pages.sql and set SUPABASE_SECRET_KEY.";

  return <p className="rounded-2xl bg-lake-soft px-4 py-3 text-sm leading-6 text-lake-deep">{message}</p>;
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}
