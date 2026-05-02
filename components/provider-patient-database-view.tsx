"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { CarePageRenderer, type CarePageContent } from "@/components/care-page-renderer";
import {
  conditionCatalog,
  conditionsById,
  getTreatmentsForDiagnosis,
  mediaById,
  getProvidersForPractice,
  practiceCatalog,
  treatmentsById
} from "@/lib/clinical-catalog";
import { buildMockPlan, type AnalysisResponse, type IntakePayload } from "@/lib/mock-analysis";
import {
  deleteTimelineEvent,
  patientTimelineUpdatedEvent,
  readTimelineFromStorage,
  readVaultFromStorage,
  upsertTimelineEvent,
  type PatientVault,
  type TimelineEvent
} from "@/lib/patient-vault";
import { adultTeeth } from "@/lib/teeth";

type DiagnosisEvent = Extract<TimelineEvent, { type: "diagnosis" }>;

type PatientChartRecord = {
  email: string;
  fullName: string;
  dateOfBirth: string;
  phone: string;
  clearanceDocuments: PatientVault["clearanceDocuments"];
  diagnoses: DiagnosisEvent[];
};

export function ProviderPatientDatabaseView() {
  const { currentUser } = useAuth();
  const [timeline, setTimeline] = useState<TimelineEvent[]>(() => readTimelineFromStorage());
  const [vault, setVault] = useState<PatientVault>(() => readVaultFromStorage());
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [selectedPatientEmail, setSelectedPatientEmail] = useState("");
  const [selectedDiagnosisId, setSelectedDiagnosisId] = useState<string | null>(null);
  const [editorPayload, setEditorPayload] = useState<IntakePayload | null>(null);
  const [editingDiagnosisId, setEditingDiagnosisId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setTimeline(readTimelineFromStorage());
      setVault(readVaultFromStorage());
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(patientTimelineUpdatedEvent, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(patientTimelineUpdatedEvent, sync);
    };
  }, []);

  const patients = useMemo(
    () => buildPatientRecords(timeline, vault, currentUser?.practiceId),
    [currentUser?.practiceId, timeline, vault]
  );

  const filteredPatients = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) {
      return patients;
    }

    return patients.filter((patient) =>
      [patient.fullName, patient.email].some((value) => value.toLowerCase().includes(query))
    );
  }, [deferredSearch, patients]);

  const resolvedSelectedPatientEmail = filteredPatients.some(
    (patient) => patient.email === selectedPatientEmail
  )
    ? selectedPatientEmail
    : filteredPatients[0]?.email ?? "";

  const selectedPatient =
    filteredPatients.find((patient) => patient.email === resolvedSelectedPatientEmail) ?? null;

  const selectedDiagnosis = selectedPatient?.diagnoses.find((event) => event.id === selectedDiagnosisId) ?? null;

  const preview = useMemo(() => {
    if (editorPayload && editorPayload.diagnosisId && editorPayload.selectedTreatmentIds.length > 0) {
      return buildMockPlan(editorPayload, []);
    }

    if (selectedDiagnosis) {
      return buildAnalysisFromEvent(selectedDiagnosis, selectedPatient?.fullName ?? "Patient");
    }

    return null;
  }, [editorPayload, selectedDiagnosis, selectedPatient?.fullName]);

  function beginNewDiagnosis() {
    if (!selectedPatient || !currentUser) {
      return;
    }

    setSelectedDiagnosisId(null);
    setEditingDiagnosisId(null);
    setEditorPayload(
      createPayloadForPatient({
        currentUserName: currentUser.name,
        currentUserPracticeId: currentUser.practiceId,
        patient: selectedPatient
      })
    );
    setMessage(null);
  }

  function beginEditDiagnosis(event: DiagnosisEvent) {
    if (!selectedPatient || !currentUser) {
      return;
    }

    setSelectedDiagnosisId(event.id);
    setEditingDiagnosisId(event.id);
    setEditorPayload(payloadFromDiagnosisEvent(event, selectedPatient, currentUser.practiceId));
    setMessage(null);
  }

  function openDiagnosisPreview(event: DiagnosisEvent) {
    setSelectedDiagnosisId(event.id);
    setEditingDiagnosisId(null);
    setEditorPayload(null);
    setMessage(null);
  }

  function saveDiagnosis() {
    if (!selectedPatient || !editorPayload || !preview || !currentUser) {
      return;
    }

    const diagnosisLabel = conditionsById[editorPayload.diagnosisId]?.label ?? editorPayload.diagnosisId;
    const nextEvent: DiagnosisEvent = {
      id: editingDiagnosisId ?? `diagnosis-${crypto.randomUUID()}`,
      type: "diagnosis",
      patientEmail: selectedPatient.email,
      patientName: selectedPatient.fullName,
      createdAt: editingDiagnosisId
        ? selectedDiagnosis?.createdAt ?? new Date().toISOString()
        : new Date().toISOString(),
      practiceId: currentUser.practiceId,
      diagnosisId: editorPayload.diagnosisId,
      diagnosisLabel,
      commonName: buildCommonName(
        diagnosisLabel,
        conditionsById[editorPayload.diagnosisId]?.plainLanguageSummary ?? ""
      ),
      descriptor:
        conditionsById[editorPayload.diagnosisId]?.plainLanguageSummary ??
        "A diagnosis is on file and attached to an active treatment page.",
      providerId: editorPayload.providerId,
      providerName: editorPayload.providerLabel || currentUser.name,
      diagnosisDate: new Date().toISOString(),
      toothLabel: editorPayload.toothLabel,
      selectedTreatmentIds: editorPayload.selectedTreatmentIds,
      conditionSections: preview.diagnosisSections,
      treatmentOptions: preview.treatmentCards
    };

    upsertTimelineEvent(nextEvent);
    setSelectedDiagnosisId(nextEvent.id);
    setEditingDiagnosisId(null);
    setEditorPayload(null);
    setMessage(editingDiagnosisId ? "Diagnosis updated in the patient chart." : "Diagnosis added to the patient chart.");
  }

  function removeDiagnosis(eventId: string) {
    deleteTimelineEvent(eventId);
    if (selectedDiagnosisId === eventId) {
      setSelectedDiagnosisId(null);
    }
    if (editingDiagnosisId === eventId) {
      setEditingDiagnosisId(null);
      setEditorPayload(null);
    }
    setMessage("Diagnosis removed from the patient chart.");
  }

  return (
    <div className="provider-desktop-layout">
      <aside className="panel provider-patient-directory">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Patient database</p>
            <h2>Search patients</h2>
          </div>
        </div>

        <label className="provider-search-field">
          Search patient
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email"
            value={search}
          />
        </label>

        {filteredPatients.length > 0 ? (
          <div className="provider-patient-list">
            {filteredPatients.map((patient) => {
              const active = patient.email === selectedPatient?.email;
              return (
                <button
                  className={`provider-patient-row ${active ? "active" : ""}`}
                  key={patient.email}
                  onClick={() => {
                    setSelectedPatientEmail(patient.email);
                    setSelectedDiagnosisId(null);
                    setEditingDiagnosisId(null);
                    setEditorPayload(null);
                    setMessage(null);
                  }}
                  type="button"
                >
                  <strong>{patient.fullName}</strong>
                  <span>{patient.email}</span>
                  <small>{patient.diagnoses.length} diagnosis{patient.diagnoses.length === 1 ? "" : "es"}</small>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p className="mini-label">No matches</p>
            <h3>No patient found</h3>
            <p>Try another name or email. Patient charts appear here as diagnoses and office activity are added.</p>
          </div>
        )}
      </aside>

      <section className="provider-chart-stack">
        {selectedPatient ? (
          <>
            <section className="panel provider-chart-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Patient chart</p>
                  <h2>{selectedPatient.fullName}</h2>
                  <p className="catalog-note">{selectedPatient.email}</p>
                </div>
                <button className="primary-button" onClick={beginNewDiagnosis} type="button">
                  Add diagnosis
                </button>
              </div>

              <div className="provider-chart-grid">
                <article className="saved-section-card">
                  <div className="saved-section-header">
                    <div>
                      <p className="mini-label">Profile</p>
                      <h3>Patient details</h3>
                    </div>
                  </div>
                  <div className="saved-value-grid">
                    <SavedValue label="Full name" value={selectedPatient.fullName} />
                    <SavedValue label="Email" value={selectedPatient.email} />
                    <SavedValue label="Date of birth" value={selectedPatient.dateOfBirth} />
                    <SavedValue label="Phone" value={selectedPatient.phone} />
                  </div>
                </article>

                <article className="saved-section-card">
                  <div className="saved-section-header">
                    <div>
                      <p className="mini-label">Clearances</p>
                      <h3>Sent and received clearances</h3>
                    </div>
                  </div>
                  <ClearanceActivity
                    clearances={selectedPatient.clearanceDocuments}
                    practiceId={currentUser?.practiceId}
                  />
                </article>
              </div>

              <article className="saved-section-card provider-diagnosis-section">
                <div className="saved-section-header">
                  <div>
                    <p className="mini-label">Office diagnoses</p>
                    <h3>Diagnoses from your office</h3>
                  </div>
                </div>

                {selectedPatient.diagnoses.length > 0 ? (
                  <div className="provider-diagnosis-list">
                    {selectedPatient.diagnoses.map((event) => {
                      const active = selectedDiagnosisId === event.id;
                      return (
                        <article className={`provider-diagnosis-card ${active ? "active" : ""}`} key={event.id}>
                          <div>
                            <strong>{event.diagnosisLabel}</strong>
                            <p>{event.commonName}</p>
                            <span>
                              {event.providerName}
                              {event.toothLabel ? ` • ${event.toothLabel}` : ""}
                              {` • ${formatDate(event.diagnosisDate)}`}
                            </span>
                          </div>
                          <div className="provider-diagnosis-actions">
                            <button className="secondary-button" onClick={() => openDiagnosisPreview(event)} type="button">
                              Preview
                            </button>
                            <button className="secondary-button" onClick={() => beginEditDiagnosis(event)} type="button">
                              Edit
                            </button>
                            <button className="secondary-button danger-button" onClick={() => removeDiagnosis(event.id)} type="button">
                              Remove
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-inline">
                    No diagnoses have been added for this patient yet. Start by adding a diagnosis from this chart.
                  </div>
                )}
              </article>

              <article className="saved-section-card provider-diagnosis-section">
                <div className="saved-section-header">
                  <div>
                    <p className="mini-label">Treatment pages</p>
                    <h3>Treatment options sent to the patient</h3>
                  </div>
                </div>

                <TreatmentPackageActivity diagnoses={selectedPatient.diagnoses} />
              </article>
            </section>

            {(editorPayload || preview) ? (
              <section className="provider-treatment-workspace">
                {editorPayload ? (
                  <section className="panel">
                    <div className="panel-heading">
                      <div>
                        <p className="eyebrow">Diagnosis editor</p>
                        <h2>{editingDiagnosisId ? "Edit diagnosis" : "Add diagnosis"}</h2>
                      </div>
                    </div>

                    <div className="grid two-up">
                      <label>
                        Diagnosing provider
                        <select
                          onChange={(event) => {
                            const provider = getProvidersForPractice(editorPayload.practiceId).find(
                              (entry) => entry.id === event.target.value
                            );
                            setEditorPayload((current) =>
                              current
                                ? {
                                    ...current,
                                    providerId: event.target.value,
                                    providerLabel: provider?.name ?? ""
                                  }
                                : current
                            );
                          }}
                          value={editorPayload.providerId}
                        >
                          {getProvidersForPractice(editorPayload.practiceId).map((provider) => (
                            <option key={provider.id} value={provider.id}>
                              {provider.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Tooth
                        <select
                          onChange={(event) =>
                            setEditorPayload((current) =>
                              current ? { ...current, toothLabel: event.target.value } : current
                            )
                          }
                          value={editorPayload.toothLabel}
                        >
                          <option value="">Choose a tooth</option>
                          {adultTeeth.map((tooth) => (
                            <option key={tooth.id} value={tooth.label}>
                              {tooth.display}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label>
                      Diagnosis
                      <select
                        onChange={(event) =>
                          setEditorPayload((current) =>
                            current
                              ? {
                                  ...current,
                                  diagnosisId: event.target.value,
                                  selectedTreatmentIds: []
                                }
                              : current
                          )
                        }
                        value={editorPayload.diagnosisId}
                      >
                        <option value="">Choose a diagnosis</option>
                        {conditionCatalog.map((condition) => (
                          <option key={condition.id} value={condition.id}>
                            {condition.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="catalog-summary">
                      <strong>{conditionsById[editorPayload.diagnosisId]?.label || "Select a diagnosis"}</strong>
                      <p>
                        {conditionsById[editorPayload.diagnosisId]?.plainLanguageSummary ||
                          "Pick a diagnosis to load the treatment page options."}
                      </p>
                    </div>

                    <section className="choice-section">
                      <div className="section-intro">
                        <h3>Treatment options</h3>
                        <p>Select the treatment paths you want the chart preview to show below this patient.</p>
                      </div>

                      {getTreatmentsForDiagnosis(editorPayload.diagnosisId).length > 0 ? (
                        <div className="option-grid">
                          {getTreatmentsForDiagnosis(editorPayload.diagnosisId).map((option) => {
                            const checked = editorPayload.selectedTreatmentIds.includes(option.id);

                            return (
                              <label className={`option-card ${checked ? "selected" : ""}`} key={option.id}>
                                <input
                                  checked={checked}
                                  onChange={() =>
                                    setEditorPayload((current) =>
                                      current
                                        ? {
                                            ...current,
                                            selectedTreatmentIds: checked
                                              ? current.selectedTreatmentIds.filter((id) => id !== option.id)
                                              : [...current.selectedTreatmentIds, option.id]
                                          }
                                        : current
                                    )
                                  }
                                  type="checkbox"
                                />
                                <div>
                                  <strong>{option.label}</strong>
                                  <p>{option.summary}</p>
                                  <span>{option.optionGroupLabel}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="empty-inline">Choose a diagnosis first to load treatment options.</div>
                      )}
                    </section>

                    <div className="form-footer">
                      <button
                        className="primary-button"
                        disabled={!editorPayload.diagnosisId || editorPayload.selectedTreatmentIds.length === 0}
                        onClick={saveDiagnosis}
                        type="button"
                      >
                        {editingDiagnosisId ? "Save diagnosis changes" : "Save diagnosis to chart"}
                      </button>
                      <button
                        className="secondary-button"
                        onClick={() => {
                          setEditorPayload(null);
                          setEditingDiagnosisId(null);
                        }}
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </section>
                ) : null}

                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">Treatment preview</p>
                      <h2>Patient treatment page preview</h2>
                    </div>
                  </div>

                  {preview ? <PackagePreview preview={preview} /> : <div className="empty-state"><h3>No preview selected</h3></div>}
                </section>
              </section>
            ) : null}

            {message ? <p className="info-text">{message}</p> : null}
          </>
        ) : (
          <section className="panel empty-state">
            <p className="mini-label">Patient database</p>
            <h3>No patient selected</h3>
            <p>Search and select a patient to open the chart, manage diagnoses, and review sent treatment pages.</p>
          </section>
        )}
      </section>
    </div>
  );
}

function buildPatientRecords(
  timeline: TimelineEvent[],
  vault: PatientVault,
  practiceId?: string
) {
  const diagnoses = timeline.filter(
    (event): event is DiagnosisEvent =>
      event.type === "diagnosis" && (!practiceId || !event.practiceId || event.practiceId === practiceId)
  );
  const patientMap = new Map<string, PatientChartRecord>();

  diagnoses.forEach((event) => {
    const key = event.patientEmail.toLowerCase();
    const current = patientMap.get(key);

    patientMap.set(key, {
      email: event.patientEmail,
      fullName: event.patientName,
      dateOfBirth: current?.dateOfBirth ?? "",
      phone: current?.phone ?? "",
      clearanceDocuments: current?.clearanceDocuments ?? [],
      diagnoses: [event, ...(current?.diagnoses ?? [])].sort(
        (left, right) => new Date(right.diagnosisDate).getTime() - new Date(left.diagnosisDate).getTime()
      )
    });
  });

  if (vault.email) {
    const key = vault.email.toLowerCase();
    const current = patientMap.get(key);
    patientMap.set(key, {
      email: vault.email,
      fullName: vault.fullName || current?.fullName || "Unnamed patient",
      dateOfBirth: vault.dateOfBirth || current?.dateOfBirth || "",
      phone: vault.phone || current?.phone || "",
      clearanceDocuments: vault.clearanceDocuments,
      diagnoses: current?.diagnoses ?? []
    });
  }

  return Array.from(patientMap.values()).sort((left, right) => left.fullName.localeCompare(right.fullName));
}

function createPayloadForPatient(input: {
  patient: PatientChartRecord;
  currentUserName: string;
  currentUserPracticeId: string;
}): IntakePayload {
  const providers = getProvidersForPractice(input.currentUserPracticeId);
  const provider = providers[0];

  return {
    patientName: input.patient.fullName,
    patientEmail: input.patient.email,
    dateOfBirth: input.patient.dateOfBirth,
    practiceId: input.currentUserPracticeId || practiceCatalog[0]?.id || "",
    providerId: provider?.id ?? "",
    providerLabel: provider?.name ?? input.currentUserName,
    diagnosisId: "",
    toothLabel: "",
    selectedTreatmentIds: []
  };
}

function payloadFromDiagnosisEvent(
  event: DiagnosisEvent,
  patient: PatientChartRecord,
  practiceId: string
): IntakePayload {
  const selectedTreatmentIds =
    event.selectedTreatmentIds && event.selectedTreatmentIds.length > 0
      ? event.selectedTreatmentIds
      : event.treatmentOptions
          .map((option) =>
            Object.values(treatmentsById).find((entry) => entry.label === option.label)?.id ?? ""
          )
          .filter(Boolean);

  return {
    patientName: patient.fullName,
    patientEmail: patient.email,
    dateOfBirth: patient.dateOfBirth,
    practiceId: event.practiceId ?? practiceId,
    providerId: event.providerId ?? "",
    providerLabel: event.providerName,
    diagnosisId: event.diagnosisId,
    toothLabel: event.toothLabel ?? "",
    selectedTreatmentIds
  };
}

function buildAnalysisFromEvent(event: DiagnosisEvent, patientName: string): AnalysisResponse {
  const payload = {
    patientName,
    patientEmail: event.patientEmail,
    dateOfBirth: "",
    practiceId: event.practiceId ?? practiceCatalog[0]?.id ?? "",
    providerId: event.providerId ?? "",
    providerLabel: event.providerName,
    diagnosisId: event.diagnosisId,
    toothLabel: event.toothLabel ?? "",
    selectedTreatmentIds:
      event.selectedTreatmentIds && event.selectedTreatmentIds.length > 0
        ? event.selectedTreatmentIds
        : event.treatmentOptions
            .map((option) =>
              Object.values(treatmentsById).find((entry) => entry.label === option.label)?.id ?? ""
            )
            .filter(Boolean)
  } satisfies IntakePayload;

  if (payload.selectedTreatmentIds.length > 0) {
    return buildMockPlan(payload, []);
  }

  return {
    packageVersionId: event.id,
    diagnosisId: event.diagnosisId,
    providerLabel: event.providerName,
    toothLabel: event.toothLabel ?? "",
    selectedTreatmentIds: [],
    headline: `Education package for ${patientName}`,
    summary: event.descriptor,
    specialtyLabel: "Provider preview",
    packageSource: "Saved chart diagnosis",
    fairnessNote: "This preview is being shown from the saved chart diagnosis.",
    diagnosisSections: event.conditionSections,
    treatmentCards: event.treatmentOptions,
    mediaPlan: [],
    consentPreview: [],
    commonQuestions: [],
    practiceDefaults: [],
    aiQnaGuidance: ""
  };
}

function SavedValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="saved-value-card">
      <p className="saved-value-label">{label}</p>
      <p className="saved-value-text">{value || "Not entered"}</p>
    </div>
  );
}

function ClearanceActivity({
  clearances,
  practiceId
}: {
  clearances: PatientVault["clearanceDocuments"];
  practiceId?: string;
}) {
  const officeClearances = clearances
    .filter((clearance) => !practiceId || clearance.requestedByPracticeId === practiceId)
    .sort((left, right) => new Date(right.requestedAt).getTime() - new Date(left.requestedAt).getTime());

  const requested = officeClearances.filter((clearance) => clearance.status === "requested");
  const received = officeClearances.filter((clearance) => clearance.status === "received");
  const other = officeClearances.filter(
    (clearance) => clearance.status !== "requested" && clearance.status !== "received"
  );

  if (officeClearances.length === 0) {
    return (
      <div className="empty-inline">
        No clearance traffic has been logged by this office for this patient yet.
      </div>
    );
  }

  return (
    <div className="provider-clearance-grid">
      <ClearanceColumn
        title="Requested"
        emptyLabel="No pending clearance requests."
        items={requested}
      />
      <ClearanceColumn
        title="Received"
        emptyLabel="No clearance documents received yet."
        items={received}
      />
      <ClearanceColumn
        title="Other statuses"
        emptyLabel="No additional clearance statuses."
        items={other}
      />
    </div>
  );
}

function ClearanceColumn({
  title,
  items,
  emptyLabel
}: {
  title: string;
  items: PatientVault["clearanceDocuments"];
  emptyLabel: string;
}) {
  return (
    <article className="saved-entry-card">
      <p className="saved-entry-subtitle">{title}</p>
      {items.length > 0 ? (
        <div className="provider-clearance-list">
          {items.map((item) => (
            <div className="provider-clearance-item" key={item.id}>
              <strong>{item.title}</strong>
              <p>{item.requestedFromOffice || "Outside office not entered"}</p>
              <span>
                Requested {formatDate(item.requestedAt)}
                {item.uploadedAt ? ` • Received ${formatDate(item.uploadedAt)}` : ""}
                {item.dueDate ? ` • Due ${formatDate(item.dueDate)}` : ""}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="saved-empty-state">{emptyLabel}</p>
      )}
    </article>
  );
}

function TreatmentPackageActivity({ diagnoses }: { diagnoses: DiagnosisEvent[] }) {
  const sentPackages = diagnoses.filter((diagnosis) => diagnosis.treatmentOptions.length > 0);

  if (sentPackages.length === 0) {
    return (
      <div className="empty-inline">
        No treatment packages have been sent from this office for this patient yet.
      </div>
    );
  }

  return (
    <div className="provider-package-list">
      {sentPackages.map((diagnosis) => (
        <article className="provider-package-card" key={`${diagnosis.id}-package`}>
          <div>
            <strong>{diagnosis.diagnosisLabel}</strong>
            <p>
              Sent by {diagnosis.providerName} on {formatDate(diagnosis.diagnosisDate)}
            </p>
          </div>
          <ul className="provider-package-options">
            {diagnosis.treatmentOptions.map((option) => (
              <li key={`${diagnosis.id}-${option.label}`}>
                <strong>{option.label}</strong>
                <span>{option.optionGroupLabel}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function PackagePreview({ preview }: { preview: AnalysisResponse }) {
  const pageContent = buildPreviewCarePage(preview);

  return (
    <div className="analysis-stack care-page-preview provider-package-preview">
      <CarePageRenderer content={pageContent} />
    </div>
  );
}

function buildCommonName(label: string, plainLanguageSummary: string) {
  const normalizedLabel = label.toLowerCase();

  if (normalizedLabel.includes("abscess")) {
    return "Infection";
  }
  if (normalizedLabel.includes("irreversible pulpitis")) {
    return "Inflamed nerve";
  }
  if (normalizedLabel.includes("necrotic pulp")) {
    return "Dead nerve";
  }
  if (normalizedLabel.includes("deep decay")) {
    return "Cavity";
  }
  if (normalizedLabel.includes("cracked tooth")) {
    return "Tooth crack";
  }

  const summary = plainLanguageSummary.replace(/\.$/, "").trim();
  if (!summary) {
    return "Condition";
  }

  const firstPhrase = summary.split(",")[0]?.split(".")[0]?.trim() || summary;
  return firstPhrase.length > 36 ? `${firstPhrase.slice(0, 33)}...` : firstPhrase;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function buildPreviewCarePage(preview: AnalysisResponse): CarePageContent {
  const heroMedia = preview.mediaPlan[0] ?? {
    title: "Preview hero visual",
    type: "video",
    description: "Lead explainer visual for the diagnosis and treatment package.",
    duration: "2:00"
  };

  return {
    pageKind: "Preview Package",
    eyebrow: "Patient education package preview",
    title: preview.headline,
    intro: [
      preview.summary,
      "This preview should feel like a complete educational page the provider can trust before sending it to the patient."
    ],
    summary: `Package source: ${preview.packageSource}. Diagnosing provider: ${preview.providerLabel}.`,
    heroMedia,
    heroNote: "The provider should be able to see the diagnosis explanation and treatment storytelling exactly how the patient would experience it.",
    ribbon: [
      {
        title: "Diagnosis sections",
        body: `${preview.diagnosisSections.length} education section${preview.diagnosisSections.length === 1 ? "" : "s"} included.`
      },
      {
        title: "Treatment options",
        body: `${preview.treatmentCards.length} treatment card${preview.treatmentCards.length === 1 ? "" : "s"} prepared for review.`
      },
      {
        title: "Media support",
        body: `${preview.mediaPlan.length} visual or video asset${preview.mediaPlan.length === 1 ? "" : "s"} included to improve understanding.`
      }
    ],
    sections: [
      {
        eyebrow: "Diagnosis page",
        title: "The diagnosis explanation should feel calm, visual, and easy to trust.",
        paragraphs: preview.diagnosisSections.slice(0, 2).map((section) => section.body),
        bullets: preview.diagnosisSections.slice(2).map((section) => section.body),
        labels: preview.diagnosisSections.map((section) => section.title).slice(0, 4),
        media: preview.mediaPlan.slice(0, 1),
        layout: "media-right"
      },
      {
        eyebrow: "Treatment comparison",
        title: "The treatment section should show options without feeling cluttered.",
        paragraphs: [
          "A premium provider package should give enough detail for understanding while still keeping the treatment choices calm and readable."
        ],
        storyItems: preview.treatmentCards.map((card) => ({
          title: card.label,
          body: `${card.summary} ${card.temporaryNotes[0] ?? ""}`.trim()
        })),
        labels: preview.treatmentCards.map((card) => card.optionGroupLabel).slice(0, 4),
        media: preview.mediaPlan.slice(1, 2).length > 0 ? preview.mediaPlan.slice(1, 2) : preview.mediaPlan.slice(0, 1),
        layout: "media-left"
      }
    ],
    timeline: {
      eyebrow: "Treatment path",
      title: "The patient should understand the sequence, not just the name of the procedure.",
      intro: "This is where the preview should walk the patient through what treatment and recovery actually look like.",
      notes: [
        "Good patient pages lower anxiety by showing order and pacing.",
        "Videos and diagrams should support the explanation, not replace it.",
        "The provider should feel comfortable sending this exactly as shown."
      ],
      steps: preview.treatmentCards.slice(0, 4).map((card, index) => ({
        label: `Option ${index + 1}`,
        title: card.label,
        body: `${card.visits[0] ?? card.summary} ${card.temporaryNotes[0] ?? ""}`.trim()
      }))
    },
    gallery: {
      eyebrow: "Pictures and videos",
      title: "A complete package should use several kinds of media",
      intro: "This gallery is where the page becomes much easier for the patient to absorb and revisit later.",
      items: preview.mediaPlan.slice(0, 4)
    },
    faqs: {
      eyebrow: "Patient questions",
      title: "These are the questions patients usually want answered before deciding",
      intro: "A clean FAQ section helps the page feel thorough without turning it into a wall of text.",
      items: (preview.commonQuestions.length > 0 ? preview.commonQuestions : ["What happens next?", "Will this take more than one visit?", "What should I expect after treatment?"])
        .slice(0, 5)
        .map((question) => ({
          question,
          answer: "This answer should be written in plain language and support the provider's explanation without sounding robotic or overly clinical."
        }))
    },
    closing: {
      title: "The package should feel premium enough to send as-is.",
      body: "This preview is most effective when diagnosis explanation, treatment comparison, and media teaching all feel like one cohesive experience.",
      note: "As we add real practice photos, x-rays, diagrams, and video embeds, this section will get even closer to the exact reference pages you shared."
    }
  };
}
