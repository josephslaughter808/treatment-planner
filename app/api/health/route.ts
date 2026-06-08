import { NextResponse } from "next/server";
import { isSupabaseConfigured, shouldRequireSupabase } from "@/lib/supabase";

export async function GET() {
  const supabaseConfigured = isSupabaseConfigured();
  const supabaseRequired = shouldRequireSupabase();
  const supabaseReachability = await checkSupabaseReachability(supabaseConfigured);
  const isDegraded =
    (supabaseRequired && !supabaseConfigured) ||
    (supabaseRequired && supabaseReachability.status === "unreachable");

  return NextResponse.json(
    {
      status: isDegraded ? "degraded" : "ok",
      app: "clearpath-care",
      phase: "phase-one-pilot",
      supabase: {
        configured: supabaseConfigured,
        required: supabaseRequired,
        host: supabaseReachability.host,
        reachable: supabaseReachability.status === "reachable",
        error: supabaseReachability.error
      },
      scope: [
        "patient-medical-history",
        "patient-medications",
        "patient-allergies",
        "emergency-contact",
        "insurance",
        "provider-check-in-review",
        "saved-check-in-history"
      ]
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

async function checkSupabaseReachability(isConfigured: boolean) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!isConfigured || !supabaseUrl) {
    return { host: null, status: "not-configured" as const, error: null };
  }

  try {
    const url = new URL("/auth/v1/health", supabaseUrl);
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000)
    });

    return {
      host: url.host,
      status: response.ok ? ("reachable" as const) : ("unreachable" as const),
      error: response.ok ? null : `Supabase health returned ${response.status}.`
    };
  } catch (error) {
    return {
      host: getSupabaseHost(supabaseUrl),
      status: "unreachable" as const,
      error: error instanceof Error ? error.message : "Supabase health check failed."
    };
  }
}

function getSupabaseHost(supabaseUrl: string) {
  try {
    return new URL(supabaseUrl).host;
  } catch {
    return "invalid-supabase-url";
  }
}
