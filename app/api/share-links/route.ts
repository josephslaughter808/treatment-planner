import { NextRequest, NextResponse } from "next/server";
import {
  createPatientShareLinkRecord,
  getPatientShareLinksRecord
} from "@/lib/persistence";

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

  const result = await createPatientShareLinkRecord({
    patientEmail: body.patientEmail,
    practiceId: body.practiceId,
    expiresAt: body.expiresAt
  });

  return NextResponse.json(result);
}
