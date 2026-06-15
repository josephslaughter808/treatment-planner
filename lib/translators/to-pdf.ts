import type { ClearPathPackage, ClearPathTranslatorResult } from "@/lib/clearpath-package";

export function translateClearPathPackageToPdfText(pkg: ClearPathPackage): ClearPathTranslatorResult {
  const lines = [
    "ClearPath Patient Summary",
    `Generated: ${pkg.generatedAt}`,
    `Patient: ${pkg.person.displayName}`,
    `DOB: ${pkg.person.dateOfBirth || "Not provided"}`,
    `Phone: ${pkg.person.phone || "Not provided"}`,
    `Email: ${pkg.person.email || "Not provided"}`,
    "",
    "Medical Conditions",
    ...formatList(pkg.healthProfile.medicalConditions.map((item) => formatNameAndNotes(item.value.name, item.value.notes))),
    "",
    "Medications",
    ...formatList(
      pkg.healthProfile.medications.map((item) =>
        formatNameAndNotes(item.value.name, [item.value.dose, item.value.frequency].filter(Boolean).join(" "))
      )
    ),
    "",
    "Allergies",
    ...formatList(
      pkg.healthProfile.allergies.map((item) =>
        formatNameAndNotes(item.value.allergen, [item.value.reaction, item.value.severity].filter(Boolean).join(" "))
      )
    ),
    "",
    "Insurance",
    ...formatList(pkg.healthProfile.insurance.map((item) => formatNameAndNotes(item.value.providerName, item.value.memberId))),
    "",
    "Emergency Contact",
    ...formatList(
      pkg.healthProfile.emergencyContact.map((item) =>
        formatNameAndNotes(item.value.name, [item.value.relationship, item.value.phone].filter(Boolean).join(" "))
      )
    )
  ];

  return {
    target: "pdf",
    format: "human-readable-pdf",
    generatedAt: new Date().toISOString(),
    fileName: `${safeFileName(pkg.person.displayName || "clearpath-summary")}.txt`,
    mimeType: "text/plain",
    payload: lines.join("\n"),
    warnings: ["This is the text source for the future PDF renderer."]
  };
}

function formatList(items: string[]) {
  const filtered = items.filter(Boolean);
  return filtered.length ? filtered.map((item) => `- ${item}`) : ["- None reported"];
}

function formatNameAndNotes(name: string, notes: string) {
  return [name, notes].filter(Boolean).join(": ");
}

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "clearpath-summary";
}

