"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { practicesById } from "@/lib/clinical-catalog";
import {
  readCheckInsFromStorage,
  writeIntegrationApprovalSessionToStorage,
  readShareLinksFromStorage,
  readVaultFromStorage,
  writeCheckInsToStorage,
  type CheckInRecord,
  type PatientVault,
  type ShareLinkRecord
} from "@/lib/patient-vault";

export function IntakeCheckInView() {
  const { currentUser, authMode } = useAuth();
  const router = useRouter();
  const [vault] = useState<PatientVault>(() => readVaultFromStorage());
  const [email, setEmail] = useState(() => readVaultFromStorage().email);
  const [memberId, setMemberId] = useState(() => readVaultFromStorage().memberId);
  const [accessCode, setAccessCode] = useState("");
  const [insuranceConfirmed, setInsuranceConfirmed] = useState(true);
  const [historyConfirmed, setHistoryConfirmed] = useState(true);
  const [medicationConfirmed, setMedicationConfirmed] = useState(true);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<CheckInRecord["status"]>("confirmed-no-changes");
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [serverShareLink, setServerShareLink] = useState<ShareLinkRecord | null>(null);

  useEffect(() => {
    const normalizedAccessCode = accessCode.trim();
    if (!normalizedAccessCode) {
      return;
    }

    let active = true;

    async function loadShareLink() {
      const response = await fetch(`/api/share-links?accessCode=${encodeURIComponent(normalizedAccessCode)}`);
      const data = (await response.json()) as { shareLinks?: ShareLinkRecord[] };
      if (!active || !response.ok) {
        return;
      }

      setServerShareLink(data.shareLinks?.[0] ?? null);
    }

    void loadShareLink();
    return () => {
      active = false;
    };
  }, [accessCode]);

  const matched = useMemo(() => {
    const emailMatch = vault.email.toLowerCase() === email.trim().toLowerCase();
    const memberMatch = vault.memberId === memberId.trim();
    const localShareLinkMatch = readShareLinksFromStorage().find(
      (link) =>
        link.accessCode.toLowerCase() === accessCode.trim().toLowerCase() &&
        link.status === "active" &&
        (!currentUser || link.practiceId === currentUser.practiceId)
    );
    const approvedServerLink =
      accessCode.trim() &&
      serverShareLink &&
      serverShareLink.status === "active" &&
      (!currentUser || serverShareLink.practiceId === currentUser.practiceId);

    return emailMatch && memberMatch ? vault : localShareLinkMatch || approvedServerLink ? vault : null;
  }, [accessCode, currentUser, email, memberId, serverShareLink, vault]);

  const pendingClearances = useMemo(
    () =>
      matched?.clearanceDocuments.filter(
        (document) => document.status === "requested" || document.status === "expired"
      ) ?? [],
    [matched]
  );

  const receivedClearances = useMemo(
    () => matched?.clearanceDocuments.filter((document) => document.status === "received") ?? [],
    [matched]
  );

  async function saveCheckIn() {
    if (!matched || !currentUser) {
      setMessage("Match a patient vault and sign in to record an office check-in.");
      return;
    }

    setIsSaving(true);
    const practice = practicesById[currentUser.practiceId];
    const nextRecord: CheckInRecord = {
      id: crypto.randomUUID(),
      practiceId: currentUser.practiceId,
      practiceName: practice?.name ?? "Office",
      patientEmail: matched.email,
      memberId: matched.memberId,
      verifiedAt: new Date().toISOString(),
      status,
      insuranceConfirmed,
      historyConfirmed,
      medicationConfirmed,
      notes
    };

    const existing = readCheckInsFromStorage();
    writeCheckInsToStorage([nextRecord, ...existing]);

    try {
      const response = await fetch("/api/check-ins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...nextRecord,
          createdByUserId: currentUser.id
        })
      });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to save the office check-in.");
      }

      setMessage(
        `${data.message || "Office check-in saved."} This patient can now return and confirm no changes more quickly next time.`
      );
      if (authMode === "supabase") {
        setNotes("");
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `${error.message} Local check-in save still succeeded in this browser.`
          : "Local check-in save succeeded, but server sync failed."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function openIntegrationReview() {
    if (!matched || !currentUser) {
      setMessage("Match a patient profile first so the chart approval review opens on the correct patient.");
      return;
    }

    writeIntegrationApprovalSessionToStorage({
      id: crypto.randomUUID(),
      practiceId: currentUser.practiceId,
      practiceName: practicesById[currentUser.practiceId]?.name ?? "Office",
      approvingWorker: currentUser.name,
      matchedAt: new Date().toISOString(),
      source: accessCode.trim() ? "wallet-scan" : "check-in",
      vault: matched
    });
    router.push("/integrations");
  }

  return (
    <div className="grid checkin-layout">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Office intake</p>
            <h2>Reusable patient check-in</h2>
          </div>
        </div>

        <div className="grid two-up">
          <label>
            Patient email
            <input onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
          </label>
          <label>
            Member ID or wallet code
            <input onChange={(event) => setMemberId(event.target.value)} value={memberId} />
          </label>
        </div>

        <label>
          Practice access code
          <input
            onChange={(event) => setAccessCode(event.target.value)}
            placeholder="Optional practice share code"
            value={accessCode}
          />
        </label>

        <div className="grid two-up">
          <label>
            Intake result
            <select
              onChange={(event) => setStatus(event.target.value as CheckInRecord["status"])}
              value={status}
            >
              <option value="new-share">New office share</option>
              <option value="confirmed-no-changes">Confirmed no changes</option>
              <option value="updated">Patient updated information</option>
            </select>
          </label>
          <label>
            Office note
            <input onChange={(event) => setNotes(event.target.value)} value={notes} />
          </label>
        </div>

        <div className="option-grid compact-options">
          <label className="option-card selected">
            <input
              checked={insuranceConfirmed}
              onChange={(event) => setInsuranceConfirmed(event.target.checked)}
              type="checkbox"
            />
            <div>
              <strong>Insurance confirmed</strong>
              <p>Patient confirmed current insurance details are still accurate.</p>
            </div>
          </label>
          <label className="option-card selected">
            <input
              checked={historyConfirmed}
              onChange={(event) => setHistoryConfirmed(event.target.checked)}
              type="checkbox"
            />
            <div>
              <strong>Medical history confirmed</strong>
              <p>Patient confirmed the major history items are unchanged.</p>
            </div>
          </label>
          <label className="option-card selected">
            <input
              checked={medicationConfirmed}
              onChange={(event) => setMedicationConfirmed(event.target.checked)}
              type="checkbox"
            />
            <div>
              <strong>Medications confirmed</strong>
              <p>Patient confirmed medications and allergies are still current.</p>
            </div>
          </label>
        </div>

        <div className="form-footer">
          <button className="primary-button" disabled={isSaving} onClick={saveCheckIn} type="button">
            {isSaving ? "Saving check-in..." : "Save office check-in"}
          </button>
          <button className="secondary-button" disabled={!matched || !currentUser} onClick={openIntegrationReview} type="button">
            Open chart approval review
          </button>
          <p>This is the “tap once, verify changes, move on” workflow for returning patients.</p>
        </div>

        {message ? <p className="info-text">{message}</p> : null}
      </section>

      <section className="panel">
        <p className="eyebrow">Matched profile</p>
        {matched ? (
          <div className="dialogue-list">
            <div className="dialogue-card">
              <h4>{matched.fullName}</h4>
              <p>{matched.email}</p>
              <p>DOB: {matched.dateOfBirth || "Not entered yet"}</p>
              <p>Insurance: {matched.insurance.providerName || "Not entered yet"}</p>
              <p>{accessCode.trim() ? "Matched from practice access code" : "Matched from reusable office intake profile"}</p>
            </div>
            <div className="dialogue-card">
              <h4>Conditions</h4>
              <ul>
                {matched.medicalConditions.length > 0 ? (
                  matched.medicalConditions.map((condition) => (
                    <li key={condition.id}>{condition.name || "Unnamed condition"}</li>
                  ))
                ) : (
                  <li>No conditions entered yet.</li>
                )}
              </ul>
            </div>
            <div className="dialogue-card">
              <h4>Medications</h4>
              <ul>
                {matched.medications.length > 0 ? (
                  matched.medications.map((medication) => (
                    <li key={medication.id}>
                      {medication.name || "Unnamed medication"} {medication.dose ? `• ${medication.dose}` : ""}
                    </li>
                  ))
                ) : (
                  <li>No medications entered yet.</li>
                )}
              </ul>
            </div>
            <div className="dialogue-card">
              <h4>Allergies</h4>
              <ul>
                {matched.allergies.length > 0 ? (
                  matched.allergies.map((allergy) => (
                    <li key={allergy.id}>
                      {allergy.allergen || "Unnamed allergy"} {allergy.reaction ? `• ${allergy.reaction}` : ""}
                    </li>
                  ))
                ) : (
                  <li>No allergies entered yet.</li>
                )}
              </ul>
            </div>
            <div className="dialogue-card">
              <h4>Clearance blockers</h4>
              {pendingClearances.length > 0 ? (
                <ul>
                  {pendingClearances.map((document) => (
                    <li key={document.id}>
                      {(document.title || document.category).replace(/-/g, " ")} from{" "}
                      {document.requestedFromOffice || "outside office not entered"}.
                      {document.dueDate ? ` Due ${document.dueDate}.` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No requested or expired clearances are currently flagged.</p>
              )}
            </div>
            <div className="dialogue-card">
              <h4>Received documents</h4>
              {receivedClearances.length > 0 ? (
                <ul>
                  {receivedClearances.map((document) => (
                    <li key={document.id}>
                      {document.title || document.category}
                      {document.fileName ? ` • ${document.fileName}` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No clearance files have been marked received yet.</p>
              )}
            </div>
          </div>
        ) : (
          <p>Enter the patient email and member ID, or use an approved practice access code, to simulate a wallet-based office autofill check-in.</p>
        )}
      </section>
    </div>
  );
}
