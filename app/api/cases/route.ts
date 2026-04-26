import { NextRequest, NextResponse } from "next/server";
import { buildMockPlan, parseRequestPayload } from "@/lib/mock-analysis";
import { saveCaseRecord } from "@/lib/persistence";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const payload = parseRequestPayload(formData);
  const files = formData.getAll("images").filter((value): value is File => value instanceof File);
  const analysisJson = formData.get("analysis");

  const analysis =
    typeof analysisJson === "string"
      ? (JSON.parse(analysisJson) as ReturnType<typeof buildMockPlan>)
      : buildMockPlan(payload, files.map((file) => file.name));

  const result = await saveCaseRecord(payload, analysis, files);

  return NextResponse.json(result);
}
