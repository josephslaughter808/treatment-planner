import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  _context: { params: Promise<{ fileId: string }> }
) {
  return NextResponse.json(
    { error: "Case file access is outside the phase-one pilot scope." },
    { status: 404 }
  );
}
