import { NextRequest, NextResponse } from "next/server";
import { createCaseFileSignedAccess } from "@/lib/persistence";
import { getRequestActor } from "@/lib/request-auth";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  const actor = await getRequestActor(request);

  if (isSupabaseConfigured() && !actor) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const { fileId } = await context.params;
  const result = await createCaseFileSignedAccess({
    fileId,
    actor: actor!,
    expiresIn: 120
  });

  return NextResponse.json(result);
}
