import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getAppUserProfileRecord,
  saveAppUserProfileRecord
} from "@/lib/persistence";
import { isPatientRole } from "@/lib/account-directory";
import {
  supabaseAccessTokenCookieKey,
  supabaseRefreshTokenCookieKey
} from "@/lib/auth-session-cookies";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const isFormSubmission = request.headers.get("content-type")?.includes("form") ?? false;

  if (!isSupabaseConfigured()) {
    return authFailure(request, isFormSubmission, "auth-unavailable", "Supabase auth is not configured yet.", 503);
  }

  let email = "";
  let password = "";
  if (isFormSubmission) {
    const form = await request.formData();
    email = String(form.get("email") || "").trim();
    password = String(form.get("password") || "");
  } else {
    const body = (await request.json()) as { email?: string; password?: string };
    email = body.email?.trim() || "";
    password = body.password || "";
  }

  if (!email || !password) {
    return authFailure(request, isFormSubmission, "invalid-login", "Email and password are required.", 400, email);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return authFailure(request, isFormSubmission, "auth-unavailable", "Supabase browser credentials are missing.", 503, email);
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
    if (isSupabaseConnectivityError(error)) {
      return authFailure(
        request,
        isFormSubmission,
        "auth-unavailable",
        "ClearPath cannot reach Supabase right now. Check the Supabase project URL/key in Vercel or whether the Supabase project is paused.",
        503,
        email
      );
    }

    return authFailure(request, isFormSubmission, "invalid-login", error?.message || "Unable to sign in.", 401, email);
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
    return authFailure(
      request,
      isFormSubmission,
      "profile-unavailable",
      "Sign-in worked, but ClearPath could not prepare this profile yet.",
      500,
      email
    );
  }

  const response = isFormSubmission
    ? NextResponse.redirect(
        new URL(isPatientRole(profileResult.profile.role) ? "/patient" : "/", getRequestOrigin(request)),
        303
      )
    : NextResponse.json({
        profile: profileResult.profile,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at ?? null
      });

  const secure = getRequestOrigin(request).startsWith("https://");
  response.cookies.set(supabaseAccessTokenCookieKey, data.session.access_token, {
    httpOnly: true,
    maxAge: Math.max(60, (data.session.expires_at || Math.floor(Date.now() / 1000) + 3600) - Math.floor(Date.now() / 1000)),
    path: "/",
    sameSite: "lax",
    secure
  });
  response.cookies.set(supabaseRefreshTokenCookieKey, data.session.refresh_token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secure
  });
  return response;
}

function authFailure(
  request: NextRequest,
  isFormSubmission: boolean,
  code: string,
  message: string,
  status: number,
  email = ""
) {
  if (!isFormSubmission) {
    return NextResponse.json({ error: message }, { status });
  }

  const loginUrl = new URL("/login", getRequestOrigin(request));
  loginUrl.searchParams.set("error", code);
  if (email) loginUrl.searchParams.set("email", email);
  return NextResponse.redirect(loginUrl, 303);
}

function getRequestOrigin(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "") || "http";
  return host ? `${protocol}://${host}` : request.nextUrl.origin;
}

function isSupabaseConnectivityError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 0;

  return (
    status >= 500 ||
    message.toLowerCase().includes("fetch") ||
    message.toLowerCase().includes("network") ||
    message.toLowerCase().includes("timeout") ||
    message.toLowerCase().includes("dns") ||
    message.toLowerCase().includes("unreachable")
  );
}
