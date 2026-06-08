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
    email?: string;
    password?: string;
  };
  const email = body.email?.trim();
  const password = body.password || "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
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

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.user || !data.session) {
    return NextResponse.json(
      { error: error?.message || "Unable to sign in." },
      { status: 401 }
    );
  }

  let profileResult = await getAppUserProfileRecord({
    authUserId: data.user.id,
    email: data.user.email || email
  });

  if (!profileResult.profile) {
    profileResult = await saveAppUserProfileRecord({
      authUserId: data.user.id,
      practiceId: "clearpath-default",
      name:
        typeof data.user.user_metadata?.name === "string"
          ? data.user.user_metadata.name
          : data.user.email?.split("@")[0] || "Patient",
      email: data.user.email || email,
      role: "patient",
      title: "Patient",
      phone: "",
      bio: "",
      avatarColor: "#0f766e"
    });
  }

  if (!profileResult.profile) {
    return NextResponse.json(
      { error: "Sign-in worked, but ClearPath could not prepare this profile yet." },
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
