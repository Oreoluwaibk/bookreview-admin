"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDesk } from "@/lib/guard";
import { isLegalSlug, saveLegalDocument } from "@/lib/legal";

export type LegalActionState = {
  error?: string;
};

export async function saveLegalPage(_state: LegalActionState, formData: FormData): Promise<LegalActionState> {
  await requireDesk();
  const slug = String(formData.get("slug") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").replace(/\r\n/g, "\n").trim();

  if (!isLegalSlug(slug)) {
    return { error: "That page is not on the shelf." };
  }

  if (title.length < 2 || title.length > 120) {
    return { error: "Keep the title between 2 and 120 characters." };
  }

  if (body.length < 40) {
    return { error: "The page needs a few more sentences." };
  }

  if (body.length > 20000) {
    return { error: "Keep the page under 20,000 characters." };
  }

  let where: "both" | "website" | "supabase";
  try {
    const saved = await saveLegalDocument({
      slug,
      title,
      body,
      updatedAt: new Date().toISOString(),
      source: "website",
    });
    where = saved.where;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The page could not be saved." };
  }

  revalidatePath("/legal");
  revalidatePath(`/legal/${slug}`);
  redirect(`/legal/${slug}?notice=saved&where=${where}`);
}
