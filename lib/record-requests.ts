import type { ClearPathConsentSectionKey } from "@/lib/clearpath-package";

export const recordRequestStatuses = [
  "draft",
  "pending-patient-approval",
  "approved",
  "partially-approved",
  "denied",
  "revoked",
  "expired",
  "awaiting-source-organization",
  "source-organization-responded",
  "ready-for-review",
  "reviewed",
  "completed",
  "cancelled"
] as const;

export type RecordRequestStatus = (typeof recordRequestStatuses)[number];

export const recordRequestDecisions = [
  "pending",
  "approved",
  "partially-approved",
  "denied",
  "revoked"
] as const;

export type RecordRequestDecision = (typeof recordRequestDecisions)[number];

export type RecordRequestUrgency = "routine" | "urgent";

export type RecordRequestPurposeOfUse =
  | "treatment"
  | "payment"
  | "operations"
  | "patient-request"
  | "care-coordination"
  | "other";

export type RecordRequestSectionKey = ClearPathConsentSectionKey;

export type RecordRequestSection = {
  id: string;
  sectionKey: RecordRequestSectionKey;
  requested: boolean;
  patientDecision: "pending" | "approved" | "denied";
  requestNote: string;
  decisionNote: string;
  decidedAt: string | null;
};

export type RecordRequestOrganization = {
  organizationId: string | null;
  name: string;
  department: string;
  contactName: string;
  email: string;
  phone: string;
  fax: string;
  address: string;
};

export type RecordRequest = {
  id: string;
  patientIdentityId: string;
  requestingPracticeId: string;
  requestingUserId: string | null;
  requestingProviderId: string | null;
  sourcePracticeId: string | null;
  sourceOrganization: RecordRequestOrganization;
  purposeOfUse: RecordRequestPurposeOfUse;
  purposeDetail: string;
  clinicalReason: string;
  urgency: RecordRequestUrgency;
  dueAt: string | null;
  expiresAt: string;
  status: RecordRequestStatus;
  patientDecision: RecordRequestDecision;
  patientDecisionAt: string | null;
  patientDecisionNote: string;
  consentPackageId: string | null;
  clearPathPackageId: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sections: RecordRequestSection[];
};

export type CreateRecordRequestInput = {
  patientIdentityId: string;
  requestingPracticeId: string;
  requestingUserId?: string | null;
  requestingProviderId?: string | null;
  sourcePracticeId?: string | null;
  sourceOrganization: RecordRequestOrganization;
  purposeOfUse: RecordRequestPurposeOfUse;
  purposeDetail?: string;
  clinicalReason: string;
  urgency?: RecordRequestUrgency;
  dueAt?: string | null;
  expiresAt: string;
  requestedSections: RecordRequestSectionKey[];
};

export type RecordRequestValidationResult = {
  valid: boolean;
  errors: string[];
};

export const recordRequestSectionLabels: Record<RecordRequestSectionKey, string> = {
  demographics: "Demographics",
  "medical-conditions": "Conditions and problems",
  medications: "Medications",
  allergies: "Allergies and adverse reactions",
  "surgeries-hospitalizations": "Surgeries and hospitalizations",
  "pregnancy-nursing": "Pregnancy and nursing information",
  "procedure-concerns": "Procedure concerns",
  "bleeding-healing": "Bleeding and healing history",
  "current-symptoms": "Current symptoms",
  "care-team": "Care team",
  "accessibility-needs": "Accessibility needs",
  insurance: "Insurance",
  "emergency-contact": "Emergency contact",
  documents: "Documents",
  dependents: "Dependent information",
  "office-connections": "Connected organizations",
  "laboratory-results": "Laboratory results",
  "imaging-reports": "Imaging reports",
  "treatment-notes": "Treatment notes",
  "provider-notes": "Provider notes",
  "discharge-summaries": "Discharge summaries",
  "care-plans": "Care plans",
  immunizations: "Immunizations",
  procedures: "Procedures"
};

export function validateCreateRecordRequest(
  input: CreateRecordRequestInput
): RecordRequestValidationResult {
  const errors: string[] = [];

  if (!input.patientIdentityId.trim()) {
    errors.push("A patient is required.");
  }
  if (!input.requestingPracticeId.trim()) {
    errors.push("A requesting organization is required.");
  }
  if (!input.sourceOrganization.name.trim()) {
    errors.push("A source organization is required.");
  }
  if (!input.clinicalReason.trim()) {
    errors.push("A clinical reason is required.");
  }
  if (!input.requestedSections.length) {
    errors.push("At least one record section must be requested.");
  }

  const expiresAt = Date.parse(input.expiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    errors.push("The request expiration must be a valid future date.");
  }

  if (input.dueAt) {
    const dueAt = Date.parse(input.dueAt);
    if (!Number.isFinite(dueAt)) {
      errors.push("The requested due date must be valid.");
    } else if (Number.isFinite(expiresAt) && dueAt > expiresAt) {
      errors.push("The requested due date cannot be after the expiration date.");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function isRecordRequestTerminal(status: RecordRequestStatus) {
  return ["denied", "revoked", "expired", "completed", "cancelled"].includes(status);
}

export function canPatientDecideRecordRequest(status: RecordRequestStatus) {
  return status === "pending-patient-approval";
}
