import { NextRequest, NextResponse } from "next/server";
import {
  getOfficeCheckInRecords,
  saveOfficeCheckInRecord
} from "@/lib/persistence";
import type { CheckInRecord } from "@/lib/patient-vault";
import {
  getRequestActor,
  isProviderActor,
  isSameEmailActor,
  isSamePracticeActor
} from "@/lib/request-auth";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const patientEmail = request.nextUrl.searchParams.get("patientEmail") || undefined;
  const practiceId = request.nextUrl.searchParams.get("practiceId") || undefined;

  if (!patientEmail && !practiceId) {
    return NextResponse.json(
      { error: "patientEmail or practiceId is required." },
      { status: 400 }
    );
  }

  const actor = await getRequestActor(request);
  if (isSupabaseConfigured() && !actor) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }
  if (isSupabaseConfigured()) {
    const patientAccess = patientEmail && isSameEmailActor(actor, patientEmail) && !practiceId;
    const providerAccess = practiceId && isSamePracticeActor(actor, practiceId);

    if (!patientAccess && !providerAccess) {
      return NextResponse.json({ error: "You do not have access to these records." }, { status: 403 });
    }
  }

  const result = await getOfficeCheckInRecords({ patientEmail, practiceId });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<CheckInRecord> & {
    createdByUserId?: string;
  };

  if (!body.practiceId || !body.practiceName || !body.patientEmail || !body.status) {
    return NextResponse.json(
      { error: "Practice, patient email, and check-in status are required." },
      { status: 400 }
    );
  }

  const actor = await getRequestActor(request);
  if (isSupabaseConfigured() && !actor) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }
  if (isSupabaseConfigured() && !isProviderActor(actor)) {
    return NextResponse.json({ error: "Provider access is required." }, { status: 403 });
  }
  if (isSupabaseConfigured() && !isSamePracticeActor(actor, body.practiceId)) {
    return NextResponse.json(
      { error: "Check-ins can only be saved for your signed-in practice." },
      { status: 403 }
    );
  }

  const result = await saveOfficeCheckInRecord({
    id: body.id || crypto.randomUUID(),
    practiceId: body.practiceId,
    practiceName: body.practiceName,
    patientEmail: body.patientEmail,
    memberId: body.memberId || "",
    verifiedAt: body.verifiedAt || new Date().toISOString(),
    status: body.status,
    insuranceConfirmed: Boolean(body.insuranceConfirmed),
    historyConfirmed: Boolean(body.historyConfirmed),
    medicationConfirmed: Boolean(body.medicationConfirmed),
    notes: body.notes || "",
    createdByUserId: actor?.appUserId ?? (typeof body.createdByUserId === "string" ? body.createdByUserId : null)
  });

  return NextResponse.json(result);
}
