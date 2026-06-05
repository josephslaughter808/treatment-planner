import { NextRequest, NextResponse } from "next/server";
import { connectPracticePatientByCodeRecord, getPracticePatientVaultRecords } from "@/lib/persistence";
import { getRequestActor, isProviderActor, isSamePracticeActor } from "@/lib/request-auth";
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

export async function POST(request: NextRequest) {
  if (shouldRequireSupabase() && !isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase auth is required before patients can be added to the practice database." },
      { status: 503 }
    );
  }

  const body = (await request.json()) as {
    practiceId?: string;
    accessCode?: string;
  };

  if (!body.practiceId || !body.accessCode) {
    return NextResponse.json({ error: "practiceId and accessCode are required." }, { status: 400 });
  }

  const actor = await getRequestActor(request);
  if (isSupabaseConfigured() && !actor) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }
  if (isSupabaseConfigured() && !isProviderActor(actor)) {
    return NextResponse.json({ error: "Provider access is required to add patients." }, { status: 403 });
  }
  if (isSupabaseConfigured() && !isSamePracticeActor(actor, body.practiceId)) {
    return NextResponse.json(
      { error: "Patients can only be added to your signed-in practice." },
      { status: 403 }
    );
  }

  try {
    const result = await connectPracticePatientByCodeRecord(
      {
        practiceId: body.practiceId,
        accessCode: body.accessCode
      },
      actor
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to add patient to the practice database." },
      { status: 400 }
    );
  }
}
