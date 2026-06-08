"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function isSupabaseBrowserConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isSupabaseRequiredInBrowser() {
  return process.env.NEXT_PUBLIC_CLEARPATH_REQUIRE_SUPABASE === "true" || process.env.NODE_ENV === "production";
}

export function getSupabaseBrowserClient() {
  if (!isSupabaseBrowserConfigured()) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    );
  }

  return browserClient;
}

export async function getSupabaseAccessToken() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return null;
  }

  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch (error) {
    console.error("Unable to reach Supabase while reading the current session.", error);
    return null;
  }
}

export async function getSupabaseAuthHeaders() {
  const token = await getSupabaseAccessToken();
  return token
    ? ({ Authorization: `Bearer ${token}` } as Record<string, string>)
    : ({} as Record<string, string>);
}
