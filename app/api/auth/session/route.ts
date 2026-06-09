import { NextRequest, NextResponse } from "next/server";
import { getAppUserProfileRecord } from "@/lib/persistence";
import { getRequestActor } from "@/lib/request-auth";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase auth is not configured yet." },
      { status: 503 }
    );
  }

  const actor = await getRequestActor(request);
  if (!actor) {
    return NextResponse.json(
      { error: "Authentication is required." },
      { status: 401 }
    );
  }

  const result = await getAppUserProfileRecord({
    authUserId: actor.authUserId,
    email: actor.email
  });

  if (!result.profile) {
    return NextResponse.json(
      { error: "No ClearPath profile is connected to this login yet." },
      { status: 404 }
    );
  }

  return NextResponse.json({ profile: result.profile });
}
