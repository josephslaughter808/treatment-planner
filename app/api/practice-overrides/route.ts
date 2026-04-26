import { NextRequest, NextResponse } from "next/server";
import { savePracticeOverrideRecord } from "@/lib/persistence";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    practiceId?: string;
    diagnosisId?: string;
    infoPageTitle?: string;
    infoPageIntro?: string;
    consentIntro?: string;
    preferredMediaAssetIds?: string[];
  };

  if (!body.practiceId || !body.diagnosisId || !body.infoPageTitle || !body.infoPageIntro) {
    return NextResponse.json(
      { error: "Practice, diagnosis, title, and info intro are required." },
      { status: 400 }
    );
  }

  const result = await savePracticeOverrideRecord({
    practiceId: body.practiceId,
    diagnosisId: body.diagnosisId,
    infoPageTitle: body.infoPageTitle,
    infoPageIntro: body.infoPageIntro,
    consentIntro: body.consentIntro || "",
    preferredMediaAssetIds: body.preferredMediaAssetIds || []
  });

  return NextResponse.json(result);
}
