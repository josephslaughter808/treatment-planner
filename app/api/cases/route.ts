import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Case and treatment package creation is outside the phase-one pilot scope." },
    { status: 404 }
  );
}
