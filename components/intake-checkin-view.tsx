"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { practicesById } from "@/lib/clinical-catalog";
import {
  readCheckInsFromStorage,
  readShareLinksFromStorage,
  readVaultFromStorage,
  writeCheckInsToStorage,
  type CheckInRecord,
  type PatientVault,
  type ShareLinkRecord
} from "@/lib/patient-vault";

export function IntakeCheckInView() {
  const { currentUser, authMode } = useAuth();
  const [vault] = useState<PatientVault>(() => readVaultFromStorage());
  const [email, setEmail] = useState(() => readVaultFromStorage().email);
  const [memberId, setMemberId] = useState(() => readVaultFromStorage().memberId);
  const [accessCode, setAccessCode] = useState("");
  const [isPatientFinderOpen, setIsPatientFinderOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    phone: "",
    address: "",
    email: "",
    memberId: "",
    accessCode: ""
  });
  const [insuranceConfirmed, setInsuranceConfirmed] = useState(true);
  const [historyConfirmed, setHistoryConfirmed] = useState(true);
  const [medicationConfirmed, setMedicationConfirmed] = useState(true);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<CheckInRecord["status"]>("confirmed-no-changes");
  const [checkIns, setCheckIns] = useState(() => readCheckInsFromStorage());
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
    const normalizedMemberId = memberId.trim();
    const memberMatch = vault.memberId === normalizedMemberId || vault.walletCode === normalizedMemberId;
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
  const lookupMethod = accessCode.trim()
    ? serverShareLink || readShareLinksFromStorage().some((link) => link.accessCode.toLowerCase() === accessCode.trim().toLowerCase())
      ? "share-code"
      : "share-code-pending"
    : "identity";
  const patientFinderResults = useMemo(
    () => buildPatientFinderResults(vault, patientSearch, currentUser?.practiceId, serverShareLink),
    [currentUser?.practiceId, patientSearch, serverShareLink, vault]
  );
  const confirmedCount = checkIns.filter((entry) => entry.status === "confirmed-no-changes").length;
  const updatedCount = checkIns.filter((entry) => entry.status === "updated").length;
  const reviewCount = checkIns.filter(
    (entry) => !entry.insuranceConfirmed || !entry.historyConfirmed || !entry.medicationConfirmed
  ).length;
  const matchedCheckIns = useMemo(
    () =>
      matched
        ? checkIns
            .filter((entry) => entry.patientEmail.toLowerCase() === matched.email.toLowerCase())
            .slice(0, 5)
        : checkIns.slice(0, 5),
    [checkIns, matched]
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
    const nextCheckIns = [nextRecord, ...existing];
    writeCheckInsToStorage(nextCheckIns);
    setCheckIns(nextCheckIns);

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

  function openPatientFinder() {
    setPatientSearch((current) => ({
      ...current,
      email,
      memberId,
      accessCode
    }));
    setIsPatientFinderOpen(true);
  }

  function selectPatientFromFinder(result: PatientFinderResult) {
    if (result.matchType === "access-code") {
      setAccessCode(result.accessCode);
    } else {
      setEmail(result.email);
      setMemberId(result.memberId || result.walletCode);
      setAccessCode("");
    }

    setMessage(null);
    setIsPatientFinderOpen(false);
  }

  return (
    <div className="v0-checkin-stage">
      <section className="v0-command-hero">
        <div>
          <p className="eyebrow">Medical check-in</p>
          <h2>Today&apos;s patient flow</h2>
          <p>
            Select the patient, verify the updated history, and clear the record before the appointment starts.
          </p>
        </div>
        <div className="v0-command-metrics" aria-label="Check-in summary">
          <div>
            <span>Confirmed</span>
            <strong>{confirmedCount}</strong>
          </div>
          <div>
            <span>Updated</span>
            <strong>{updatedCount}</strong>
          </div>
          <div>
            <span>Needs review</span>
            <strong>{reviewCount}</strong>
          </div>
        </div>
        <div className="v0-flow-bars" aria-label="Daily check-in rhythm">
          <span style={{ height: "42%" }} />
          <span style={{ height: "64%" }} />
          <span style={{ height: "49%" }} />
          <span style={{ height: "78%" }} />
          <span style={{ height: "58%" }} />
          <span style={{ height: "92%" }} />
          <span style={{ height: "70%" }} />
        </div>
      </section>

      <div className="grid checkin-layout v0-checkin-layout">
      <section className="panel v0-lookup-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Office intake</p>
            <h2>Find the correct patient</h2>
          </div>
        </div>

        <div className="patient-select-launcher">
          <div>
            <p className="eyebrow">Patient selection</p>
            <h3>{matched ? matched.fullName : "No patient selected"}</h3>
            <p>
              {matched
                ? `${matched.email} ${matched.dateOfBirth ? `• DOB ${matched.dateOfBirth}` : ""}`
                : "Open patient selection to search by name, birthday, phone, address, email, or ID."}
            </p>
          </div>
          <button className="primary-button" onClick={openPatientFinder} type="button">
            Select patient
          </button>
        </div>

        <div className={`patient-match-status ${matched ? "matched" : "unmatched"}`}>
          <strong>{matched ? "Patient matched" : "No patient matched yet"}</strong>
          <span>
            {matched
              ? lookupMethod === "share-code"
                ? "Matched by approved practice access code."
                : "Matched by email plus secondary identifier."
              : "Use email with member ID or wallet code. Use the access code only when the patient presents one."}
          </span>
        </div>

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
          <p>This is the “tap once, verify changes, move on” workflow for returning patients.</p>
        </div>

        {message ? <p className="info-text">{message}</p> : null}
      </section>

      {isPatientFinderOpen ? (
        <div className="patient-finder-backdrop" role="presentation">
          <section
            aria-label="Select patient"
            aria-modal="true"
            className="patient-finder-dialog"
            role="dialog"
          >
            <div className="patient-finder-header">
              <div>
                <p className="eyebrow">Select patient</p>
                <h2>Patient finder</h2>
              </div>
              <button className="secondary-button" onClick={() => setIsPatientFinderOpen(false)} type="button">
                Close
              </button>
            </div>

            <div className="patient-finder-grid">
              <label>
                First name
                <input
                  onChange={(event) => setPatientSearch((current) => ({ ...current, firstName: event.target.value }))}
                  value={patientSearch.firstName}
                />
              </label>
              <label>
                Last name
                <input
                  onChange={(event) => setPatientSearch((current) => ({ ...current, lastName: event.target.value }))}
                  value={patientSearch.lastName}
                />
              </label>
              <label>
                Birthday
                <input
                  onChange={(event) => setPatientSearch((current) => ({ ...current, dateOfBirth: event.target.value }))}
                  type="date"
                  value={patientSearch.dateOfBirth}
                />
              </label>
              <label>
                Phone number
                <input
                  onChange={(event) => setPatientSearch((current) => ({ ...current, phone: event.target.value }))}
                  value={patientSearch.phone}
                />
              </label>
              <label className="patient-finder-wide">
                Address
                <input
                  onChange={(event) => setPatientSearch((current) => ({ ...current, address: event.target.value }))}
                  placeholder="Street, city, or ZIP"
                  value={patientSearch.address}
                />
              </label>
              <label>
                Email
                <input
                  autoComplete="email"
                  onChange={(event) => setPatientSearch((current) => ({ ...current, email: event.target.value }))}
                  type="email"
                  value={patientSearch.email}
                />
              </label>
              <label>
                Member ID / wallet code
                <input
                  onChange={(event) => setPatientSearch((current) => ({ ...current, memberId: event.target.value }))}
                  value={patientSearch.memberId}
                />
              </label>
              <label className="patient-finder-wide">
                Practice access code
                <input
                  onChange={(event) => {
                    setPatientSearch((current) => ({ ...current, accessCode: event.target.value }));
                    setAccessCode(event.target.value);
                  }}
                  placeholder="Use only when patient presents a code"
                  value={patientSearch.accessCode}
                />
              </label>
            </div>

            <div className="patient-finder-results">
              <div className="patient-finder-results-header">
                <strong>Patients</strong>
                <span>{patientFinderResults.length} result{patientFinderResults.length === 1 ? "" : "s"}</span>
              </div>
              {patientFinderResults.length > 0 ? (
                patientFinderResults.map((result) => (
                  <article className="patient-finder-row" key={result.id}>
                    <div>
                      <h4>{result.fullName}</h4>
                      <p>{result.email || "Email not available"}</p>
                      <p>
                        {[
                          result.dateOfBirth ? `DOB ${result.dateOfBirth}` : "",
                          result.phone ? `Phone ${result.phone}` : "",
                          result.memberId ? `Member ${result.memberId}` : result.walletCode ? `Wallet ${result.walletCode}` : ""
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    </div>
                    <button className="secondary-button" onClick={() => selectPatientFromFinder(result)} type="button">
                      Use patient
                    </button>
                  </article>
                ))
              ) : (
                <p className="info-text">No matching patients found. Add more details or use a practice access code.</p>
              )}
            </div>
          </section>
        </div>
      ) : null}

      <section className="panel v0-profile-panel">
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
              <h4>Recent check-ins</h4>
              {matchedCheckIns.length > 0 ? (
                <ul>
                  {matchedCheckIns.map((entry) => (
                    <li key={entry.id}>
                      {formatCheckInStatus(entry.status)} • {formatCheckInDate(entry.verifiedAt)}
                      {entry.notes ? ` • ${entry.notes}` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No check-ins saved yet.</p>
              )}
            </div>
          </div>
        ) : (
          <p>Enter the patient email and member ID, or use an approved practice access code, to open the patient check-in profile.</p>
        )}
      </section>
      </div>
    </div>
  );
}

function formatCheckInStatus(status: CheckInRecord["status"]) {
  if (status === "confirmed-no-changes") {
    return "Confirmed no changes";
  }

  if (status === "updated") {
    return "Updated information";
  }

  return "New office share";
}

function formatCheckInDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

type PatientFinderResult = {
  id: string;
  matchType: "patient" | "access-code";
  fullName: string;
  email: string;
  dateOfBirth: string;
  phone: string;
  address: string;
  memberId: string;
  walletCode: string;
  accessCode: string;
};

function buildPatientFinderResults(
  vault: PatientVault,
  search: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    phone: string;
    address: string;
    email: string;
    memberId: string;
    accessCode: string;
  },
  practiceId: string | undefined,
  serverShareLink: ShareLinkRecord | null
) {
  const candidates: PatientFinderResult[] = hasPatientIdentity(vault)
    ? [
        {
          id: vault.profileId || vault.email || "local-vault",
          matchType: "patient",
          fullName: vault.fullName || "Unnamed patient",
          email: vault.email,
          dateOfBirth: vault.dateOfBirth,
          phone: vault.phone,
          address: "",
          memberId: vault.memberId,
          walletCode: vault.walletCode,
          accessCode: ""
        }
      ]
    : [];

  const accessCode = normalize(search.accessCode);
  const matchingShareLink = accessCode
    ? readShareLinksFromStorage().find(
        (link) =>
          normalize(link.accessCode) === accessCode &&
          link.status === "active" &&
          (!practiceId || link.practiceId === practiceId)
      ) ?? (serverShareLink && normalize(serverShareLink.accessCode) === accessCode ? serverShareLink : null)
    : null;

  if (matchingShareLink && hasPatientIdentity(vault)) {
    candidates.unshift({
      id: `share-${matchingShareLink.id}`,
      matchType: "access-code",
      fullName: vault.fullName || "Shared patient",
      email: vault.email || matchingShareLink.patientEmail,
      dateOfBirth: vault.dateOfBirth,
      phone: vault.phone,
      address: "",
      memberId: vault.memberId,
      walletCode: vault.walletCode,
      accessCode: matchingShareLink.accessCode
    });
  }

  const filtered = candidates.filter((candidate) => patientMatchesSearch(candidate, search));
  return dedupePatientFinderResults(filtered.length > 0 || hasSearchCriteria(search) ? filtered : candidates);
}

function patientMatchesSearch(candidate: PatientFinderResult, search: {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  address: string;
  email: string;
  memberId: string;
  accessCode: string;
}) {
  const names = candidate.fullName.trim().split(/\s+/);
  const firstName = names[0] ?? "";
  const lastName = names.slice(1).join(" ");
  const memberOrWallet = [candidate.memberId, candidate.walletCode].map(normalize);

  return [
    fuzzyIncludes(firstName, search.firstName),
    fuzzyIncludes(lastName, search.lastName),
    fuzzyIncludes(candidate.dateOfBirth, search.dateOfBirth),
    fuzzyIncludes(candidate.phone, search.phone),
    fuzzyIncludes(candidate.address, search.address),
    fuzzyIncludes(candidate.email, search.email),
    !search.memberId.trim() || memberOrWallet.some((value) => value.includes(normalize(search.memberId))),
    fuzzyIncludes(candidate.accessCode, search.accessCode)
  ].every(Boolean);
}

function hasPatientIdentity(vault: PatientVault) {
  return Boolean(vault.email || vault.fullName || vault.memberId || vault.walletCode);
}

function hasSearchCriteria(search: {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  address: string;
  email: string;
  memberId: string;
  accessCode: string;
}) {
  return Object.values(search).some((value) => value.trim());
}

function fuzzyIncludes(value: string, query: string) {
  return !query.trim() || normalize(value).includes(normalize(query));
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function dedupePatientFinderResults(results: PatientFinderResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = `${result.matchType}:${result.email}:${result.memberId}:${result.accessCode}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
