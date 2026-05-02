"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  compareVaultToChart,
  getOrCreateChartSnapshot,
  softwareCatalog,
  upsertChartSnapshot,
  type ChartDiffItem,
  type ChartSnapshot,
  type DentalSoftware
} from "@/lib/software-sync";
import {
  clearIntegrationApprovalSessionFromStorage,
  readIntegrationApprovalSessionFromStorage,
  readVaultFromStorage,
  type PatientVault
} from "@/lib/patient-vault";

export function IntegrationHubView() {
  const { currentUser } = useAuth();
  const [approvalSession, setApprovalSession] = useState(() => readIntegrationApprovalSessionFromStorage());
  const [vault] = useState<PatientVault>(() => approvalSession?.vault ?? readVaultFromStorage());
  const [software, setSoftware] = useState<DentalSoftware>("open-dental");
  const [approvalName, setApprovalName] = useState(
    approvalSession?.approvingWorker ?? currentUser?.name ?? ""
  );
  const [chartSnapshot, setChartSnapshot] = useState<ChartSnapshot | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const selectedSoftware = softwareCatalog.find((item) => item.id === software);
  const effectiveApprovalName = approvalName.trim() || currentUser?.name || "";

  const isMatched =
    Boolean(vault.fullName) &&
    Boolean(vault.dateOfBirth) &&
    Boolean(chartSnapshot) &&
    chartSnapshot?.patientName.trim().toLowerCase() === vault.fullName.trim().toLowerCase() &&
    chartSnapshot?.dateOfBirth === vault.dateOfBirth;

  const diffs = useMemo(
    () => (chartSnapshot ? compareVaultToChart(vault, chartSnapshot) : []),
    [chartSnapshot, vault]
  );
  const canApprove = isMatched && Boolean(effectiveApprovalName);

  function runMatch() {
    const snapshot = getOrCreateChartSnapshot(software, vault);
    setChartSnapshot(snapshot);
    setMessage(
      `Matched ${vault.fullName || "patient"} in ${selectedSoftware?.label || "software"} using name and date of birth.`
    );
  }

  function approveAndApplyDiff(diffId: string) {
    if (!chartSnapshot || !canApprove) {
      return;
    }

    const next = structuredClone(chartSnapshot) as ChartSnapshot;
    const diff = diffs.find((item) => item.id === diffId);
    if (!diff) {
      return;
    }

    if (diff.section === "conditions") {
      next.conditions = vault.medicalConditions;
    }
    if (diff.section === "medications") {
      next.medications = vault.medications;
    }
    if (diff.section === "allergies") {
      next.allergies = vault.allergies;
    }
    if (diff.section === "insurance") {
      next.insurance = vault.insurance;
    }
    if (diff.section === "clearances") {
      next.clearances = vault.clearanceDocuments;
    }

    const approvedAt = new Date().toISOString();
    const approver = effectiveApprovalName || "Office user";
    next.pendingApprovalBy = approver;
    next.lastApprovedBy = approver;
    next.lastApprovedAt = approvedAt;
    next.approvalHistory = [
      buildApprovalEvent(diff, approver, approvedAt),
      ...(next.approvalHistory || [])
    ];
    upsertChartSnapshot(next);
    setChartSnapshot(next);
    setMessage(`Applied ${diff.label} to the chart after approval by ${next.lastApprovedBy}.`);
  }

  function approveAllChanges() {
    if (!chartSnapshot || !canApprove) {
      return;
    }

    const approvedAt = new Date().toISOString();
    const approver = effectiveApprovalName || "Office user";
    const next: ChartSnapshot = {
      ...chartSnapshot,
      conditions: vault.medicalConditions,
      medications: vault.medications,
      allergies: vault.allergies,
      insurance: vault.insurance,
      clearances: vault.clearanceDocuments,
      pendingApprovalBy: approver,
      lastApprovedBy: approver,
      lastApprovedAt: approvedAt,
      approvalHistory: [
        ...diffs.map((diff) => buildApprovalEvent(diff, approver, approvedAt)),
        ...(chartSnapshot.approvalHistory || [])
      ]
    };

    upsertChartSnapshot(next);
    setChartSnapshot(next);
    setMessage(`Applied all medical-history changes with approval by ${next.lastApprovedBy}.`);
  }

  function clearSession() {
    clearIntegrationApprovalSessionFromStorage();
    setApprovalSession(null);
    setMessage("Cleared the active approval session. You can start a new patient match from office check-in.");
  }

  return (
    <div className="grid integration-layout">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Software sync</p>
            <h2>Approve and apply medical-history changes</h2>
          </div>
        </div>

        <div className="grid two-up">
          <label>
            Dental software
            <select onChange={(event) => setSoftware(event.target.value as DentalSoftware)} value={software}>
              {softwareCatalog.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Approving worker
            <input
              onChange={(event) => setApprovalName(event.target.value)}
              placeholder="Front desk or assistant on this computer"
              value={approvalName}
            />
          </label>
        </div>

        <div className="catalog-summary">
          <strong>Patient match rules</strong>
          <p>
            ClearPath matches using patient name and date of birth first, then shows the charted
            medical history against the latest vault changes. Nothing is written until the office
            worker approves it on this computer.
          </p>
          <p>
            This prevents duplicate treatment or diagnosis entries and reduces wrong-chart updates
            by forcing a matched patient review before changes are applied.
          </p>
          {selectedSoftware ? <p><strong>{selectedSoftware.label} plan:</strong> {selectedSoftware.note}</p> : null}
          {approvalSession ? (
            <p>
              <strong>Approval session:</strong> Routed here from {approvalSession.practiceName} after{" "}
              {approvalSession.source === "wallet-scan" ? "a wallet/access-code scan" : "office check-in"}.
            </p>
          ) : null}
        </div>

        <div className="form-footer">
          <button className="primary-button" onClick={runMatch} type="button">
            Match patient and load chart
          </button>
          {approvalSession ? (
            <button className="secondary-button" onClick={clearSession} type="button">
              Clear approval session
            </button>
          ) : null}
          <p>No manual chart typing is required in this workflow.</p>
        </div>

        {message ? <p className="info-text">{message}</p> : null}
      </section>

      <section className="panel">
        <p className="eyebrow">Match status</p>
        {chartSnapshot ? (
          <div className="dialogue-list">
            <div className="dialogue-card">
              <h4>{selectedSoftware?.label} patient match</h4>
              <p>
                Patient: {chartSnapshot.patientName || "No chart name"}
              </p>
              <p>Date of birth: {chartSnapshot.dateOfBirth || "No chart DOB"}</p>
              <p>Status: {isMatched ? "Matched by name and DOB" : "Needs review"}</p>
              {chartSnapshot.lastApprovedBy ? (
                <p>
                  Last applied by {chartSnapshot.lastApprovedBy} on{" "}
                  {new Date(chartSnapshot.lastApprovedAt || "").toLocaleString()}
                </p>
              ) : null}
            </div>
            <div className="dialogue-card">
              <h4>Chart on file</h4>
              <p>{chartSnapshot.conditions.length} conditions</p>
              <p>{chartSnapshot.medications.length} medications</p>
              <p>{chartSnapshot.allergies.length} allergies</p>
              <p>{chartSnapshot.clearances.length} clearance records</p>
            </div>
            <div className="dialogue-card">
              <h4>Approval gate</h4>
              <p>Approving worker: {effectiveApprovalName || "Not entered"}</p>
              <p>{canApprove ? "Ready to apply approved changes" : "Enter approving worker and confirm the patient match first"}</p>
            </div>
            <div className="dialogue-card">
              <h4>Approval history</h4>
              {chartSnapshot.approvalHistory.length > 0 ? (
                <ul>
                  {chartSnapshot.approvalHistory.slice(0, 4).map((event) => (
                    <li key={event.id}>
                      {event.label} applied by {event.approvedBy} on{" "}
                      {new Date(event.approvedAt).toLocaleString()}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No approved chart updates yet.</p>
              )}
            </div>
          </div>
        ) : (
          <p>Run the patient match to load the chart snapshot from the selected software connector.</p>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Approval diff</p>
            <h2>Apply only the approved changes</h2>
          </div>
          {diffs.length > 0 ? (
            <button className="secondary-button" onClick={approveAllChanges} type="button">
              Apply all changes
            </button>
          ) : null}
        </div>

        {diffs.length > 0 ? (
          <div className="dialogue-list">
            {diffs.map((diff) => (
              <div className="dialogue-card" key={diff.id}>
                <h4>{diff.label}</h4>
                <p>
                  <strong>On file:</strong> {diff.chartValue}
                </p>
                <p>
                  <strong>New change:</strong> {diff.vaultValue}
                </p>
                <p>
                  <strong>Status:</strong> {diff.status.replace(/-/g, " ")}
                </p>
                <button
                  className="primary-button"
                  disabled={!canApprove}
                  onClick={() => approveAndApplyDiff(diff.id)}
                  type="button"
                >
                  Apply change
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No chart diffs detected yet. Once the patient is matched, only changed items will appear here.</p>
        )}

        {!canApprove ? (
          <p className="info-text">
            Chart updates stay locked until a matched patient is on screen and the office worker on
            that computer is identified.
          </p>
        ) : null}
      </section>
    </div>
  );
}

function buildApprovalEvent(diff: ChartDiffItem, approver: string, approvedAt: string) {
  return {
    id: crypto.randomUUID(),
    approvedBy: approver,
    approvedAt,
    section: diff.section,
    label: diff.label,
    previousValue: diff.chartValue,
    appliedValue: diff.vaultValue
  };
}
