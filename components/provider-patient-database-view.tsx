"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  conditionCatalog,
  conditionsById,
  getTreatmentsForDiagnosis,
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
  return (
    <div className="analysis-stack care-page-preview provider-package-preview">
      <section className="care-page-hero compact-care-page-hero">
        <div className="care-page-hero-copy">
          <p className="mini-label">{preview.packageSource}</p>
          <h3>{preview.headline}</h3>
          <p>{preview.summary}</p>
        </div>
        <aside className="care-page-hero-aside">
          <p className="mini-label">Preview package</p>
          <h3>Included in this view</h3>
          <div className="care-page-fact-list">
            <span className="care-page-fact-pill">{preview.diagnosisSections.length} diagnosis sections</span>
            <span className="care-page-fact-pill">{preview.treatmentCards.length} treatment cards</span>
            <span className="care-page-fact-pill">{preview.providerLabel}</span>
          </div>
        </aside>
      </section>

      <article className="care-page-feature-band">
        <h3>Diagnosis education page</h3>
        <div className="dialogue-list">
          {preview.diagnosisSections.map((section) => (
            <div className="dialogue-card care-page-article-card" key={section.title}>
              <h4>{section.title}</h4>
              <p>{section.body}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="care-page-feature-band">
        <h3>Treatment comparison cards</h3>
        <div className="dialogue-list">
          {preview.treatmentCards.map((card) => (
            <div className="dialogue-card care-page-treatment-block" key={card.label}>
              <h4>{card.label}</h4>
              <p>{card.summary}</p>
              <p><strong>Group:</strong> {card.optionGroupLabel}</p>
              <p><strong>Visits:</strong> {card.visits.join(" ")}</p>
              <p><strong>Temporary phase:</strong> {card.temporaryNotes.join(" ")}</p>
            </div>
          ))}
        </div>
      </article>
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
