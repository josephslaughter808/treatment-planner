import { NextRequest, NextResponse } from "next/server";
import {
  createPatientShareLinkRecord,
  getPatientShareLinksRecord
} from "@/lib/persistence";
import { getRequestActor, isProviderActor, isSameEmailActor } from "@/lib/request-auth";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const patientEmail = request.nextUrl.searchParams.get("patientEmail") || undefined;
  const practiceId = request.nextUrl.searchParams.get("practiceId") || undefined;
  const accessCode = request.nextUrl.searchParams.get("accessCode") || undefined;

  if (!patientEmail && !practiceId && !accessCode) {
    return NextResponse.json(
      { error: "patientEmail, practiceId, or accessCode is required." },
      { status: 400 }
    );
  }

  const actor = await getRequestActor(request);
  if (isSupabaseConfigured() && !actor) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }
  if (
    isSupabaseConfigured() &&
    !isProviderActor(actor) &&
    !(patientEmail && isSameEmailActor(actor, patientEmail))
  ) {
    return NextResponse.json({ error: "You do not have access to these share links." }, { status: 403 });
  }

  const result = await getPatientShareLinksRecord({ patientEmail, practiceId, accessCode });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    patientEmail?: string;
    practiceId?: string;
    expiresAt?: string;
  };

  if (!body.patientEmail || !body.practiceId || !body.expiresAt) {
    return NextResponse.json(
      { error: "patientEmail, practiceId, and expiresAt are required." },
      { status: 400 }
    );
  }

  const actor = await getRequestActor(request);
  if (isSupabaseConfigured() && !actor) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }
  if (isSupabaseConfigured() && !isProviderActor(actor) && !isSameEmailActor(actor, body.patientEmail)) {
    return NextResponse.json({ error: "You do not have access to create this share link." }, { status: 403 });
  }

  const result = await createPatientShareLinkRecord({
    patientEmail: body.patientEmail,
    practiceId: body.practiceId,
    expiresAt: body.expiresAt
  });

  return NextResponse.json(result);
}
