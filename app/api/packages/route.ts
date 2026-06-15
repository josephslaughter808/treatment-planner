import { NextRequest, NextResponse } from "next/server";
import {
  buildClearPathPackage,
  validateClearPathPackage,
  type ClearPathPackageFormat
} from "@/lib/clearpath-package";
import { getPatientVaultRecord, logAuditEvent } from "@/lib/persistence";
import {
  getRequestActor,
  isSameEmailActor,
  isSamePracticeActor
} from "@/lib/request-auth";
import { isSupabaseConfigured, shouldRequireSupabase } from "@/lib/supabase";
import {
  translateClearPathPackageToCsv,
  translateClearPathPackageToOpenDentalPreview,
  translateClearPathPackageToPdfText
} from "@/lib/translators";

type PackageResponseFormat = "clearpath-json" | "csv" | "pdf-text" | "open-dental-preview";

export async function GET(request: NextRequest) {
  if (shouldRequireSupabase() && !isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase auth is required before package generation is available." },
      { status: 503 }
    );
  }

  const email = request.nextUrl.searchParams.get("email");
  const practiceId = request.nextUrl.searchParams.get("practiceId");
  const requestedFormat = normalizePackageFormat(request.nextUrl.searchParams.get("format"));

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const actor = await getRequestActor(request);
  if (isSupabaseConfigured() && !actor) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (
    isSupabaseConfigured() &&
    !isSameEmailActor(actor, email) &&
    !isSamePracticeActor(actor, practiceId)
  ) {
    return NextResponse.json({ error: "You do not have access to generate this package." }, { status: 403 });
  }

  const result = await getPatientVaultRecord(email, actor);
  if (!result.vault) {
    return NextResponse.json({ error: "Patient vault was not found." }, { status: 404 });
  }

  const pkg = buildClearPathPackage({
    vault: result.vault,
    generatedByAccountId: actor?.appUserId ?? actor?.authUserId,
    generatedByRole: actor?.role === "patient" || actor?.role === "admin" ? actor.role : actor?.practiceId ? "provider" : "system",
    consent: {
      recipientId: practiceId || actor?.practiceSlug || "",
      recipientName: practiceId || actor?.practiceSlug || (isSameEmailActor(actor, email) ? "Patient self-export" : "Unassigned recipient"),
      recipientType: practiceId ? "practice" : "external-system",
      purposeOfUse: practiceId ? "treatment" : "patient-request"
    }
  });
  const validation = validateClearPathPackage(pkg);

  if (!validation.valid) {
    return NextResponse.json(
      { error: "ClearPath package validation failed.", validation },
      { status: 422 }
    );
  }

  const translated = translatePackage(pkg, requestedFormat);

  await logAuditEvent({
    actor,
    action: "clearpath_package_generated",
    resourceType: "clearpath_package",
    resourceId: pkg.packageId,
    patientIdentityId: result.vault.profileId,
    metadata: {
      format: requestedFormat,
      packageVersion: pkg.packageVersion,
      validationWarnings: validation.warnings
    }
  });

  return NextResponse.json({
    mode: result.mode,
    format: requestedFormat,
    package: requestedFormat === "clearpath-json" ? pkg : undefined,
    translated,
    validation
  });
}

function normalizePackageFormat(format: string | null): PackageResponseFormat {
  if (format === "csv" || format === "pdf-text" || format === "open-dental-preview") {
    return format;
  }
  return "clearpath-json";
}

function translatePackage(pkg: ReturnType<typeof buildClearPathPackage>, format: PackageResponseFormat) {
  if (format === "csv") {
    return translateClearPathPackageToCsv(pkg);
  }
  if (format === "pdf-text") {
    return translateClearPathPackageToPdfText(pkg);
  }
  if (format === "open-dental-preview") {
    return translateClearPathPackageToOpenDentalPreview(pkg);
  }

  return {
    target: "clearpath-json",
    format: "clearpath-json" as ClearPathPackageFormat,
    generatedAt: pkg.generatedAt,
    fileName: `${pkg.packageId}.json`,
    mimeType: "application/json",
    payload: JSON.stringify(pkg, null, 2),
    warnings: []
  };
}
