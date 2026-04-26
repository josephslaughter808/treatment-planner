import { NextRequest, NextResponse } from "next/server";
import {
  buildMockPlan,
  extractFileNames,
  parseRequestPayload
} from "@/lib/mock-analysis";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const payload = parseRequestPayload(formData);

  if (!payload.patientName || !payload.practiceId || !payload.diagnosisId) {
    return NextResponse.json(
      { error: "Patient name, practice, and diagnosis are required." },
      { status: 400 }
    );
  }

  if (payload.selectedTreatmentIds.length === 0) {
    return NextResponse.json(
      { error: "Select at least one treatment option to build the education package." },
      { status: 400 }
    );
  }

  const files = formData.getAll("images").filter((value): value is File => value instanceof File);
  const imagingNames = extractFileNames(files);
  const response = buildMockPlan(payload, imagingNames);

  return NextResponse.json(response);
}
