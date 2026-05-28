import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Diagnosis and treatment package previews are outside the phase-one pilot scope." },
    { status: 404 }
  );
}
