import { NextRequest, NextResponse } from "next/server";
import { getPracticeProfilesRecord } from "@/lib/persistence";

export async function GET(request: NextRequest) {
  const practiceId = request.nextUrl.searchParams.get("practiceId");

  if (!practiceId) {
    return NextResponse.json({ error: "practiceId is required." }, { status: 400 });
  }

  const result = await getPracticeProfilesRecord(practiceId);
  return NextResponse.json(result);
}
