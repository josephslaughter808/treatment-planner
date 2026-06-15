import type { ClearPathPackage, ClearPathTranslatorResult } from "@/lib/clearpath-package";

export function translateClearPathPackageToOpenDentalPreview(pkg: ClearPathPackage): ClearPathTranslatorResult {
  const preview = {
    targetSystem: "Open Dental",
    mode: "reviewed-import-preview",
    patient: {
      name: pkg.person.displayName,
      dateOfBirth: pkg.person.dateOfBirth,
      email: pkg.person.email,
      phone: pkg.person.phone,
      memberId: pkg.person.memberId
    },
    medicalHistoryNote: buildMedicalHistoryNote(pkg),
    allergies: pkg.healthProfile.allergies.map((item) => ({
      allergen: item.value.allergen,
      reaction: item.value.reaction,
      severity: item.value.severity,
      source: item.provenance.source
    })),
    medications: pkg.healthProfile.medications.map((item) => ({
      name: item.value.name,
      dose: item.value.dose,
      frequency: item.value.frequency,
      source: item.provenance.source
    })),
    conditions: pkg.healthProfile.medicalConditions.map((item) => ({
      name: item.value.name,
      notes: item.value.notes,
      source: item.provenance.source
    })),
    insurance: pkg.healthProfile.insurance.map((item) => item.value),
    documents: pkg.healthProfile.documents.map((item) => ({
      title: item.value.title,
      category: item.value.category,
      fileName: item.value.fileName,
      uploadedAt: item.value.uploadedAt
    }))
  };

  return {
    target: "open-dental",
    format: "open-dental-preview",
    generatedAt: new Date().toISOString(),
    fileName: `${safeFileName(pkg.person.displayName || "clearpath-open-dental")}-open-dental-preview.json`,
    mimeType: "application/json",
    payload: JSON.stringify(preview, null, 2),
    warnings: [
      "This is a reviewed-import preview only. Do not write directly to an Open Dental database from this payload.",
      "Open Dental write actions should go through an approved API workflow."
    ]
  };
}

function buildMedicalHistoryNote(pkg: ClearPathPackage) {
  const conditions = pkg.healthProfile.medicalConditions.map((item) => item.value.name).filter(Boolean);
  const medications = pkg.healthProfile.medications.map((item) => item.value.name).filter(Boolean);
  const allergies = pkg.healthProfile.allergies.map((item) => item.value.allergen).filter(Boolean);

  return [
    `ClearPath package ${pkg.packageId}`,
    `Generated: ${pkg.generatedAt}`,
    `Consent recipient: ${pkg.consent.recipientName}`,
    `Conditions: ${conditions.length ? conditions.join("; ") : "None reported"}`,
    `Medications: ${medications.length ? medications.join("; ") : "None reported"}`,
    `Allergies: ${allergies.length ? allergies.join("; ") : "None reported"}`
  ].join("\n");
}

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "clearpath-open-dental";
}

