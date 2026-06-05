"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { practicesById } from "@/lib/clinical-catalog";
import { getSupabaseAuthHeaders } from "@/lib/supabase-browser";
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
  const searchParams = useSearchParams();
  const initialMemberId = searchParams.get("memberId") || searchParams.get("accessCode") || "";
  const initialAccessCode = searchParams.get("accessCode") || "";
  const [vault] = useState<PatientVault>(() => readVaultFromStorage());
  const [serverPatients, setServerPatients] = useState<PatientVault[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientVault | null>(null);
  const [email, setEmail] = useState(() => readVaultFromStorage().email);
  const [memberId, setMemberId] = useState(() => initialMemberId || readVaultFromStorage().memberId);
  const [accessCode, setAccessCode] = useState(initialAccessCode);
  const [isPatientFinderOpen, setIsPatientFinderOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    phone: "",
    address: "",
    email: "",
    memberId: initialMemberId,
    accessCode: initialAccessCode
  });
  const [notes, setNotes] = useState("");
  const [checkIns, setCheckIns] = useState(() => readCheckInsFromStorage());
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [serverShareLink, setServerShareLink] = useState<ShareLinkRecord | null>(null);

  useEffect(() => {
    const practiceId = currentUser?.practiceId;
    if (!practiceId) {
      return;
    }
    const activePracticeId = practiceId;

    let active = true;

    async function loadPracticeData() {
      setIsLoadingPatients(true);
      try {
        const headers = await getSupabaseAuthHeaders();
        const [patientsResponse, checkInsResponse] = await Promise.all([
          fetch(`/api/patients?practiceId=${encodeURIComponent(activePracticeId)}`, { headers }),
          fetch(`/api/check-ins?practiceId=${encodeURIComponent(activePracticeId)}`, { headers })
        ]);
        const patientsData = (await patientsResponse.json()) as {
          patients?: PatientVault[];
          error?: string;
        };
        const checkInsData = (await checkInsResponse.json()) as {
          records?: CheckInRecord[];
          error?: string;
        };

        if (!active) {
          return;
        }

        if (patientsResponse.ok && patientsData.patients) {
          setServerPatients(patientsData.patients);
        }
        if (checkInsResponse.ok && checkInsData.records) {
          setCheckIns(checkInsData.records);
          writeCheckInsToStorage(checkInsData.records);
        }
        if (!patientsResponse.ok || !checkInsResponse.ok) {
          setMessage(patientsData.error || checkInsData.error || "Unable to load practice check-in data.");
        }
      } finally {
        if (active) {
          setIsLoadingPatients(false);
        }
      }
    }

    void loadPracticeData();
    return () => {
      active = false;
    };
  }, [currentUser?.practiceId]);

  useEffect(() => {
    const normalizedAccessCode = accessCode.trim();
    if (!normalizedAccessCode) {
      return;
    }

    let active = true;

    async function loadShareLink() {
      const response = await fetch(`/api/share-links?accessCode=${encodeURIComponent(normalizedAccessCode)}`, {
        headers: await getSupabaseAuthHeaders()
      });
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
    if (selectedPatient) {
      return selectedPatient;
    }

    const emailMatch = vault.email.toLowerCase() === email.trim().toLowerCase();
    const normalizedMemberId = memberId.trim();
    const memberMatch = vault.memberId === normalizedMemberId || vault.walletCode === normalizedMemberId;
    const serverMatch = serverPatients.find((patient) => {
      const patientEmailMatch = patient.email.toLowerCase() === email.trim().toLowerCase();
      const patientMemberMatch =
        patient.memberId === normalizedMemberId || patient.walletCode === normalizedMemberId;

      return normalizedMemberId ? patientMemberMatch && (!email.trim() || patientEmailMatch) : patientEmailMatch;
    });
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
    const sharedServerPatient = approvedServerLink
      ? serverPatients.find(
          (patient) => patient.email.toLowerCase() === serverShareLink.patientEmail.toLowerCase()
        )
      : null;

    return serverMatch || sharedServerPatient || (emailMatch && memberMatch ? vault : localShareLinkMatch ? vault : null);
  }, [currentUser, email, memberId, selectedPatient, serverPatients, serverShareLink, vault, accessCode]);
  const lookupMethod = accessCode.trim()
    ? serverShareLink || readShareLinksFromStorage().some((link) => link.accessCode.toLowerCase() === accessCode.trim().toLowerCase())
      ? "share-code"
      : "share-code-pending"
    : "identity";
  const patientFinderResults = useMemo(
    () => buildPatientFinderResults([vault, ...serverPatients], patientSearch, currentUser?.practiceId, serverShareLink),
    [currentUser?.practiceId, patientSearch, serverPatients, serverShareLink, vault]
  );
  const matchedCheckIns = useMemo(
    () =>
      matched
        ? checkIns
            .filter((entry) => entry.patientEmail.toLowerCase() === matched.email.toLowerCase())
            .slice(0, 5)
        : checkIns.slice(0, 5),
    [checkIns, matched]
  );
  const previousCheckIn = matchedCheckIns[0] ?? null;
  const profileUpdatedAfterLastVisit = Boolean(
    matched?.lastUpdatedAt &&
      previousCheckIn &&
      new Date(matched.lastUpdatedAt).getTime() > new Date(previousCheckIn.verifiedAt).getTime()
  );
  const changeAlerts = useMemo(
    () => (matched ? buildCheckInChangeAlerts(matched, previousCheckIn, profileUpdatedAfterLastVisit) : []),
    [matched, previousCheckIn, profileUpdatedAfterLastVisit]
  );

  async function saveCheckIn() {
    if (!matched || !currentUser) {
      setMessage("Select a patient health profile and sign in to record an office check-in.");
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
      status: profileUpdatedAfterLastVisit || !previousCheckIn ? "updated" : "confirmed-no-changes",
      insuranceConfirmed: true,
      historyConfirmed: true,
      medicationConfirmed: true,
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
          "Content-Type": "application/json",
          ...(await getSupabaseAuthHeaders())
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

      setMessage(`${data.message || "Office check-in saved."} Today's verification is now in this patient's history.`);
      if (authMode === "supabase") {
        setNotes("");
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `${error.message} Please try saving again before moving on.`
          : "Check-in could not be saved. Please try again before moving on."
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

  function loadPatientFromScan() {
    const normalizedCode = extractAccessCode(accessCode);
    if (!normalizedCode) {
      setMessage("Scan the patient's QR code or enter their ClearPath access code before loading the chart.");
      return;
    }

    setAccessCode(normalizedCode);
    setMemberId(normalizedCode);
    setSelectedPatient(null);
    setPatientSearch((current) => ({
      ...current,
      memberId: normalizedCode,
      accessCode: normalizedCode
    }));
    setMessage(null);
  }

  function selectPatientFromFinder(result: PatientFinderResult) {
    const nextPatient = serverPatients.find((patient) => patient.profileId === result.patientProfileId) ?? null;
    setSelectedPatient(nextPatient);

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
          <p className="eyebrow">Returning patient check-in</p>
          <h2>Scan, review, verify.</h2>
          <p>
            New patients are added from the New Patient tab. Use this page when an existing patient arrives and the
            office needs to confirm their medical history, insurance, medications, allergies, and emergency contact are current.
          </p>
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
            <p className="eyebrow">Visit verification</p>
            <h2>Load the patient history</h2>
            <p>Scan the QR code, enter the access code, or use patient finder if the code is not available.</p>
          </div>
        </div>

        <div className="returning-scan-card">
          <label>
            QR scan or access code
            <input
              autoComplete="off"
              onChange={(event) => setAccessCode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  loadPatientFromScan();
                }
              }}
              placeholder="Scan QR code or type patient code"
              value={accessCode}
            />
          </label>
          <button className="primary-button" onClick={loadPatientFromScan} type="button">
            Load patient history
          </button>
        </div>

        <div className="patient-select-launcher">
          <div>
            <p className="eyebrow">Fallback search</p>
            <h3>{matched ? matched.fullName : "No patient loaded"}</h3>
            <p>
              {matched
                ? `${matched.email} ${matched.dateOfBirth ? `• DOB ${matched.dateOfBirth}` : ""}`
                : isLoadingPatients
                  ? "Loading connected patients for this practice."
                  : "If the QR or code is not available, search by name, birthday, phone, address, email, or ID."}
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
              : "Use the New Patient tab first if this patient has never connected to your practice."}
          </span>
        </div>

        <label>
          Office note for today
          <input
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional note for the provider or front desk"
            value={notes}
          />
        </label>

        <div className="form-footer">
          <button className="primary-button" disabled={isSaving} onClick={saveCheckIn} type="button">
            {isSaving ? "Saving verification..." : "Save today's verification"}
          </button>
          <p>Save only after the office has reviewed any changes and confirmed the patient is ready for today&apos;s visit.</p>
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
                <span>
                  {isLoadingPatients
                    ? "Loading patients..."
                    : `${patientFinderResults.length} result${patientFinderResults.length === 1 ? "" : "s"}`}
                </span>
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
                <p className="info-text">
                  {isLoadingPatients
                    ? "Loading the practice patient list..."
                    : serverPatients.length === 0
                      ? "No patients are connected yet. Use New Patient to add a patient from QR scan or manual code."
                      : "No matching patients found. Add more details or use a practice access code."}
                </p>
              )}
            </div>
          </section>
        </div>
      ) : null}

      <section className="panel v0-profile-panel">
        <div className="panel-heading provider-review-heading">
          <div>
            <p className="eyebrow">Matched profile</p>
            <h2>{matched ? "Review patient information" : "No patient open"}</h2>
            <p>
              {matched
                ? "Review what is current now. Any profile update since the last saved visit is highlighted first."
                : "Select a patient to see the medical history and insurance details for check-in."}
            </p>
          </div>
        </div>
        {matched ? (
          <div className="dialogue-list provider-review-grid">
            <div className="dialogue-card provider-change-panel provider-review-card-wide">
              <div className="provider-change-panel-header">
                <div>
                  <p className="eyebrow">Since last visit</p>
                  <h4>{profileUpdatedAfterLastVisit || !previousCheckIn ? "Review updates before seating" : "No new profile update recorded"}</h4>
                </div>
                <span className={`provider-change-pill ${profileUpdatedAfterLastVisit || !previousCheckIn ? "attention" : "clear"}`}>
                  {previousCheckIn ? `Last check-in ${formatCheckInDate(previousCheckIn.verifiedAt)}` : "First ClearPath check-in"}
                </span>
              </div>
              <div className="provider-change-list">
                {changeAlerts.map((alert) => (
                  <article className={`provider-change-alert ${alert.tone}`} key={alert.title}>
                    <strong>{alert.title}</strong>
                    <p>{alert.body}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="dialogue-card provider-review-card provider-review-card-wide">
              <h4>{matched.fullName}</h4>
              <div className="provider-detail-grid">
                <ProviderDetail label="Email" value={matched.email} />
                <ProviderDetail label="Phone" value={matched.phone} />
                <ProviderDetail label="Date of birth" value={matched.dateOfBirth} />
                <ProviderDetail label="Member ID" value={matched.memberId} />
                <ProviderDetail label="Wallet code" value={matched.walletCode} />
                <ProviderDetail
                  label="Last updated"
                  value={matched.lastUpdatedAt ? formatCheckInDate(matched.lastUpdatedAt) : ""}
                />
              </div>
              <p className="provider-match-note">
                {accessCode.trim() ? "Matched from practice access code." : "Matched from reusable office intake profile."}
              </p>
            </div>

            <div className="dialogue-card provider-review-card">
              <h4>Emergency contact</h4>
              <div className="provider-detail-list">
                <ProviderDetail label="Name" value={matched.emergencyContact.name} />
                <ProviderDetail label="Relationship" value={matched.emergencyContact.relationship} />
                <ProviderDetail label="Phone" value={matched.emergencyContact.phone} />
              </div>
            </div>

            <div className="dialogue-card provider-review-card">
              <h4>Insurance</h4>
              <div className="provider-detail-list">
                <ProviderDetail label="Provider" value={matched.insurance.providerName} />
                <ProviderDetail label="Member ID" value={matched.insurance.memberId} />
                <ProviderDetail label="Group" value={matched.insurance.groupNumber} />
                <ProviderDetail label="Subscriber" value={matched.insurance.subscriberName} />
              </div>
            </div>

            <div className="dialogue-card provider-review-card">
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
            <div className="dialogue-card provider-review-card">
              <h4>Medications</h4>
              <ul>
                {matched.medications.length > 0 ? (
                  matched.medications.map((medication) => (
                    <li key={medication.id}>
                      {[medication.name || "Unnamed medication", medication.dose, medication.frequency]
                        .filter(Boolean)
                        .join(" • ")}
                    </li>
                  ))
                ) : (
                  <li>No medications entered yet.</li>
                )}
              </ul>
            </div>
            <div className="dialogue-card provider-review-card allergy-review-card">
              <h4>Allergies</h4>
              <ul>
                {matched.allergies.length > 0 ? (
                  matched.allergies.map((allergy) => (
                    <li key={allergy.id}>
                      {[allergy.allergen || "Unnamed allergy", allergy.reaction, allergy.severity]
                        .filter(Boolean)
                        .join(" • ")}
                    </li>
                  ))
                ) : (
                  <li>No allergies entered yet.</li>
                )}
              </ul>
            </div>
            <div className="dialogue-card provider-review-card provider-review-card-wide">
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
          <p>Scan the patient QR code, enter their access code, or use patient finder to open the returning check-in profile.</p>
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

function extractAccessCode(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsed = new URL(trimmed);
    return (
      parsed.searchParams.get("accessCode") ||
      parsed.searchParams.get("memberId") ||
      parsed.pathname.split("/").filter(Boolean).at(-1) ||
      trimmed
    ).trim();
  } catch {
    return trimmed;
  }
}

function buildCheckInChangeAlerts(
  patient: PatientVault,
  previousCheckIn: CheckInRecord | null,
  profileUpdatedAfterLastVisit: boolean
) {
  const profileSummary = [
    `${patient.medicalConditions.length} condition${patient.medicalConditions.length === 1 ? "" : "s"}`,
    `${patient.medications.length} medication${patient.medications.length === 1 ? "" : "s"}`,
    `${patient.allergies.length} allerg${patient.allergies.length === 1 ? "y" : "ies"}`,
    patient.insurance.providerName ? "insurance on file" : "insurance missing",
    patient.emergencyContact.name ? "emergency contact on file" : "emergency contact missing"
  ].join(" • ");

  if (!previousCheckIn) {
    return [
      {
        title: "First ClearPath verification for this practice",
        body: `Review the full chart once before saving today. Current profile: ${profileSummary}.`,
        tone: "attention"
      }
    ];
  }

  if (profileUpdatedAfterLastVisit) {
    return [
      {
        title: "Patient profile changed after the last visit",
        body: `Last profile update was ${formatCheckInDate(patient.lastUpdatedAt)}. Current profile: ${profileSummary}.`,
        tone: "attention"
      },
      {
        title: "Review current details below",
        body: "The sections below show what is currently in the patient's ClearPath profile for today's visit.",
        tone: "neutral"
      }
    ];
  }

  return [
    {
      title: "No new profile update recorded",
      body: `The patient profile has not been updated since the last saved check-in. Current profile: ${profileSummary}.`,
      tone: "clear"
    }
  ];
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

function ProviderDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="provider-detail-item">
      <span>{label}</span>
      <strong>{value || "Not entered"}</strong>
    </div>
  );
}

type PatientFinderResult = {
  id: string;
  patientProfileId: string;
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
  vaults: PatientVault[],
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
  const candidates: PatientFinderResult[] = vaults.filter(hasPatientIdentity).map((vault) => ({
    id: vault.profileId || vault.email || "local-vault",
    patientProfileId: vault.profileId,
    matchType: "patient",
    fullName: vault.fullName || "Unnamed patient",
    email: vault.email,
    dateOfBirth: vault.dateOfBirth,
    phone: vault.phone,
    address: "",
    memberId: vault.memberId,
    walletCode: vault.walletCode,
    accessCode: ""
  }));

  const accessCode = normalize(search.accessCode);
  const matchingShareLink = accessCode
    ? readShareLinksFromStorage().find(
        (link) =>
          normalize(link.accessCode) === accessCode &&
          link.status === "active" &&
          (!practiceId || link.practiceId === practiceId)
      ) ?? (serverShareLink && normalize(serverShareLink.accessCode) === accessCode ? serverShareLink : null)
    : null;

  const sharedVault = matchingShareLink
    ? vaults.find((vault) => vault.email.toLowerCase() === matchingShareLink.patientEmail.toLowerCase())
    : null;

  if (matchingShareLink && sharedVault && hasPatientIdentity(sharedVault)) {
    candidates.unshift({
      id: `share-${matchingShareLink.id}`,
      patientProfileId: sharedVault.profileId,
      matchType: "access-code",
      fullName: sharedVault.fullName || "Shared patient",
      email: sharedVault.email || matchingShareLink.patientEmail,
      dateOfBirth: sharedVault.dateOfBirth,
      phone: sharedVault.phone,
      address: "",
      memberId: sharedVault.memberId,
      walletCode: sharedVault.walletCode,
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
