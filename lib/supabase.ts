import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const requiredSupabaseEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
] as const;

export function isSupabaseConfigured() {
  return getMissingSupabaseEnvNames().length === 0;
}

export function shouldRequireSupabase() {
  return process.env.CLEARPATH_REQUIRE_SUPABASE === "true" || process.env.VERCEL_ENV === "production";
}

export function getMissingSupabaseEnvNames() {
  return requiredSupabaseEnv.filter((name) => !process.env[name]);
}

export function createAdminSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
