import type { NextRequest } from "next/server";
import { isPatientRole, isProviderWorkspaceRole, type UserRole } from "@/lib/account-directory";
import { createAdminSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export type RequestActor = {
  authUserId: string;
  email: string;
  appUserId: string | null;
  practiceId: string | null;
  practiceSlug: string | null;
  role: string | null;
};

export async function getRequestActor(request: NextRequest): Promise<RequestActor | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return null;
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data: userResult, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userResult.user) {
    return null;
  }

  const { data: appUser } = await supabase
    .from("app_users")
    .select("id, practice_id, role, practices(slug)")
    .eq("auth_user_id", userResult.user.id)
    .maybeSingle();

  return {
    authUserId: userResult.user.id,
    email: userResult.user.email || "",
    appUserId: appUser?.id ?? null,
    practiceId: appUser?.practice_id ?? null,
    practiceSlug: ((appUser?.practices as { slug?: string } | null)?.slug as string) ?? null,
    role: appUser?.role ?? null
  };
}

export function isProviderActor(actor: RequestActor | null) {
  return Boolean(
    actor?.practiceId &&
      actor.role &&
      isProviderWorkspaceRole(actor.role as UserRole)
  );
}

export function isPatientActor(actor: RequestActor | null) {
  return Boolean(actor?.role && isPatientRole(actor.role as UserRole));
}

export function isSamePracticeActor(actor: RequestActor | null, practiceId?: string | null) {
  return Boolean(
    isProviderActor(actor) &&
      actor?.practiceSlug &&
      practiceId &&
      actor.practiceSlug.toLowerCase() === practiceId.toLowerCase()
  );
}

export function isSameEmailActor(actor: RequestActor | null, email?: string | null) {
  return Boolean(actor?.email && email && actor.email.toLowerCase() === email.toLowerCase());
}

export function isSameAuthUserActor(actor: RequestActor | null, authUserId?: string | null) {
  return Boolean(actor?.authUserId && authUserId && actor.authUserId === authUserId);
}
