import { NextRequest, NextResponse } from "next/server";
import {
  getOfficeCheckInRecords,
  saveOfficeCheckInRecord
} from "@/lib/persistence";
import type { CheckInRecord } from "@/lib/patient-vault";

export async function GET(request: NextRequest) {
  const patientEmail = request.nextUrl.searchParams.get("patientEmail") || undefined;
  const practiceId = request.nextUrl.searchParams.get("practiceId") || undefined;

  if (!patientEmail && !practiceId) {
    return NextResponse.json(
      { error: "patientEmail or practiceId is required." },
      { status: 400 }
    );
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
    createdByUserId: typeof body.createdByUserId === "string" ? body.createdByUserId : null
  });

  return NextResponse.json(result);
}
