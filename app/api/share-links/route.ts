import { NextRequest, NextResponse } from "next/server";
import {
  createPatientShareLinkRecord,
  getPatientShareLinksRecord
} from "@/lib/persistence";
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
  if (isSupabaseConfigured()) {
    const patientAccess = patientEmail && isSameEmailActor(actor, patientEmail) && !practiceId && !accessCode;
    const providerAccess = isProviderActor(actor) && (!practiceId || isSamePracticeActor(actor, practiceId));

    if (!patientAccess && !providerAccess) {
      return NextResponse.json({ error: "You do not have access to these share links." }, { status: 403 });
    }
  }

  const result = await getPatientShareLinksRecord({ patientEmail, practiceId, accessCode });
  if (isSupabaseConfigured() && isProviderActor(actor) && actor?.practiceSlug) {
    return NextResponse.json({
      ...result,
      shareLinks: result.shareLinks.filter((link) => link.practiceId === actor.practiceSlug)
    });
  }

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
  if (isSupabaseConfigured() && !isProviderActor(actor)) {
    return NextResponse.json({ error: "Provider access is required to create share links." }, { status: 403 });
  }
  if (isSupabaseConfigured() && !isSamePracticeActor(actor, body.practiceId)) {
    return NextResponse.json(
      { error: "Share links can only be created for your signed-in practice." },
      { status: 403 }
    );
  }

  const result = await createPatientShareLinkRecord({
    patientEmail: body.patientEmail,
    practiceId: body.practiceId,
    expiresAt: body.expiresAt
  });

  return NextResponse.json(result);
}
