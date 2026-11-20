import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function isConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
}

export function isPrivileged() {
  return Boolean(process.env.SUPABASE_SECRET_KEY);
}

export function createDeskClient(): { supabase: SupabaseClient; privileged: boolean } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = secret || anon;

  if (!url || !key) {
    return null;
  }

  return {
    privileged: Boolean(secret),
    supabase: createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
}
