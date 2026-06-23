import { NextResponse } from "next/server";
import {
  supabaseAccessTokenCookieKey,
  supabaseRefreshTokenCookieKey
} from "@/lib/auth-session-cookies";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(supabaseAccessTokenCookieKey, "", { maxAge: 0, path: "/" });
  response.cookies.set(supabaseRefreshTokenCookieKey, "", { maxAge: 0, path: "/" });
  return response;
}
