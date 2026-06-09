import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getAppUserProfileRecord,
  saveAppUserProfileRecord
} from "@/lib/persistence";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase auth is not configured yet." },
      { status: 503 }
    );
  }

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
    practiceId?: string;
    role?: string;
    title?: string;
    phone?: string;
    bio?: string;
    avatarDataUrl?: string;
  };

  const email = body.email?.trim();
  const password = body.password || "";
  const name = body.name?.trim();
  const role = body.role || "patient";

  if (role !== "patient") {
    return NextResponse.json(
      { error: "Provider accounts must be verified and provisioned by ClearPath." },
      { status: 403 }
    );
  }

  if (!email || !password || !name) {
    return NextResponse.json(
      { error: "Name, email, and password are required." },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase browser credentials are missing." },
      { status: 503 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name
      }
    }
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message || "Unable to create the account." },
      { status: 400 }
    );
  }

  if (!data.session) {
    return NextResponse.json({
      profile: null,
      requiresEmailConfirmation: true,
      message: "Your account was created. Check your email to confirm it, then return here and log in."
    });
  }

  const existingProfile = await getAppUserProfileRecord({
    authUserId: data.user.id,
    email: data.user.email || email
  });

  const profileResult = existingProfile.profile
    ? existingProfile
    : await saveAppUserProfileRecord({
        authUserId: data.user.id,
        practiceId: body.practiceId || "clearpath-default",
        name,
        email: data.user.email || email,
        role: "patient",
        title: body.title?.trim() || "Patient",
        phone: body.phone?.trim() || "",
        bio: body.bio?.trim() || "",
        avatarColor: "#0f766e",
        avatarDataUrl: body.avatarDataUrl
      });

  if (!profileResult.profile) {
    return NextResponse.json(
      { error: "Account was created, but ClearPath could not prepare this profile yet." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    profile: profileResult.profile,
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at ?? null
  });
}
