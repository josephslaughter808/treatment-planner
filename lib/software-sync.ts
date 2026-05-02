import type {
  AllergyEntry,
  ClearanceDocument,
  ConditionEntry,
  InsuranceEntry,
  MedicationEntry,
  PatientVault
} from "@/lib/patient-vault";

export const chartSyncStorageKey = "clearpath-chart-sync";

export type DentalSoftware = "open-dental" | "dentrix" | "eaglesoft";

export type ChartSnapshot = {
  id: string;
  software: DentalSoftware;
  patientName: string;
  dateOfBirth: string;
  matchedAt: string;
  conditions: ConditionEntry[];
  medications: MedicationEntry[];
  allergies: AllergyEntry[];
  insurance: InsuranceEntry;
  clearances: ClearanceDocument[];
  pendingApprovalBy?: string;
  lastApprovedBy?: string;
  lastApprovedAt?: string;
  approvalHistory: ChartApprovalEvent[];
};

export type ChartDiffItem = {
  id: string;
  section: "conditions" | "medications" | "allergies" | "insurance" | "clearances";
  label: string;
  chartValue: string;
  vaultValue: string;
  status: "missing-in-chart" | "different" | "missing-in-vault";
};

export type ChartApprovalEvent = {
  id: string;
  approvedBy: string;
  approvedAt: string;
  section: ChartDiffItem["section"] | "all";
  label: string;
  previousValue: string;
  appliedValue: string;
};

export const softwareCatalog: { id: DentalSoftware; label: string; note: string }[] = [
  {
    id: "open-dental",
    label: "Open Dental",
    note: "Best first integration target because of the documented REST API and form import tooling."
  },
  {
    id: "dentrix",
    label: "Dentrix",
    note: "Needs connector work and validation around the charted medical-history workflow."
  },
  {
    id: "eaglesoft",
    label: "Eaglesoft",
    note: "Likely a tighter partner-style integration path, so we model the approval flow now and swap in the connector later."
  }
];

export function createSeededSnapshot(
  software: DentalSoftware,
  vault: PatientVault
): ChartSnapshot {
  return {
    id: `${software}-${vault.email || vault.fullName || "patient"}`,
    software,
    patientName: vault.fullName,
    dateOfBirth: vault.dateOfBirth,
    matchedAt: new Date().toISOString(),
    conditions: vault.medicalConditions.slice(0, 1),
    medications: vault.medications.slice(0, 1),
    allergies: vault.allergies.slice(0, 1),
    insurance: {
      providerName: vault.insurance.providerName,
      memberId: "",
      groupNumber: "",
      subscriberName: vault.insurance.subscriberName
    },
    clearances: vault.clearanceDocuments.filter((item) => item.status === "received").slice(0, 1),
    approvalHistory: []
  };
}

export function readChartSnapshots() {
  if (typeof window === "undefined") {
    return [] as ChartSnapshot[];
  }

  const raw = window.localStorage.getItem(chartSyncStorageKey);
  if (!raw) {
    return [] as ChartSnapshot[];
  }

  try {
    return JSON.parse(raw) as ChartSnapshot[];
  } catch {
    return [] as ChartSnapshot[];
  }
}

export function writeChartSnapshots(records: ChartSnapshot[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(chartSyncStorageKey, JSON.stringify(records));
}

export function upsertChartSnapshot(snapshot: ChartSnapshot) {
  const records = readChartSnapshots();
  const next = [...records.filter((record) => record.id !== snapshot.id), snapshot];
  writeChartSnapshots(next);
  return snapshot;
}

export function getOrCreateChartSnapshot(software: DentalSoftware, vault: PatientVault) {
  const key = `${software}-${vault.email || vault.fullName || "patient"}`;
  const existing = readChartSnapshots().find((record) => record.id === key);
  if (existing) {
    return existing;
  }

  const seeded = createSeededSnapshot(software, vault);
  upsertChartSnapshot(seeded);
  return seeded;
}

export function compareVaultToChart(vault: PatientVault, chart: ChartSnapshot) {
  const diffs: ChartDiffItem[] = [];

  diffs.push(
    ...compareNamedLists("conditions", vault.medicalConditions, chart.conditions),
    ...compareMedicationLists(vault.medications, chart.medications),
    ...compareAllergyLists(vault.allergies, chart.allergies),
    ...compareInsurance(vault.insurance, chart.insurance),
    ...compareClearances(vault.clearanceDocuments, chart.clearances)
  );

  return diffs;
}

function compareNamedLists(
  section: "conditions",
  vaultItems: ConditionEntry[],
  chartItems: ConditionEntry[]
) {
  return buildDiffs(
    section,
    vaultItems.map((item) => ({
      id: item.id,
      key: item.name.trim().toLowerCase(),
      label: item.name || "Unnamed condition",
      value: item.notes || item.name
    })),
    chartItems.map((item) => ({
      id: item.id,
      key: item.name.trim().toLowerCase(),
      label: item.name || "Unnamed condition",
      value: item.notes || item.name
    }))
  );
}

function compareMedicationLists(vaultItems: MedicationEntry[], chartItems: MedicationEntry[]) {
  return buildDiffs(
    "medications",
    vaultItems.map((item) => ({
      id: item.id,
      key: item.name.trim().toLowerCase(),
      label: item.name || "Unnamed medication",
      value: `${item.name} ${item.dose} ${item.frequency}`.trim()
    })),
    chartItems.map((item) => ({
      id: item.id,
      key: item.name.trim().toLowerCase(),
      label: item.name || "Unnamed medication",
      value: `${item.name} ${item.dose} ${item.frequency}`.trim()
    }))
  );
}

function compareAllergyLists(vaultItems: AllergyEntry[], chartItems: AllergyEntry[]) {
  return buildDiffs(
    "allergies",
    vaultItems.map((item) => ({
      id: item.id,
      key: item.allergen.trim().toLowerCase(),
      label: item.allergen || "Unnamed allergy",
      value: `${item.allergen} ${item.reaction} ${item.severity}`.trim()
    })),
    chartItems.map((item) => ({
      id: item.id,
      key: item.allergen.trim().toLowerCase(),
      label: item.allergen || "Unnamed allergy",
      value: `${item.allergen} ${item.reaction} ${item.severity}`.trim()
    }))
  );
}

function compareInsurance(vaultInsurance: InsuranceEntry, chartInsurance: InsuranceEntry) {
  const pairs: Array<{ label: string; chartValue: string; vaultValue: string }> = [
    {
      label: "Insurance provider",
      chartValue: chartInsurance.providerName,
      vaultValue: vaultInsurance.providerName
    },
    {
      label: "Member ID",
      chartValue: chartInsurance.memberId,
      vaultValue: vaultInsurance.memberId
    },
    {
      label: "Group number",
      chartValue: chartInsurance.groupNumber,
      vaultValue: vaultInsurance.groupNumber
    },
    {
      label: "Subscriber name",
      chartValue: chartInsurance.subscriberName,
      vaultValue: vaultInsurance.subscriberName
    }
  ];

  return pairs
    .filter((pair) => pair.chartValue !== pair.vaultValue)
    .map((pair, index) => ({
      id: `insurance-${index}`,
      section: "insurance" as const,
      label: pair.label,
      chartValue: pair.chartValue || "Not charted",
      vaultValue: pair.vaultValue || "Not provided",
      status:
        !pair.chartValue && pair.vaultValue
          ? ("missing-in-chart" as const)
          : !pair.vaultValue && pair.chartValue
            ? ("missing-in-vault" as const)
            : ("different" as const)
    }));
}

function compareClearances(vaultItems: ClearanceDocument[], chartItems: ClearanceDocument[]) {
  return buildDiffs(
    "clearances",
    vaultItems.map((item) => ({
      id: item.id,
      key: `${item.category}-${item.requestedFromOffice}`.trim().toLowerCase(),
      label: item.title || item.category,
      value: `${item.status} ${item.requestedFromOffice} ${item.fileName || ""}`.trim()
    })),
    chartItems.map((item) => ({
      id: item.id,
      key: `${item.category}-${item.requestedFromOffice}`.trim().toLowerCase(),
      label: item.title || item.category,
      value: `${item.status} ${item.requestedFromOffice} ${item.fileName || ""}`.trim()
    }))
  );
}

function buildDiffs(
  section: ChartDiffItem["section"],
  vaultItems: { id: string; key: string; label: string; value: string }[],
  chartItems: { id: string; key: string; label: string; value: string }[]
) {
  const diffs: ChartDiffItem[] = [];
  const chartMap = new Map(chartItems.map((item) => [item.key, item]));
  const vaultMap = new Map(vaultItems.map((item) => [item.key, item]));

  for (const vaultItem of vaultItems) {
    const chartMatch = chartMap.get(vaultItem.key);
    if (!chartMatch) {
      diffs.push({
        id: `${section}-${vaultItem.id}`,
        section,
        label: vaultItem.label,
        chartValue: "Not charted",
        vaultValue: vaultItem.value || vaultItem.label,
        status: "missing-in-chart"
      });
      continue;
    }

    if (chartMatch.value !== vaultItem.value) {
      diffs.push({
        id: `${section}-${vaultItem.id}`,
        section,
        label: vaultItem.label,
        chartValue: chartMatch.value,
        vaultValue: vaultItem.value,
        status: "different"
      });
    }
  }

  for (const chartItem of chartItems) {
    if (!vaultMap.has(chartItem.key)) {
      diffs.push({
        id: `${section}-${chartItem.id}`,
        section,
        label: chartItem.label,
        chartValue: chartItem.value || chartItem.label,
        vaultValue: "Not in latest vault",
        status: "missing-in-vault"
      });
    }
  }

  return diffs;
}
