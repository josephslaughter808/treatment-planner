import { NextResponse } from "next/server";
import { isSupabaseConfigured, shouldRequireSupabase } from "@/lib/supabase";

export function GET() {
  const supabaseConfigured = isSupabaseConfigured();
  const supabaseRequired = shouldRequireSupabase();

  return NextResponse.json(
    {
      status: supabaseRequired && !supabaseConfigured ? "degraded" : "ok",
      app: "clearpath-care",
      phase: "phase-one-pilot",
      supabase: {
        configured: supabaseConfigured,
        required: supabaseRequired
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
