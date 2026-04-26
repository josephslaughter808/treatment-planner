import { NextRequest, NextResponse } from "next/server";
import {
  getAppUserProfileRecord,
  saveAppUserProfileRecord
} from "@/lib/persistence";
import type { AccountProfile } from "@/lib/account-directory";

export async function GET(request: NextRequest) {
  const authUserId = request.nextUrl.searchParams.get("authUserId") || undefined;
  const email = request.nextUrl.searchParams.get("email") || undefined;

  if (!authUserId && !email) {
    return NextResponse.json(
      { error: "authUserId or email is required." },
      { status: 400 }
    );
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
