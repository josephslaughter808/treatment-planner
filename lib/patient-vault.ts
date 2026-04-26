export const vaultStorageKey = "clearpath-patient-vault";
export const officeCheckInStorageKey = "clearpath-office-checkins";
export const patientShareLinkStorageKey = "clearpath-patient-share-links";

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
  officeConnections: {
    practiceId: string;
    practiceName: string;
    lastVerifiedAt: string;
    notes: string;
  }[];
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
  officeConnections: []
};

export function createMemberId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
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

export function makeBlankMedication(): MedicationEntry {
  return { id: crypto.randomUUID(), name: "", dose: "", frequency: "" };
}

export function makeBlankAllergy(): AllergyEntry {
  return { id: crypto.randomUUID(), allergen: "", reaction: "", severity: "moderate" };
}

export function makeBlankCondition(): ConditionEntry {
  return { id: crypto.randomUUID(), name: "", notes: "" };
}
