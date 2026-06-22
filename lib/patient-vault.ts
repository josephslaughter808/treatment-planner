export const vaultStorageKey = "clearpath-patient-vault";
export const officeCheckInStorageKey = "clearpath-office-checkins";
export const patientShareLinkStorageKey = "clearpath-patient-share-links";
export const integrationApprovalSessionStorageKey = "clearpath-integration-approval-session";
export const patientTimelineStorageKey = "clearpath-patient-timeline";
export const patientTimelineUpdatedEvent = "clearpath:timeline-updated";

export type MedicationEntry = {
  id: string;
  name: string;
  dose: string;
  frequency: string;
};

export type AllergyEntry = {
  id: string;
  allergen: string;
  reaction: string;
  severity: "mild" | "moderate" | "severe";
};

export type ConditionEntry = {
  id: string;
  name: string;
  notes: string;
  details?: ConditionDetail[];
};

export type ConditionDetailStatus = "active" | "managed" | "resolved" | "uncertain";

export type ConditionDetail = {
  id: string;
  name: string;
  diagnosedAt: string;
  status: ConditionDetailStatus;
  diagnosedBy: string;
  treatingProvider: string;
  treatmentSummary: string;
  relatedMedicationIds: string[];
  notes: string;
};

export type InsuranceEntry = {
  providerName: string;
  memberId: string;
  groupNumber: string;
  subscriberName: string;
};

export type EmergencyContact = {
  name: string;
  relationship: string;
  phone: string;
};

export type EmergencyDisclosure = {
  enabled: boolean;
  showAllergies: boolean;
  showConditions: boolean;
  showMedications: boolean;
  showEmergencyContact: boolean;
  showBloodThinners: boolean;
  responderMessage: string;
};

export type ClearanceStatus =
  | "not-requested"
  | "requested"
  | "received"
  | "expired"
  | "not-required";

export type ClearanceDocument = {
  id: string;
  category:
    | "cardiology-clearance"
    | "primary-care-clearance"
    | "medical-clearance"
    | "lab-results"
    | "imaging-report"
    | "anesthesia-clearance"
    | "other";
  title: string;
  requestedByPracticeId: string;
  requestedByPracticeName: string;
  requestedFromOffice: string;
  requestedAt: string;
  dueDate: string;
  status: ClearanceStatus;
  notes: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileDataUrl?: string;
  uploadedAt?: string;
};

export type PatientVault = {
  profileId: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  memberId: string;
  walletCode: string;
  lastUpdatedAt: string;
  medicalConditions: ConditionEntry[];
  medications: MedicationEntry[];
  allergies: AllergyEntry[];
  insurance: InsuranceEntry;
  emergencyContact: EmergencyContact;
  emergencyDisclosure: EmergencyDisclosure;
  clearanceDocuments: ClearanceDocument[];
  officeConnections: {
    practiceId: string;
    practiceName: string;
    lastVerifiedAt: string;
    notes: string;
  }[];
  familyAccess?: FamilyAccessState;
};

export type DependentProfile = {
  id: string;
  relationship: string;
  legalAuthority: string;
  vault: PatientVault;
};

export type AdultCareLink = {
  id: string;
  name: string;
  email: string;
  relationship: string;
  status: "pending-sent" | "pending-received" | "approved" | "rejected";
  requestedAt: string;
  respondedAt?: string;
};

export type FamilyAccessState = {
  dependents: DependentProfile[];
  adultLinks: AdultCareLink[];
};

export type CheckInRecord = {
  id: string;
  practiceId: string;
  practiceName: string;
  patientEmail: string;
  memberId: string;
  verifiedAt: string;
  status: "new-share" | "confirmed-no-changes" | "updated";
  insuranceConfirmed: boolean;
  historyConfirmed: boolean;
  medicationConfirmed: boolean;
  notes: string;
  profileSnapshot?: CheckInProfileSnapshot;
};

export type CheckInProfileSnapshot = {
  updatedAt: string;
  phone: string;
  dateOfBirth: string;
  conditions: string[];
  medications: string[];
  allergies: string[];
  insurance: {
    providerName: string;
    memberId: string;
    groupNumber: string;
    subscriberName: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
};

export type ShareLinkRecord = {
  id: string;
  patientEmail: string;
  practiceId: string;
  practiceName: string;
  accessCode: string;
  status: "active" | "used" | "revoked" | "expired";
  createdAt: string;
  expiresAt: string;
};

export type IntegrationApprovalSession = {
  id: string;
  practiceId: string;
  practiceName: string;
  approvingWorker: string;
  matchedAt: string;
  source: "check-in" | "wallet-scan";
  vault: PatientVault;
};

export type TimelineEvent =
  | {
      id: string;
      type: "initial-history";
      patientEmail: string;
      patientName: string;
      createdAt: string;
      summary: string;
    }
  | {
      id: string;
      type: "diagnosis";
      patientEmail: string;
      patientName: string;
      createdAt: string;
      diagnosisId: string;
      practiceId?: string;
      diagnosisLabel: string;
      commonName: string;
      descriptor: string;
      providerId?: string;
      providerName: string;
      diagnosisDate: string;
      toothLabel?: string;
      selectedTreatmentIds?: string[];
      conditionSections: { title: string; body: string }[];
      treatmentOptions: {
        label: string;
        summary: string;
        optionGroupLabel: string;
        visits: string[];
        temporaryNotes: string[];
        patientBenefits: string[];
        patientTradeoffs: string[];
      }[];
      treatmentRejected?: boolean;
      rejectedTreatmentLabels?: string[];
    };

export const emptyVault: PatientVault = {
  profileId: "vault-default",
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  memberId: createMemberId("CP"),
  walletCode: createMemberId("WAL"),
  lastUpdatedAt: "",
  medicalConditions: [],
  medications: [],
  allergies: [],
  insurance: {
    providerName: "",
    memberId: "",
    groupNumber: "",
    subscriberName: ""
  },
  emergencyContact: {
    name: "",
    relationship: "",
    phone: ""
  },
  emergencyDisclosure: {
    enabled: true,
    showAllergies: true,
    showConditions: true,
    showMedications: true,
    showEmergencyContact: true,
    showBloodThinners: true,
    responderMessage:
      "This emergency view contains only the information I have approved for first responders in an emergency."
  },
  clearanceDocuments: [],
  officeConnections: [],
  familyAccess: {
    dependents: [],
    adultLinks: []
  }
};

export function createMemberId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function makeBlankConditionDetail(): ConditionDetail {
  return {
    id: crypto.randomUUID(),
    name: "",
    diagnosedAt: "",
    status: "managed",
    diagnosedBy: "",
    treatingProvider: "",
    treatmentSummary: "",
    relatedMedicationIds: [],
    notes: ""
  };
}

export function readVaultFromStorage() {
  if (typeof window === "undefined") {
    return emptyVault;
  }

  const raw = window.localStorage.getItem(vaultStorageKey);
  if (!raw) {
    return emptyVault;
  }

  try {
    return JSON.parse(raw) as PatientVault;
  } catch {
    return emptyVault;
  }
}

export function writeVaultToStorage(vault: PatientVault) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(vaultStorageKey, JSON.stringify(vault));
}

export function readCheckInsFromStorage() {
  if (typeof window === "undefined") {
    return [] as CheckInRecord[];
  }

  const raw = window.localStorage.getItem(officeCheckInStorageKey);
  if (!raw) {
    return [] as CheckInRecord[];
  }

  try {
    return JSON.parse(raw) as CheckInRecord[];
  } catch {
    return [] as CheckInRecord[];
  }
}

export function writeCheckInsToStorage(records: CheckInRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(officeCheckInStorageKey, JSON.stringify(records));
}

export function readShareLinksFromStorage() {
  if (typeof window === "undefined") {
    return [] as ShareLinkRecord[];
  }

  const raw = window.localStorage.getItem(patientShareLinkStorageKey);
  if (!raw) {
    return [] as ShareLinkRecord[];
  }

  try {
    return JSON.parse(raw) as ShareLinkRecord[];
  } catch {
    return [] as ShareLinkRecord[];
  }
}

export function writeShareLinksToStorage(records: ShareLinkRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(patientShareLinkStorageKey, JSON.stringify(records));
}

export function readIntegrationApprovalSessionFromStorage() {
  if (typeof window === "undefined") {
    return null as IntegrationApprovalSession | null;
  }

  const raw = window.localStorage.getItem(integrationApprovalSessionStorageKey);
  if (!raw) {
    return null as IntegrationApprovalSession | null;
  }

  try {
    return JSON.parse(raw) as IntegrationApprovalSession;
  } catch {
    return null as IntegrationApprovalSession | null;
  }
}

export function writeIntegrationApprovalSessionToStorage(session: IntegrationApprovalSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(integrationApprovalSessionStorageKey, JSON.stringify(session));
}

export function clearIntegrationApprovalSessionFromStorage() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(integrationApprovalSessionStorageKey);
}

export function readTimelineFromStorage() {
  if (typeof window === "undefined") {
    return [] as TimelineEvent[];
  }

  const raw = window.localStorage.getItem(patientTimelineStorageKey);
  if (!raw) {
    return [] as TimelineEvent[];
  }

  try {
    return JSON.parse(raw) as TimelineEvent[];
  } catch {
    return [] as TimelineEvent[];
  }
}

export function writeTimelineToStorage(events: TimelineEvent[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(patientTimelineStorageKey, JSON.stringify(events));
  window.dispatchEvent(new CustomEvent(patientTimelineUpdatedEvent));
}

export function upsertTimelineEvent(event: TimelineEvent) {
  const existing = readTimelineFromStorage();
  const next = [event, ...existing.filter((item) => item.id !== event.id)].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
  writeTimelineToStorage(next);
  return next;
}

export function deleteTimelineEvent(eventId: string) {
  const next = readTimelineFromStorage().filter((event) => event.id !== eventId);
  writeTimelineToStorage(next);
  return next;
}

export function markTreatmentRejected(input: {
  diagnosisEventId: string;
  treatmentLabel: string;
}) {
  const events = readTimelineFromStorage();
  const next = events.map((event) => {
    if (event.type !== "diagnosis" || event.id !== input.diagnosisEventId) {
      return event;
    }

    const rejectedTreatmentLabels = Array.from(
      new Set([...(event.rejectedTreatmentLabels || []), input.treatmentLabel])
    );

    return {
      ...event,
      treatmentRejected: true,
      rejectedTreatmentLabels
    };
  });

  writeTimelineToStorage(next);
  return next;
}

export function makeBlankMedication(): MedicationEntry {
  return { id: crypto.randomUUID(), name: "", dose: "", frequency: "" };
}

export function makeBlankAllergy(): AllergyEntry {
  return { id: crypto.randomUUID(), allergen: "", reaction: "", severity: "moderate" };
}

export function makeBlankCondition(): ConditionEntry {
  return { id: crypto.randomUUID(), name: "", notes: "" };
}

export function makeBlankClearanceDocument(): ClearanceDocument {
  return {
    id: crypto.randomUUID(),
    category: "medical-clearance",
    title: "",
    requestedByPracticeId: "",
    requestedByPracticeName: "",
    requestedFromOffice: "",
    requestedAt: "",
    dueDate: "",
    status: "requested",
    notes: ""
  };
}
