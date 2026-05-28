import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Team management is outside the phase-one pilot scope." },
    { status: 404 }
  );
}
