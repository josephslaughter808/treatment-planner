import type { PatientVault, TimelineEvent } from "@/lib/patient-vault";

export type BodyRegion =
  | "whole-body"
  | "head-neck"
  | "chest"
  | "abdomen"
  | "pelvis"
  | "back"
  | "left-arm"
  | "right-arm"
  | "left-leg"
  | "right-leg"
  | "left-foot"
  | "right-foot";

export type DiagnosticStatus = "active" | "managed" | "resolved";
export type VerificationStatus =
  | "source-authenticated"
  | "clinician-confirmed"
  | "patient-reported"
  | "disputed";

export type DiagnosticTreatment = {
  id: string;
  name: string;
  status: "active" | "planned" | "completed" | "discontinued";
  startedAt?: string;
  completedAt?: string;
  provider?: string;
  note?: string;
};

export type DiagnosticRecord = {
  id: string;
  name: string;
  plainName: string;
  regions: BodyRegion[];
  status: DiagnosticStatus;
  verification: VerificationStatus;
  diagnosedAt?: string;
  diagnosedBy: string;
  sourceOrganization: string;
  lastReviewedAt?: string;
  summary: string;
  treatments: DiagnosticTreatment[];
  isSample?: boolean;
};

export const bodyRegionLabels: Record<BodyRegion, string> = {
  "whole-body": "Whole body and systemic",
  "head-neck": "Head, mouth and neck",
  chest: "Chest, heart and lungs",
  abdomen: "Abdomen and digestive system",
  pelvis: "Pelvis and reproductive system",
  back: "Back and spine",
  "left-arm": "Left arm and hand",
  "right-arm": "Right arm and hand",
  "left-leg": "Left leg and knee",
  "right-leg": "Right leg and knee",
  "left-foot": "Left foot and ankle",
  "right-foot": "Right foot and ankle"
};

const narrativeVaultEntries = [
  "Surgery history",
  "Pregnancy status",
  "Recent hospitalizations",
  "Other health history"
];

export function buildDiagnosticRecords(vault: PatientVault, timeline: TimelineEvent[]) {
  const timelineRecords = timeline
    .filter(
      (event): event is Extract<TimelineEvent, { type: "diagnosis" }> =>
        event.type === "diagnosis" &&
        (!vault.email || event.patientEmail.toLowerCase() === vault.email.toLowerCase())
    )
    .map(mapTimelineDiagnosis);

  const authenticatedNames = new Set(timelineRecords.map((record) => normalizeName(record.name)));
  const patientRecords = vault.medicalConditions
    .filter((condition) => condition.name.trim() && !narrativeVaultEntries.includes(condition.name))
    .filter((condition) => !authenticatedNames.has(normalizeName(condition.name)))
    .map((condition): DiagnosticRecord => ({
      id: `patient-${condition.id}`,
      name: condition.name.trim(),
      plainName: condition.name.trim(),
      regions: inferBodyRegions(condition.name),
      status: "managed",
      verification: "patient-reported",
      diagnosedBy: "Added by patient",
      sourceOrganization: "Patient health profile",
      lastReviewedAt: vault.lastUpdatedAt || undefined,
      summary: condition.notes.trim() || "Patient-reported condition awaiting clinical reconciliation.",
      treatments: []
    }));

  const records = [...timelineRecords, ...patientRecords];
  return records.length > 0 ? records : sampleDiagnosticRecords;
}

function mapTimelineDiagnosis(
  event: Extract<TimelineEvent, { type: "diagnosis" }>
): DiagnosticRecord {
  const treatments = event.treatmentOptions.map((option, index): DiagnosticTreatment => ({
    id: `${event.id}-treatment-${index}`,
    name: option.label,
    status: event.treatmentRejected ? "planned" : "active",
    provider: event.providerName,
    note: option.summary
  }));

  return {
    id: event.id,
    name: event.diagnosisLabel,
    plainName: event.commonName || event.diagnosisLabel,
    regions: inferBodyRegions(`${event.diagnosisLabel} ${event.toothLabel ?? ""}`),
    status: event.treatmentRejected ? "managed" : "active",
    verification: "source-authenticated",
    diagnosedAt: event.diagnosisDate,
    diagnosedBy: event.providerName,
    sourceOrganization: event.practiceId ? "Connected care office" : "Imported provider record",
    lastReviewedAt: event.createdAt,
    summary: event.descriptor,
    treatments
  };
}

export function inferBodyRegions(value: string): BodyRegion[] {
  const text = value.toLowerCase();

  if (matches(text, ["tooth", "teeth", "dental", "mouth", "jaw", "oral", "head", "neck", "migraine", "sinus"])) {
    return ["head-neck"];
  }
  if (matches(text, ["lung", "chest", "heart", "cardiac", "asthma", "pneum", "rib", "breast"])) {
    return ["chest"];
  }
  if (matches(text, ["stomach", "abdomen", "abdominal", "liver", "kidney", "colon", "bowel", "digest", "gallbladder"])) {
    return ["abdomen"];
  }
  if (matches(text, ["pelvis", "pelvic", "bladder", "uter", "ovary", "prostate", "pregnan", "reproductive"])) {
    return ["pelvis"];
  }
  if (matches(text, ["back", "spine", "spinal", "lumbar", "sciatica"])) {
    return ["back"];
  }
  if (matches(text, ["left hand", "left wrist", "left elbow", "left shoulder", "left arm"])) {
    return ["left-arm"];
  }
  if (matches(text, ["right hand", "right wrist", "right elbow", "right shoulder", "right arm"])) {
    return ["right-arm"];
  }
  if (matches(text, ["hand", "wrist", "elbow", "shoulder", "arm"])) {
    return ["left-arm", "right-arm"];
  }
  if (matches(text, ["left foot", "left ankle", "left toe"])) {
    return ["left-foot"];
  }
  if (matches(text, ["right foot", "right ankle", "right toe"])) {
    return ["right-foot"];
  }
  if (matches(text, ["foot", "feet", "ankle", "toe", "arch", "plantar"])) {
    return ["left-foot", "right-foot"];
  }
  if (matches(text, ["left knee", "left hip", "left leg", "left thigh"])) {
    return ["left-leg"];
  }
  if (matches(text, ["right knee", "right hip", "right leg", "right thigh"])) {
    return ["right-leg"];
  }
  if (matches(text, ["knee", "hip", "leg", "thigh"])) {
    return ["left-leg", "right-leg"];
  }

  return ["whole-body"];
}

function matches(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export const sampleDiagnosticRecords: DiagnosticRecord[] = [
  {
    id: "sample-pes-planus",
    name: "Pes planus",
    plainName: "Collapsed arches",
    regions: ["left-foot", "right-foot"],
    status: "managed",
    verification: "clinician-confirmed",
    diagnosedAt: "2018-04-12",
    diagnosedBy: "Dr. Maya Reynolds",
    sourceOrganization: "North Texas Orthopedics",
    lastReviewedAt: "2026-05-08",
    summary: "Both arches flatten while standing. Symptoms remain controlled with ongoing support.",
    treatments: [
      {
        id: "sample-orthotics",
        name: "Custom shoe inserts",
        status: "active",
        startedAt: "2018-05-02",
        provider: "North Texas Orthopedics",
        note: "Replace as wear or symptoms require."
      }
    ],
    isSample: true
  },
  {
    id: "sample-pneumothorax",
    name: "Left pneumothorax",
    plainName: "Collapsed left lung",
    regions: ["chest"],
    status: "resolved",
    verification: "source-authenticated",
    diagnosedAt: "2024-03-19",
    diagnosedBy: "Baylor emergency department",
    sourceOrganization: "Baylor University Medical Center",
    lastReviewedAt: "2024-04-11",
    summary: "A prior left lung collapse treated in the emergency department. Marked resolved but retained as relevant history.",
    treatments: [
      {
        id: "sample-chest-tube",
        name: "Chest tube placement",
        status: "completed",
        startedAt: "2024-03-19",
        completedAt: "2024-03-22",
        provider: "Baylor University Medical Center"
      }
    ],
    isSample: true
  },
  {
    id: "sample-ingrown-nail",
    name: "Ingrown left great toenail",
    plainName: "Ingrown toenail",
    regions: ["left-foot"],
    status: "resolved",
    verification: "source-authenticated",
    diagnosedAt: "2017-08-03",
    diagnosedBy: "Dr. Alan Pierce",
    sourceOrganization: "Lakewood Foot and Ankle",
    lastReviewedAt: "2017-08-24",
    summary: "Resolved after a minor office procedure with no ongoing treatment.",
    treatments: [
      {
        id: "sample-nail-procedure",
        name: "Partial nail removal",
        status: "completed",
        startedAt: "2017-08-03",
        completedAt: "2017-08-03",
        provider: "Lakewood Foot and Ankle"
      }
    ],
    isSample: true
  },
  {
    id: "sample-hypertension",
    name: "Essential hypertension",
    plainName: "High blood pressure",
    regions: ["whole-body"],
    status: "managed",
    verification: "clinician-confirmed",
    diagnosedAt: "2021-09-14",
    diagnosedBy: "Dr. Lena Morris",
    sourceOrganization: "Oak Lawn Primary Care",
    lastReviewedAt: "2026-04-20",
    summary: "Blood pressure remains under active monitoring and medication management.",
    treatments: [
      {
        id: "sample-bp-monitoring",
        name: "Medication and home monitoring",
        status: "active",
        startedAt: "2021-09-14",
        provider: "Oak Lawn Primary Care"
      }
    ],
    isSample: true
  }
];
