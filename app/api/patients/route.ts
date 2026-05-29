import { NextRequest, NextResponse } from "next/server";
import { getPracticePatientVaultRecords } from "@/lib/persistence";
import { getRequestActor, isSamePracticeActor } from "@/lib/request-auth";
import { isSupabaseConfigured, shouldRequireSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  if (shouldRequireSupabase() && !isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase auth is required before patient lookup is available." },
      { status: 503 }
    );
  }

  const practiceId = request.nextUrl.searchParams.get("practiceId") || undefined;
  if (!practiceId) {
    return NextResponse.json({ error: "practiceId is required." }, { status: 400 });
  }

  const actor = await getRequestActor(request);
  if (isSupabaseConfigured() && !actor) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }
  if (isSupabaseConfigured() && !isSamePracticeActor(actor, practiceId)) {
    return NextResponse.json({ error: "You do not have access to this patient list." }, { status: 403 });
  }

  const result = await getPracticePatientVaultRecords(practiceId, actor);
  return NextResponse.json(result);
}
