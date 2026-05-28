import { NextRequest, NextResponse } from "next/server";
import {
  getAppUserProfileRecord,
  saveAppUserProfileRecord
} from "@/lib/persistence";
import type { AccountProfile } from "@/lib/account-directory";
import {
  getRequestActor,
  isSameAuthUserActor,
  isSameEmailActor,
  isSamePracticeActor
} from "@/lib/request-auth";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const authUserId = request.nextUrl.searchParams.get("authUserId") || undefined;
  const email = request.nextUrl.searchParams.get("email") || undefined;

  if (!authUserId && !email) {
    return NextResponse.json(
      { error: "authUserId or email is required." },
      { status: 400 }
    );
  }

  const actor = await getRequestActor(request);
  if (isSupabaseConfigured() && !actor) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }
  if (
    isSupabaseConfigured() &&
    !isSameAuthUserActor(actor, authUserId) &&
    !isSameEmailActor(actor, email)
  ) {
    return NextResponse.json({ error: "You do not have access to this profile." }, { status: 403 });
  }

  const result = await getAppUserProfileRecord({ authUserId, email });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    authUserId?: string;
    practiceId?: string;
    name?: string;
    email?: string;
    role?: AccountProfile["role"];
    title?: string;
    phone?: string;
    bio?: string;
    avatarColor?: string;
    avatarDataUrl?: string;
  };

  if (!body.authUserId || !body.practiceId || !body.name || !body.email || !body.role) {
    return NextResponse.json(
      { error: "authUserId, practiceId, name, email, and role are required." },
      { status: 400 }
    );
  }

  const actor = await getRequestActor(request);
  if (isSupabaseConfigured() && !actor) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }
  if (isSupabaseConfigured() && !isSameAuthUserActor(actor, body.authUserId)) {
    return NextResponse.json({ error: "You do not have access to update this profile." }, { status: 403 });
  }
  if (isSupabaseConfigured() && !isSameEmailActor(actor, body.email)) {
    return NextResponse.json({ error: "Profiles can only be saved for your signed-in email." }, { status: 403 });
  }
  if (
    isSupabaseConfigured() &&
    actor?.practiceSlug &&
    !isSamePracticeActor(actor, body.practiceId)
  ) {
    return NextResponse.json(
      { error: "Profiles can only be saved inside your signed-in practice." },
      { status: 403 }
    );
  }
  if (isSupabaseConfigured() && actor?.role && actor.role !== body.role) {
    return NextResponse.json({ error: "Profile role changes are not allowed from this endpoint." }, { status: 403 });
  }

  const result = await saveAppUserProfileRecord({
    authUserId: body.authUserId,
    practiceId: body.practiceId,
    name: body.name,
    email: body.email,
    role: body.role,
    title: body.title || "",
    phone: body.phone || "",
    bio: body.bio || "",
    avatarColor: body.avatarColor || "#0f766e",
    avatarDataUrl: body.avatarDataUrl
  });

  return NextResponse.json(result);
}
