import type {
  AllergyEntry,
  ClearanceDocument,
  ConditionEntry,
  EmergencyContact,
  InsuranceEntry,
  MedicationEntry,
  PatientVault
} from "@/lib/patient-vault";

export const clearPathPackageVersion = "1.0.0";

export type ClearPathDataSource =
  | "patient-entered"
  | "caregiver-entered"
  | "provider-reviewed"
  | "provider-entered"
  | "imported"
  | "system-generated";

export type ClearPathPackageFormat =
  | "clearpath-json"
  | "human-readable-pdf"
  | "csv"
  | "open-dental-preview"
  | "fhir-json"
  | "hl7-v2"
  | "c-cda";

export type ClearPathConsentSectionKey =
  | "demographics"
  | "medical-conditions"
  | "medications"
  | "allergies"
  | "insurance"
  | "emergency-contact"
  | "documents"
  | "dependents"
  | "office-connections";

export type ClearPathAccessLevel = "hidden" | "view" | "download" | "import";

export type ClearPathConsentScope = {
  consentPackageId: string;
  packageType: "check-in" | "new-patient-intake" | "emergency-release" | "caregiver-access" | "record-request";
  recipientType: "practice" | "provider" | "caregiver" | "emergency-contact" | "external-system";
  recipientId: string;
  recipientName: string;
  purposeOfUse: "treatment" | "payment" | "operations" | "emergency" | "caregiving" | "patient-request";
  createdAt: string;
  expiresAt: string;
  sections: ClearPathConsentSection[];
};

export type ClearPathConsentSection = {
  sectionKey: ClearPathConsentSectionKey;
  accessLevel: ClearPathAccessLevel;
  includedItemIds: string[];
  excludedItemIds: string[];
  redactionNotes: string;
};

export type ClearPathProvenance = {
  source: ClearPathDataSource;
  sourceOrganizationId?: string;
  sourceOrganizationName?: string;
  sourceSystem?: string;
  sourceRecordId?: string;
  enteredAt: string;
  verifiedAt?: string;
};

export type ClearPathPerson = {
  personId: string;
  displayName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  memberId: string;
  walletCode: string;
  relationshipToAccount: "self" | "child" | "legal-dependent" | "spouse" | "adult-care-recipient" | "other";
};

export type ClearPathClinicalItem<T> = {
  id: string;
  value: T;
  provenance: ClearPathProvenance;
};

export type ClearPathPackage = {
  packageId: string;
  packageVersion: typeof clearPathPackageVersion;
  format: "clearpath-json";
  generatedAt: string;
  profileVersionId: string;
  person: ClearPathPerson;
  consent: ClearPathConsentScope;
  healthProfile: {
    medicalConditions: ClearPathClinicalItem<ConditionEntry>[];
    medications: ClearPathClinicalItem<MedicationEntry>[];
    allergies: ClearPathClinicalItem<AllergyEntry>[];
    insurance: ClearPathClinicalItem<InsuranceEntry>[];
    emergencyContact: ClearPathClinicalItem<EmergencyContact>[];
    documents: ClearPathClinicalItem<ClearanceDocument>[];
  };
  relationships: {
    dependents: {
      personId: string;
      displayName: string;
      relationship: string;
      legalAuthority: string;
      memberId: string;
      walletCode: string;
    }[];
  };
  auditContext: {
    generatedByAccountId?: string;
    generatedByRole?: "patient" | "provider" | "admin" | "system";
    sourceVaultUpdatedAt: string;
  };
};

export type ClearPathTranslatorTarget =
  | "pdf"
  | "csv"
  | "open-dental"
  | "fhir"
  | "hl7-v2"
  | "c-cda"
  | "x12"
  | "nemsis"
  | "dicom"
  | "ncpdp";

export type ClearPathTranslatorResult = {
  target: ClearPathTranslatorTarget;
  format: ClearPathPackageFormat;
  generatedAt: string;
  fileName?: string;
  mimeType?: string;
  payload: string;
  warnings: string[];
};

type BuildClearPathPackageInput = {
  vault: PatientVault;
  consent?: Partial<ClearPathConsentScope>;
  generatedByAccountId?: string;
  generatedByRole?: "patient" | "provider" | "admin" | "system";
};

export function buildClearPathPackage(input: BuildClearPathPackageInput): ClearPathPackage {
  const generatedAt = new Date().toISOString();
  const consent = buildConsentScope(input.vault, generatedAt, input.consent);
  const provenance = buildDefaultProvenance(generatedAt);

  return {
    packageId: createPackageId("pkg"),
    packageVersion: clearPathPackageVersion,
    format: "clearpath-json",
    generatedAt,
    profileVersionId: createProfileVersionId(input.vault, generatedAt),
    person: {
      personId: input.vault.profileId,
      displayName: input.vault.fullName,
      email: input.vault.email,
      phone: input.vault.phone,
      dateOfBirth: input.vault.dateOfBirth,
      memberId: input.vault.memberId,
      walletCode: input.vault.walletCode,
      relationshipToAccount: "self"
    },
    consent,
    healthProfile: {
      medicalConditions: input.vault.medicalConditions.map((item) => wrapClinicalItem(item.id, item, provenance)),
      medications: input.vault.medications.map((item) => wrapClinicalItem(item.id, item, provenance)),
      allergies: input.vault.allergies.map((item) => wrapClinicalItem(item.id, item, provenance)),
      insurance: [wrapClinicalItem("insurance-primary", input.vault.insurance, provenance)],
      emergencyContact: [wrapClinicalItem("emergency-contact-primary", input.vault.emergencyContact, provenance)],
      documents: input.vault.clearanceDocuments.map((item) => wrapClinicalItem(item.id, item, provenance))
    },
    relationships: {
      dependents: (input.vault.familyAccess?.dependents || []).map((dependent) => ({
        personId: dependent.vault.profileId,
        displayName: dependent.vault.fullName,
        relationship: dependent.relationship,
        legalAuthority: dependent.legalAuthority,
        memberId: dependent.vault.memberId,
        walletCode: dependent.vault.walletCode
      }))
    },
    auditContext: {
      generatedByAccountId: input.generatedByAccountId,
      generatedByRole: input.generatedByRole,
      sourceVaultUpdatedAt: input.vault.lastUpdatedAt
    }
  };
}

export function buildDefaultConsentSections(): ClearPathConsentSection[] {
  return [
    "demographics",
    "medical-conditions",
    "medications",
    "allergies",
    "insurance",
    "emergency-contact",
    "documents",
    "dependents",
    "office-connections"
  ].map((sectionKey) => ({
    sectionKey: sectionKey as ClearPathConsentSectionKey,
    accessLevel: "view",
    includedItemIds: [],
    excludedItemIds: [],
    redactionNotes: ""
  }));
}

function buildConsentScope(
  vault: PatientVault,
  generatedAt: string,
  consent?: Partial<ClearPathConsentScope>
): ClearPathConsentScope {
  const defaultExpiration = new Date(generatedAt);
  defaultExpiration.setDate(defaultExpiration.getDate() + 30);

  return {
    consentPackageId: consent?.consentPackageId || createPackageId("consent"),
    packageType: consent?.packageType || "check-in",
    recipientType: consent?.recipientType || "practice",
    recipientId: consent?.recipientId || "",
    recipientName: consent?.recipientName || "Unassigned recipient",
    purposeOfUse: consent?.purposeOfUse || "treatment",
    createdAt: consent?.createdAt || generatedAt,
    expiresAt: consent?.expiresAt || defaultExpiration.toISOString(),
    sections: consent?.sections || buildDefaultConsentSections()
  };
}

function buildDefaultProvenance(generatedAt: string): ClearPathProvenance {
  return {
    source: "patient-entered",
    enteredAt: generatedAt
  };
}

function wrapClinicalItem<T>(
  id: string,
  value: T,
  provenance: ClearPathProvenance
): ClearPathClinicalItem<T> {
  return {
    id,
    value,
    provenance
  };
}

function createProfileVersionId(vault: PatientVault, generatedAt: string) {
  const updatedAt = vault.lastUpdatedAt || generatedAt;
  return `${vault.profileId || "unknown"}:${updatedAt}`;
}

function createPackageId(prefix: string) {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 12);
  return `${prefix}-${randomPart}`;
}

