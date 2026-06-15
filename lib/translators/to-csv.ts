import type { ClearPathPackage, ClearPathTranslatorResult } from "@/lib/clearpath-package";

export function translateClearPathPackageToCsv(pkg: ClearPathPackage): ClearPathTranslatorResult {
  const rows = [
    ["section", "id", "name", "details"],
    ...pkg.healthProfile.medicalConditions.map((item) => [
      "medical-condition",
      item.id,
      item.value.name,
      item.value.notes
    ]),
    ...pkg.healthProfile.medications.map((item) => [
      "medication",
      item.id,
      item.value.name,
      [item.value.dose, item.value.frequency].filter(Boolean).join(" ")
    ]),
    ...pkg.healthProfile.allergies.map((item) => [
      "allergy",
      item.id,
      item.value.allergen,
      [item.value.reaction, item.value.severity].filter(Boolean).join(" ")
    ]),
    ...pkg.healthProfile.insurance.map((item) => [
      "insurance",
      item.id,
      item.value.providerName,
      [item.value.memberId, item.value.groupNumber, item.value.subscriberName].filter(Boolean).join(" ")
    ]),
    ...pkg.healthProfile.emergencyContact.map((item) => [
      "emergency-contact",
      item.id,
      item.value.name,
      [item.value.relationship, item.value.phone].filter(Boolean).join(" ")
    ])
  ];

  return {
    target: "csv",
    format: "csv",
    generatedAt: new Date().toISOString(),
    fileName: `${safeFileName(pkg.person.displayName || "clearpath-profile")}.csv`,
    mimeType: "text/csv",
    payload: rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n"),
    warnings: []
  };
}

function escapeCsvCell(value: string) {
  if (!/[",\n]/.test(value)) {
    return value;
  }
  return `"${value.replaceAll('"', '""')}"`;
}

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "clearpath-profile";
}

