import { NextRequest, NextResponse } from "next/server";
import {
  type AccountProfile,
  demoAccounts,
  isPatientRole,
  localAuthCookieKey
} from "@/lib/account-directory";

export async function GET(request: NextRequest) {
  if (!isLocalAuthEnabled()) {
    return NextResponse.json({ error: "Local demo login is disabled." }, { status: 404 });
  }

  const accountId = request.nextUrl.searchParams.get("account");
  const account = demoAccounts.find((candidate) => candidate.id === accountId);
  return account
    ? createSessionResponse(request, account)
    : NextResponse.json({ error: "Demo account was not found." }, { status: 400 });
}

export async function POST(request: NextRequest) {
  if (!isLocalAuthEnabled()) {
    return NextResponse.json({ error: "Local demo login is disabled." }, { status: 404 });
  }

  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const account = demoAccounts.find(
    (candidate) => candidate.email.toLowerCase() === email && candidate.password === password
  );

  if (!account) {
    const loginUrl = new URL("/login", getRequestOrigin(request));
    loginUrl.searchParams.set("error", "invalid-login");
    loginUrl.searchParams.set("email", email);
    return NextResponse.redirect(loginUrl, 303);
  }

  return createSessionResponse(request, account);
}

function createSessionResponse(request: NextRequest, account: AccountProfile) {
  const origin = getRequestOrigin(request);
  const destination = new URL(isPatientRole(account.role) ? "/patient" : "/", origin);
  const response = NextResponse.redirect(destination, 303);
  response.cookies.set(localAuthCookieKey, account.id, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secure: origin.startsWith("https://")
  });
  return response;
}

function isLocalAuthEnabled() {
  return process.env.NEXT_PUBLIC_CLEARPATH_ALLOW_LOCAL_AUTH === "true";
}

function getRequestOrigin(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const protocol =
    request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "") || "http";
  return host ? `${protocol}://${host}` : request.nextUrl.origin;
}
