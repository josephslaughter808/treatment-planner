import { NextRequest, NextResponse } from "next/server";
import { getPatientVaultRecord, savePatientVaultRecord } from "@/lib/persistence";
import type { PatientVault } from "@/lib/patient-vault";
import {
  getRequestActor,
  isPatientActor,
  isSameEmailActor,
  isSamePracticeActor
} from "@/lib/request-auth";
import { isSupabaseConfigured, shouldRequireSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  if (shouldRequireSupabase() && !isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase auth is required before patient vault access is available." },
      { status: 503 }
    );
  }

  const email = request.nextUrl.searchParams.get("email");
  const practiceId = request.nextUrl.searchParams.get("practiceId");
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const actor = await getRequestActor(request);
  if (isSupabaseConfigured() && !actor) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }
  if (
    isSupabaseConfigured() &&
    !isSameEmailActor(actor, email) &&
    !isSamePracticeActor(actor, practiceId)
  ) {
    return NextResponse.json({ error: "You do not have access to this vault." }, { status: 403 });
  }

  const result = await getPatientVaultRecord(email, actor);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  if (shouldRequireSupabase() && !isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase auth is required before patient vault updates are available." },
      { status: 503 }
    );
  }

  const body = (await request.json()) as Partial<PatientVault>;

  if (!body.email || !body.fullName) {
    return NextResponse.json(
      { error: "Patient vault requires at least full name and email." },
      { status: 400 }
    );
  }

  const actor = await getRequestActor(request);
  if (isSupabaseConfigured() && !actor) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }
  if (
    isSupabaseConfigured() &&
    (!isPatientActor(actor) || !isSameEmailActor(actor, body.email))
  ) {
    return NextResponse.json(
      { error: "Patients can only update their own medical history vault." },
      { status: 403 }
    );
  }

  const result = await savePatientVaultRecord(body as PatientVault, actor);
  return NextResponse.json(result);
}
