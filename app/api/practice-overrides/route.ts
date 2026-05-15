import { NextRequest, NextResponse } from "next/server";
import { practicesById } from "@/lib/clinical-catalog";
import { savePracticeOverrideRecord } from "@/lib/persistence";
import { createAdminSupabaseClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    practiceId?: string;
    contentId?: string;
    contentType?: "diagnosis" | "treatment";
    infoPageTitle?: string;
    infoPageIntro?: string;
    consentIntro?: string;
    preferredMediaAssetIds?: string[];
    generalAssetIds?: string[];
    designConfig?: Record<string, unknown>;
  };

  if (!body.practiceId || !body.contentId || !body.contentType || !body.infoPageTitle || !body.infoPageIntro) {
    return NextResponse.json(
      { error: "Practice, page, title, and info intro are required." },
      { status: 400 }
    );
  }

  const result = await savePracticeOverrideRecord({
    practiceId: body.practiceId,
    contentId: body.contentId,
    contentType: body.contentType,
    infoPageTitle: body.infoPageTitle,
    infoPageIntro: body.infoPageIntro,
    consentIntro: body.consentIntro || "",
    preferredMediaAssetIds: body.preferredMediaAssetIds || [],
    generalAssetIds: body.generalAssetIds || [],
    designConfig: body.designConfig || {}
  });

  return NextResponse.json(result);
}

export async function GET(request: NextRequest) {
  const practiceId = request.nextUrl.searchParams.get("practiceId");
  const contentId = request.nextUrl.searchParams.get("contentId");
  const contentType = request.nextUrl.searchParams.get("contentType");

  if (!practiceId || !contentId || (contentType !== "diagnosis" && contentType !== "treatment")) {
    return NextResponse.json({ override: null });
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ override: null, mode: "mock" });
  }

  const practice = practicesById[practiceId];
  if (!practice) {
    return NextResponse.json({ override: null }, { status: 404 });
  }

  const slug = practice.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const { data: practiceRow, error: practiceError } = await supabase
    .from("practices")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (practiceError) {
    return NextResponse.json({ error: practiceError.message }, { status: 500 });
  }

  if (!practiceRow) {
    return NextResponse.json({ override: null });
  }

  const key = `${contentType}:${contentId}`;
  const { data: override, error } = await supabase
    .from("practice_overrides")
    .select(
      "diagnosis_id, info_page_title, info_page_intro, consent_intro, preferred_media_asset_ids, general_asset_ids, design_config"
    )
    .eq("practice_id", practiceRow.id)
    .eq("diagnosis_id", key)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!override) {
    return NextResponse.json({ override: null });
  }

  return NextResponse.json({
    override: {
      diagnosisId: override.diagnosis_id,
      contentType,
      infoPageTitle: override.info_page_title,
      infoPageIntro: override.info_page_intro,
      consentIntro: override.consent_intro || "",
      preferredMediaAssetIds: override.preferred_media_asset_ids || [],
      generalAssetIds: override.general_asset_ids || [],
      designConfig: override.design_config || {}
    }
  });
}
