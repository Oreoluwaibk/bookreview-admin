"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireDesk } from "@/lib/guard";
import { createSessionToken, deskCookie, passwordConfigured, passwordsMatch, sessionMaxAge } from "@/lib/session";
import { createDeskClient, isPrivileged } from "@/lib/supabase";

export type DeskActionState = {
  error?: string;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function signIn(_state: DeskActionState, formData: FormData): Promise<DeskActionState> {
  if (!passwordConfigured()) {
    return { error: "Add ADMIN_PASSWORD to .env.local, then try again." };
  }

  const password = String(formData.get("password") ?? "");
  if (!(await passwordsMatch(password))) {
    return { error: "That password does not open the desk." };
  }

  const jar = await cookies();
  jar.set(deskCookie, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAge(),
  });
  redirect("/");
}

export async function signOut() {
  const jar = await cookies();
  jar.set(deskCookie, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  redirect("/login");
}

function safeBack(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  const path = value.split("?")[0] ?? "/";
  const allowed = ["/readers", "/books", "/readings", "/reviews", "/studies", "/growth"];
  if (path === "/" || allowed.some((item) => path === item || path.startsWith(`${item}/`))) {
    return path;
  }

  return "/";
}

function refresh(path: string) {
  revalidatePath("/");
  revalidatePath("/readers");
  revalidatePath("/books");
  revalidatePath("/readings");
  revalidatePath("/reviews");
  revalidatePath("/studies");
  revalidatePath("/growth");
  revalidatePath("/readers/[id]", "page");
  revalidatePath("/books/[id]", "page");
  revalidatePath(path);
}

function blocked(privileged: boolean) {
  if (privileged) {
    return "That record is already gone.";
  }

  return "The shelf refused this change. Add SUPABASE_SECRET_KEY to manage every record.";
}

async function removed(supabase: SupabaseClient, table: string, id: string, privileged: boolean) {
  const { data, error } = await supabase.from(table).delete().eq("id", id).select("id");
  if (error) {
    return error.message;
  }

  if (!data || data.length === 0) {
    return blocked(privileged);
  }

  return null;
}

async function removeStudy(supabase: SupabaseClient, id: string, privileged: boolean) {
  const first = await removed(supabase, "studies", id, privileged);
  if (!first) {
    await supabase.from("study_verses").delete().eq("study_id", id);
    return null;
  }

  if (!/foreign key|study_verses/i.test(first)) {
    return first;
  }

  const verses = await supabase.from("study_verses").delete().eq("study_id", id);
  if (verses.error) {
    return verses.error.message;
  }

  return removed(supabase, "studies", id, privileged);
}

export async function manageRecord(_state: DeskActionState, formData: FormData): Promise<DeskActionState> {
  await requireDesk();
  const id = String(formData.get("id") ?? "");
  const intent = String(formData.get("intent") ?? "");

  if (!uuidPattern.test(id)) {
    return { error: "That record is not valid." };
  }

  const desk = createDeskClient();
  if (!desk) {
    return { error: "Supabase is not configured." };
  }

  const privileged = isPrivileged();
  let error: string | null = null;
  let notice = "removed";

  if (intent === "remove-review") {
    error = await removed(desk.supabase, "reviews", id, privileged);
  } else if (intent === "remove-reading") {
    error = await removed(desk.supabase, "readings", id, privileged);
  } else if (intent === "remove-study") {
    error = await removeStudy(desk.supabase, id, privileged);
  } else if (intent === "study-public" || intent === "study-private") {
    notice = "updated";
    const visibility = intent === "study-private" ? "private" : "public";
    const { data, error: updateError } = await desk.supabase.from("studies").update({ visibility }).eq("id", id).select("id");
    error = updateError?.message ?? (data && data.length > 0 ? null : blocked(privileged));
  } else {
    return { error: "That action is not available." };
  }

  if (error) {
    return { error };
  }

  const back = safeBack(formData.get("back"));
  refresh(back);
  redirect(`${back}?notice=${notice}`);
}
