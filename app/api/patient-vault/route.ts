import { NextRequest, NextResponse } from "next/server";
import { getPatientVaultRecord, savePatientVaultRecord } from "@/lib/persistence";
import type { PatientVault } from "@/lib/patient-vault";
import { getRequestActor, isProviderActor, isSameEmailActor } from "@/lib/request-auth";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const actor = await getRequestActor(request);
  if (isSupabaseConfigured() && !actor) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }
  if (isSupabaseConfigured() && !isProviderActor(actor) && !isSameEmailActor(actor, email)) {
    return NextResponse.json({ error: "You do not have access to this vault." }, { status: 403 });
  }

  const result = await getPatientVaultRecord(email);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
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
  if (isSupabaseConfigured() && !isProviderActor(actor) && !isSameEmailActor(actor, body.email)) {
    return NextResponse.json({ error: "You do not have access to update this vault." }, { status: 403 });
  }

  const result = await savePatientVaultRecord(body as PatientVault);
  return NextResponse.json(result);
}
