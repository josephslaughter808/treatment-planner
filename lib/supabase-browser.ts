"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

const proxySessionStorageKeys = {
  accessToken: "clearpath-supabase-proxy-access-token",
  refreshToken: "clearpath-supabase-proxy-refresh-token",
  expiresAt: "clearpath-supabase-proxy-expires-at"
};

export function isSupabaseBrowserConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isLocalAuthAllowedInBrowser() {
  return process.env.NEXT_PUBLIC_CLEARPATH_ALLOW_LOCAL_AUTH === "true";
}

export function isSupabaseRequiredInBrowser() {
  if (isLocalAuthAllowedInBrowser()) {
    return false;
  }

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
    return data.session?.access_token ?? readProxyAccessToken();
  } catch (error) {
    console.error("Unable to reach Supabase while reading the current session.", error);
    return readProxyAccessToken();
  }
}

export async function getSupabaseAuthHeaders() {
  const token = await getSupabaseAccessToken();
  return token
    ? ({ Authorization: `Bearer ${token}` } as Record<string, string>)
    : ({} as Record<string, string>);
}

export function storeSupabaseProxySession(input: {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: number | null;
}) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(proxySessionStorageKeys.accessToken, input.accessToken);
  if (input.refreshToken) {
    window.localStorage.setItem(proxySessionStorageKeys.refreshToken, input.refreshToken);
  }
  if (input.expiresAt) {
    window.localStorage.setItem(proxySessionStorageKeys.expiresAt, String(input.expiresAt));
  }
}

export function clearSupabaseProxySession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(proxySessionStorageKeys.accessToken);
  window.localStorage.removeItem(proxySessionStorageKeys.refreshToken);
  window.localStorage.removeItem(proxySessionStorageKeys.expiresAt);
}

function readProxyAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  const accessToken = window.localStorage.getItem(proxySessionStorageKeys.accessToken);
  const expiresAt = Number(window.localStorage.getItem(proxySessionStorageKeys.expiresAt) || "0");
  if (!accessToken) {
    return null;
  }

  if (expiresAt && expiresAt * 1000 < Date.now()) {
    clearSupabaseProxySession();
    return null;
  }

  return accessToken;
}
