import {
  conditionCatalog,
  conditionsById,
  consentsById,
  getPracticeOverride,
  getTreatmentsForDiagnosis,
  mediaById,
  practicesById,
  specialtyById,
  treatmentsById
} from "@/lib/clinical-catalog";

export type IntakePayload = {
  patientName: string;
  patientEmail: string;
  dateOfBirth: string;
  practiceId: string;
  providerId: string;
  providerLabel: string;
  diagnosisId: string;
  toothLabel: string;
  selectedTreatmentIds: string[];
};

export type AnalysisResponse = {
  packageVersionId: string;
  diagnosisId: string;
  providerLabel: string;
  toothLabel: string;
  selectedTreatmentIds: string[];
  headline: string;
  summary: string;
  specialtyLabel: string;
  packageSource: string;
  fairnessNote: string;
  diagnosisSections: { title: string; body: string }[];
  treatmentCards: {
    label: string;
    summary: string;
    optionGroupLabel: string;
    visits: string[];
    temporaryNotes: string[];
    patientBenefits: string[];
    patientTradeoffs: string[];
  }[];
  mediaPlan: {
    title: string;
    type: string;
    description: string;
    duration?: string;
  }[];
  consentPreview: {
    title: string;
    intro: string;
    sections: string[];
  }[];
  commonQuestions: string[];
  practiceDefaults: string[];
  aiQnaGuidance: string;
};

export function parseRequestPayload(formData: FormData): IntakePayload {
  return {
    patientName: readValue(formData, "patientName"),
    patientEmail: readValue(formData, "patientEmail"),
    dateOfBirth: readValue(formData, "dateOfBirth"),
    practiceId: readValue(formData, "practiceId"),
    providerId: readValue(formData, "providerId"),
    providerLabel: readValue(formData, "providerLabel"),
    diagnosisId: readValue(formData, "diagnosisId"),
    toothLabel: readValue(formData, "toothLabel"),
    selectedTreatmentIds: formData
      .getAll("selectedTreatmentIds")
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean)
  };
}

export function extractFileNames(files: File[]) {
  return files.filter((file) => file.size > 0).map((file) => file.name);
}

export function buildMockPlan(
  payload: IntakePayload,
  imagingNames: string[]
): AnalysisResponse {
  const practice = practicesById[payload.practiceId];
  const diagnosis = conditionsById[payload.diagnosisId];
  const specialty = diagnosis ? specialtyById[diagnosis.specialtyId] : undefined;
  const treatmentCards = payload.selectedTreatmentIds
    .map((id) => treatmentsById[id])
    .filter((option) => Boolean(option));
  const override = getPracticeOverride(payload.practiceId, payload.diagnosisId);
  const equalOptions = getTreatmentsForDiagnosis(payload.diagnosisId);

  const mediaIds = new Set([
    ...(diagnosis?.mediaAssetIds ?? []),
    ...(override?.preferredMediaAssetIds ?? []),
    ...treatmentCards.flatMap((card) => card.mediaAssetIds)
  ]);

  const consents = treatmentCards.map((card) => {
    const consent =
      consentsById[override?.consentTemplateId || card.consentTemplateId] ??
      consentsById[card.consentTemplateId];

    return {
      title: consent.title,
      intro:
        override?.consentIntro ||
        "This consent preview comes from the preset package that can be used as-is or edited by the practice.",
      sections: consent.sections
    };
  });

  const sameGroup =
    treatmentCards.length > 1 &&
    new Set(treatmentCards.map((card) => card.optionGroup)).size === 1;

  return {
    packageVersionId: `${payload.practiceId}-${payload.diagnosisId}-${payload.selectedTreatmentIds.sort().join("-")}`,
    diagnosisId: payload.diagnosisId,
    providerLabel: payload.providerLabel,
    toothLabel: payload.toothLabel,
    selectedTreatmentIds: payload.selectedTreatmentIds,
    headline: `Education package for ${payload.patientName || "this patient"}`,
    summary: buildSummary(
      diagnosis?.label,
      practice?.name,
      imagingNames,
      payload.toothLabel,
      payload.providerLabel,
      payload.patientEmail
    ),
    specialtyLabel: specialty?.name || "Unassigned specialty",
    packageSource: override
      ? `${practice?.name} custom default`
      : practice?.defaultPackageSource === "custom"
        ? `${practice?.name} branded default`
        : "ClearPath generic default",
    fairnessNote: sameGroup
      ? `The selected treatments are being presented as equal ${treatmentCards[0]?.optionGroupLabel.toLowerCase()} and should be shown without bias in the patient-facing package.`
      : equalOptions.length > 1
        ? "This diagnosis has multiple preset options in the library. If the doctor believes they are clinically equal, they should be selected together so the package presents them side by side."
        : "The current selection can still be presented fairly, but the options are not marked as equal equivalents in the starter library.",
    diagnosisSections: [
      ...(override
        ? [
            {
              title: override.infoPageTitle,
              body: override.infoPageIntro
            }
          ]
        : []),
      ...(diagnosis?.educationSections ?? [])
    ],
    treatmentCards: treatmentCards.map((card) => ({
      label: card.label,
      summary: card.summary,
      optionGroupLabel: card.optionGroupLabel,
      visits: card.visits,
      temporaryNotes: card.temporaryNotes,
      patientBenefits: card.patientBenefits,
      patientTradeoffs: card.patientTradeoffs
    })),
    mediaPlan: [...mediaIds]
      .map((id) => mediaById[id])
      .filter(Boolean)
      .map((asset) => ({
        title: asset.title,
        type: asset.type,
        description: asset.description,
        duration: asset.duration
      })),
    consentPreview: dedupeConsents(consents),
    commonQuestions: diagnosis?.commonQuestions ?? [],
    practiceDefaults: [
      `${practice?.name || "This office"} can use the generic ClearPath library immediately at signup.`,
      "Practices can create an office-specific info page for a diagnosis and save it as the new default.",
      "Practices can edit or replace the consent package while still reusing ClearPath videos and diagrams."
    ],
    aiQnaGuidance:
      "An AI question box could be useful only with tight guardrails. A safer first version is provider-reviewed FAQs plus office-specific callback language, not open-ended clinical advice."
  };
}

export function getDiagnosesForSelection() {
  return conditionCatalog;
}

function readValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function buildSummary(
  diagnosisLabel?: string,
  practiceName?: string,
  imagingNames?: string[],
  toothLabel?: string,
  providerLabel?: string,
  patientEmail?: string
) {
  const imagingLine =
    imagingNames && imagingNames.length > 0
      ? ` Diagnostic imaging is included for both office review and patient download: ${imagingNames.join(", ")}.`
      : "";
  const toothLine = toothLabel ? ` The package is labeled for ${toothLabel}.` : "";
  const providerLine = providerLabel ? ` The diagnosis is recorded under ${providerLabel}.` : "";
  const profileLine = patientEmail ? ` Patient email: ${patientEmail}.` : "";

  return `This package gives ${practiceName || "the office"} a preset explanation for ${diagnosisLabel || "the selected diagnosis"}, including reusable videos, diagrams, treatment comparisons, diagnostic imaging access, and consent language that can become the practice default.${profileLine}${providerLine}${toothLine}${imagingLine}`;
}

function dedupeConsents(
  consents: {
    title: string;
    intro: string;
    sections: string[];
  }[]
) {
  const seen = new Set<string>();
  return consents.filter((consent) => {
    if (seen.has(consent.title)) {
      return false;
    }

    seen.add(consent.title);
    return true;
  });
}
