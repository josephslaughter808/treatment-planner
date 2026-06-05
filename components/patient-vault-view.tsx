"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { getSupabaseAuthHeaders } from "@/lib/supabase-browser";
import {
  emptyVault,
  makeBlankAllergy,
  makeBlankCondition,
  makeBlankMedication,
  readVaultFromStorage,
  writeVaultToStorage,
  type PatientVault
} from "@/lib/patient-vault";

export function PatientVaultView() {
  const { currentUser } = useAuth();
  const [vault, setVault] = useState<PatientVault>(() => readVaultFromStorage());
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingServer, setIsLoadingServer] = useState(false);
  const [editingSections, setEditingSections] = useState(initialEditingSections);
  const [surgeryDraftRowCount, setSurgeryDraftRowCount] = useState(1);
  const hasAutosaveMountedRef = useRef(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedSignatureRef = useRef("");

  function updateVault(next: PatientVault) {
    const updated = { ...next, lastUpdatedAt: new Date().toISOString() };
    setVault(updated);
    writeVaultToStorage(updated);
  }

  function updateDraftVault(updater: PatientVault | ((current: PatientVault) => PatientVault)) {
    const savedAt = new Date().toISOString();
    setVault((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...next, lastUpdatedAt: savedAt };
    });
  }

  const syncVaultToServer = useCallback(async (nextVault: PatientVault, options?: { showSuccessMessage?: boolean }) => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/patient-vault", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getSupabaseAuthHeaders())
        },
        body: JSON.stringify({
          ...nextVault
        })
      });

      if (!response.ok) {
        throw new Error("Unable to save your health profile right now.");
      }

      lastSavedSignatureRef.current = JSON.stringify(nextVault);
      setMessage(options?.showSuccessMessage ? "Your health profile is saved automatically." : null);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `${error.message} Your changes are saved on this device.`
          : "Your changes are saved on this device."
      );
    } finally {
      setIsSaving(false);
    }
  }, []);

  function syncVaultNow() {
    const nextVault = sanitizeVault({
      ...vault,
      lastUpdatedAt: new Date().toISOString()
    });
    writeVaultToStorage(nextVault);
    void syncVaultToServer(nextVault, { showSuccessMessage: true });
  }

  function toggleEditSection(section: EditablePatientSection) {
    if (editingSections[section]) {
      setEditingSections((current) => ({ ...current, [section]: false }));
      return;
    }

    setEditingSections((current) => ({ ...current, [section]: true }));
  }

  async function loadFromServer() {
    if (!vault.email) {
      setMessage("Enter your email first so ClearPath can find your saved health profile.");
      return;
    }

    setIsLoadingServer(true);
    try {
      const response = await fetch(`/api/patient-vault?email=${encodeURIComponent(vault.email)}`, {
        headers: await getSupabaseAuthHeaders()
      });
      const data = (await response.json()) as { vault?: PatientVault | null; error?: string };

      if (!response.ok) {
        throw new Error("Unable to load your health profile right now.");
      }

      if (!data.vault) {
        setMessage("No saved health profile was found for that email yet.");
        return;
      }

      setVault(data.vault);
      writeVaultToStorage(data.vault);
      setMessage("Loaded your saved health profile.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load your health profile right now.");
    } finally {
      setIsLoadingServer(false);
    }
  }

  useEffect(() => {
    const nextVault = sanitizeVault({
      ...vault,
      lastUpdatedAt: new Date().toISOString()
    });
    const nextSignature = JSON.stringify(nextVault);
    writeVaultToStorage(nextVault);

    if (!hasAutosaveMountedRef.current) {
      hasAutosaveMountedRef.current = true;
      lastSavedSignatureRef.current = nextSignature;
      return;
    }

    if (nextSignature === lastSavedSignatureRef.current) {
      return;
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      void syncVaultToServer(nextVault);
    }, 900);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [syncVaultToServer, vault]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "patient") {
      return;
    }

    const isDifferentSignedInPatient =
      vault.email && vault.email.toLowerCase() !== currentUser.email.toLowerCase();

    if (vault.fullName && vault.email && !isDifferentSignedInPatient) {
      return;
    }

    const next = isDifferentSignedInPatient
      ? {
          ...emptyVault,
          fullName: currentUser.name,
          email: currentUser.email
        }
      : {
          ...vault,
          fullName: vault.fullName || currentUser.name,
          email: vault.email || currentUser.email
        };

    if (next.fullName === vault.fullName && next.email === vault.email) {
      return;
    }

    writeVaultToStorage(next);
    startTransition(() => {
      setVault(next);
    });
  }, [currentUser, vault]);

  const completionItems = getPatientCompletionItems(vault);
  const completedItemCount = completionItems.filter((item) => item.complete).length;

  function hasConditionNamed(name: string) {
    return vault.medicalConditions.some((condition) => condition.name.toLowerCase() === name.toLowerCase());
  }

  function toggleQuestionnaireCondition(name: string) {
    updateDraftVault((current) => {
      const exists = current.medicalConditions.some(
        (condition) => condition.name.toLowerCase() === name.toLowerCase()
      );

      return {
        ...current,
        medicalConditions: exists
          ? current.medicalConditions.filter((condition) => condition.name.toLowerCase() !== name.toLowerCase())
          : [
              ...current.medicalConditions,
              {
                id: crypto.randomUUID(),
                name,
                notes: ""
              }
            ]
      };
    });
  }

  function getQuestionnaireNote(title: string) {
    return vault.medicalConditions.find((condition) => condition.name === title)?.notes ?? "";
  }

  function updateQuestionnaireNote(title: string, notes: string) {
    updateDraftVault((current) => {
      const trimmedNotes = notes;
      const existing = current.medicalConditions.find((condition) => condition.name === title);

      if (!trimmedNotes.trim()) {
        return {
          ...current,
          medicalConditions: current.medicalConditions.filter((condition) => condition.name !== title)
        };
      }

      if (existing) {
        return {
          ...current,
          medicalConditions: current.medicalConditions.map((condition) =>
            condition.name === title ? { ...condition, notes: trimmedNotes } : condition
          )
        };
      }

      return {
        ...current,
        medicalConditions: [
          ...current.medicalConditions,
          {
            id: crypto.randomUUID(),
            name: title,
            notes: trimmedNotes
          }
        ]
      };
    });
  }

  function getSurgeryHistoryEntries() {
    const entries = parseSurgeryHistoryEntries(getQuestionnaireNote(surgeryHistoryTitle));
    const rowCount = Math.max(surgeryDraftRowCount, entries.length, 1);
    return Array.from({ length: rowCount }, (_, index) => entries[index] ?? { description: "", year: "" });
  }

  function updateSurgeryHistoryEntry(index: number, field: keyof SurgeryHistoryEntry, value: string) {
    const entries = getSurgeryHistoryEntries();
    const nextEntries = entries.map((entry, entryIndex) =>
      entryIndex === index ? { ...entry, [field]: value } : entry
    );

    updateQuestionnaireNote(surgeryHistoryTitle, serializeSurgeryHistoryEntries(nextEntries));
  }

  function addSurgeryHistoryEntry() {
    setSurgeryDraftRowCount(getSurgeryHistoryEntries().length + 1);
  }

  function removeSurgeryHistoryEntry(index: number) {
    const nextEntries = getSurgeryHistoryEntries().filter((_, entryIndex) => entryIndex !== index);
    setSurgeryDraftRowCount(Math.max(nextEntries.length, 1));
    updateQuestionnaireNote(surgeryHistoryTitle, serializeSurgeryHistoryEntries(nextEntries));
  }

  return (
    <div className="vault-layout v0-patient-vault">
      <section className="panel wallet-card-panel v0-patient-health-hero">
        <p className="eyebrow">Wallet-style pass</p>
        <div className="wallet-card">
          <div>
            <p className="wallet-label">ClearPath Patient Pass</p>
            <h2>{vault.fullName || "Patient profile"}</h2>
            <p>{vault.email || "Add your email to activate office autofill."}</p>
          </div>
          <div className="wallet-metadata">
            <span className="wallet-meta-label">Member ID</span>
            <strong>{vault.memberId}</strong>
            <span>Wallet code</span>
            <strong>{vault.walletCode}</strong>
          </div>
        </div>
        <div className="v0-patient-quick-status">
          <div>
            <span>Conditions</span>
            <strong>{vault.medicalConditions.length}</strong>
          </div>
          <div>
            <span>Medications</span>
            <strong>{vault.medications.length}</strong>
          </div>
          <div>
            <span>Allergies</span>
            <strong>{vault.allergies.length}</strong>
          </div>
          <div>
            <span>Insurance</span>
            <strong>{vault.insurance.providerName ? "Added" : "Open"}</strong>
          </div>
        </div>
      </section>

      <section className="panel patient-checkin-guide">
        <div>
          <p className="eyebrow">Before your visit</p>
          <h2>Complete these sections for your office.</h2>
          <p>
            You can leave a section blank if it does not apply. Changes save automatically as you fill them in.
          </p>
        </div>
        <div className="patient-progress-meter" aria-label="Health profile completion">
          <span>{completedItemCount} of {completionItems.length} complete</span>
          <div>
            <i style={{ width: `${Math.round((completedItemCount / completionItems.length) * 100)}%` }} />
          </div>
        </div>
        <div className="patient-checkin-list">
          {completionItems.map((item) => (
            <button
              className={`patient-checkin-item ${item.complete ? "complete" : ""}`}
              key={item.section}
              onClick={() => setEditingSections((current) => ({ ...current, [item.section]: true }))}
              type="button"
            >
              <span>{item.complete ? "Done" : "Open"}</span>
              <strong>{item.label}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="panel medical-questionnaire-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Medical questionnaire</p>
            <h2>Guided health history</h2>
            <p>
              Keep this current before any healthcare visit. Your care team can review these answers with your
              medications, allergies, insurance, and emergency contact.
            </p>
          </div>
          <button
            className="primary-button"
            onClick={() => toggleEditSection("questionnaire")}
            type="button"
          >
            {editingSections.questionnaire ? "Done" : "Update questionnaire"}
          </button>
        </div>

        {editingSections.questionnaire ? (
          <div className="questionnaire-workspace">
            <div>
              <p className="mini-label">Check any that apply</p>
              <div className="guided-option-grid">
                {questionnaireConditionOptions.map((option) => (
                  <label className="guided-option" key={option}>
                    <input
                      checked={hasConditionNamed(option)}
                      onChange={() => toggleQuestionnaireCondition(option)}
                      type="checkbox"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid two-up">
              {questionnaireNarrativePrompts.map((prompt) => {
                if (prompt.title === surgeryHistoryTitle) {
                  return null;
                }

                if (prompt.title === pregnancyStatusTitle) {
                  return (
                    <label key={prompt.title}>
                      {prompt.label}
                      <select
                        onChange={(event) => updateQuestionnaireNote(prompt.title, event.target.value)}
                        value={getQuestionnaireNote(prompt.title)}
                      >
                        <option value="">Select one</option>
                        <option value="No">No</option>
                        <option value="Not applicable">Not applicable</option>
                        <option value="Pregnant">Pregnant</option>
                        <option value="Nursing">Nursing</option>
                      </select>
                    </label>
                  );
                }

                return (
                  <label key={prompt.title}>
                    {prompt.label}
                    <textarea
                      onChange={(event) => updateQuestionnaireNote(prompt.title, event.target.value)}
                      placeholder={prompt.placeholder}
                      value={getQuestionnaireNote(prompt.title)}
                    />
                  </label>
                );
              })}
            </div>

            <SurgeryHistoryEditor
              entries={getSurgeryHistoryEntries()}
              onAdd={addSurgeryHistoryEntry}
              onRemove={removeSurgeryHistoryEntry}
              onUpdate={updateSurgeryHistoryEntry}
            />
          </div>
        ) : (
          <div className="questionnaire-summary-grid">
            <div>
              <span>Conditions selected</span>
              <strong>{vault.medicalConditions.filter((condition) => questionnaireConditionOptions.includes(condition.name)).length}</strong>
            </div>
            <div>
              <span>History notes</span>
              <strong>{vault.medicalConditions.filter((condition) => questionnaireNarrativePrompts.some((prompt) => prompt.title === condition.name)).length}</strong>
            </div>
            <div>
              <span>Last updated</span>
              <strong>{vault.lastUpdatedAt ? formatVaultDate(vault.lastUpdatedAt) : "Not saved"}</strong>
            </div>
          </div>
        )}
      </section>

      <section className="panel v0-health-profile-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Patient profile</p>
            <h2>My medical history</h2>
          </div>
        </div>
        <div className="saved-section-list">
          <article className="saved-section-card">
            <div className="saved-section-header">
              <div>
                <p className="mini-label">Profile</p>
                <h3>Patient details</h3>
              </div>
              <button
                className="edit-chip"
                onClick={() => toggleEditSection("profile")}
                type="button"
              >
                {editingSections.profile ? "Done" : "Edit"}
              </button>
            </div>
            {editingSections.profile ? (
              <div className="grid two-up">
                <label>
                  Full name
                  <input
                    onChange={(event) => updateDraftVault((current) => ({ ...current, fullName: event.target.value }))}
                    value={vault.fullName}
                  />
                </label>
                <label>
                  Email
                  <input
                    onChange={(event) => updateDraftVault((current) => ({ ...current, email: event.target.value }))}
                    type="email"
                    value={vault.email}
                  />
                </label>
                <label>
                  Phone
                  <input
                    onChange={(event) => updateDraftVault((current) => ({ ...current, phone: event.target.value }))}
                    value={vault.phone}
                  />
                </label>
                <label>
                  Date of birth
                  <input
                    onChange={(event) =>
                      updateDraftVault((current) => ({ ...current, dateOfBirth: event.target.value }))
                    }
                    type="date"
                    value={vault.dateOfBirth}
                  />
                </label>
              </div>
            ) : (
              <div className="saved-value-grid">
                <SavedValue label="Full name" value={vault.fullName} />
                <SavedValue label="Email" value={vault.email} />
                <SavedValue label="Phone" value={vault.phone} />
                <SavedValue label="Date of birth" value={vault.dateOfBirth} />
              </div>
            )}
          </article>

          <article className="saved-section-card">
            <div className="saved-section-header">
              <div>
                <p className="mini-label">Conditions</p>
                <h3>Medical conditions</h3>
              </div>
              <button
                className="edit-chip"
                onClick={() => toggleEditSection("conditions")}
                type="button"
              >
                {editingSections.conditions ? "Done" : "Edit"}
              </button>
            </div>
            {editingSections.conditions ? (
              <>
                <div className="dialogue-list">
                  {vault.medicalConditions.map((condition) => (
                    <div className="dialogue-card form-card" key={condition.id}>
                      <div className="grid two-up">
                        <label>
                          Condition
                          <input
                            onChange={(event) =>
                              updateDraftVault((current) => ({
                                ...current,
                                medicalConditions: current.medicalConditions.map((item) =>
                                  item.id === condition.id ? { ...item, name: event.target.value } : item
                                )
                              }))
                            }
                            value={condition.name}
                          />
                        </label>
                        <label>
                          Notes
                          <input
                            onChange={(event) =>
                              updateDraftVault((current) => ({
                                ...current,
                                medicalConditions: current.medicalConditions.map((item) =>
                                  item.id === condition.id ? { ...item, notes: event.target.value } : item
                                )
                              }))
                            }
                            value={condition.notes}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="secondary-button"
                  onClick={() =>
                    updateDraftVault((current) => ({
                      ...current,
                      medicalConditions: [...current.medicalConditions, makeBlankCondition()]
                    }))
                  }
                  type="button"
                >
                  Add condition
                </button>
              </>
            ) : (
              <div className="saved-entry-list">
                {vault.medicalConditions.length > 0 ? (
                  vault.medicalConditions.map((condition) => (
                    <SavedEntry
                      key={condition.id}
                      title={condition.name}
                      subtitle={getConditionDisplayNote(condition.notes)}
                    />
                  ))
                ) : (
                  <EmptySavedState text="No conditions saved." />
                )}
              </div>
            )}
          </article>

          <article className="saved-section-card">
            <div className="saved-section-header">
              <div>
                <p className="mini-label">Medications</p>
                <h3>Current medications</h3>
              </div>
              <button
                className="edit-chip"
                onClick={() => toggleEditSection("medications")}
                type="button"
              >
                {editingSections.medications ? "Done" : "Edit"}
              </button>
            </div>
            {editingSections.medications ? (
              <>
                <div className="dialogue-list">
                  {vault.medications.map((medication) => (
                    <div className="dialogue-card form-card" key={medication.id}>
                      <div className="grid three-up">
                        <label>
                          Medication
                          <input
                            onChange={(event) =>
                              updateDraftVault((current) => ({
                                ...current,
                                medications: current.medications.map((item) =>
                                  item.id === medication.id ? { ...item, name: event.target.value } : item
                                )
                              }))
                            }
                            value={medication.name}
                          />
                        </label>
                        <label>
                          Dose
                          <input
                            onChange={(event) =>
                              updateDraftVault((current) => ({
                                ...current,
                                medications: current.medications.map((item) =>
                                  item.id === medication.id ? { ...item, dose: event.target.value } : item
                                )
                              }))
                            }
                            value={medication.dose}
                          />
                        </label>
                        <label>
                          Frequency
                          <input
                            onChange={(event) =>
                              updateDraftVault((current) => ({
                                ...current,
                                medications: current.medications.map((item) =>
                                  item.id === medication.id
                                    ? { ...item, frequency: event.target.value }
                                    : item
                                )
                              }))
                            }
                            value={medication.frequency}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="secondary-button"
                  onClick={() =>
                    updateDraftVault((current) => ({
                      ...current,
                      medications: [...current.medications, makeBlankMedication()]
                    }))
                  }
                  type="button"
                >
                  Add medication
                </button>
              </>
            ) : (
              <div className="saved-entry-list">
                {vault.medications.length > 0 ? (
                  vault.medications.map((medication) => (
                    <SavedEntry
                      key={medication.id}
                      title={medication.name}
                      subtitle={[medication.dose, medication.frequency].filter(Boolean).join(" • ") || "Medication on file"}
                    />
                  ))
                ) : (
                  <EmptySavedState text="No medications saved." />
                )}
              </div>
            )}
          </article>

          <article className="saved-section-card">
            <div className="saved-section-header">
              <div>
                <p className="mini-label">Allergies</p>
                <h3>Allergies</h3>
              </div>
              <button
                className="edit-chip"
                onClick={() => toggleEditSection("allergies")}
                type="button"
              >
                {editingSections.allergies ? "Done" : "Edit"}
              </button>
            </div>
            {editingSections.allergies ? (
              <>
                <div className="dialogue-list">
                  {vault.allergies.map((allergy) => (
                    <div className="dialogue-card form-card" key={allergy.id}>
                      <div className="grid three-up">
                        <label>
                          Allergen
                          <input
                            onChange={(event) =>
                              updateDraftVault((current) => ({
                                ...current,
                                allergies: current.allergies.map((item) =>
                                  item.id === allergy.id ? { ...item, allergen: event.target.value } : item
                                )
                              }))
                            }
                            value={allergy.allergen}
                          />
                        </label>
                        <label>
                          Reaction
                          <input
                            onChange={(event) =>
                              updateDraftVault((current) => ({
                                ...current,
                                allergies: current.allergies.map((item) =>
                                  item.id === allergy.id ? { ...item, reaction: event.target.value } : item
                                )
                              }))
                            }
                            value={allergy.reaction}
                          />
                        </label>
                        <label>
                          Severity
                          <select
                            onChange={(event) =>
                              updateDraftVault((current) => ({
                                ...current,
                                allergies: current.allergies.map((item) =>
                                  item.id === allergy.id
                                    ? {
                                        ...item,
                                        severity: event.target.value as "mild" | "moderate" | "severe"
                                      }
                                    : item
                                )
                              }))
                            }
                            value={allergy.severity}
                          >
                            <option value="mild">Mild</option>
                            <option value="moderate">Moderate</option>
                            <option value="severe">Severe</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="secondary-button"
                  onClick={() =>
                    updateDraftVault((current) => ({
                      ...current,
                      allergies: [...current.allergies, makeBlankAllergy()]
                    }))
                  }
                  type="button"
                >
                  Add allergy
                </button>
              </>
            ) : (
              <div className="saved-entry-list">
                {vault.allergies.length > 0 ? (
                  vault.allergies.map((allergy) => (
                    <SavedEntry
                      key={allergy.id}
                      title={allergy.allergen}
                      subtitle={[allergy.reaction, allergy.severity].filter(Boolean).join(" • ") || "Allergy on file"}
                      tone={allergy.severity === "severe" ? "alert" : "default"}
                    />
                  ))
                ) : (
                  <EmptySavedState text="No allergies saved." />
                )}
              </div>
            )}
          </article>

          <article className="saved-section-card">
            <div className="saved-section-header">
              <div>
                <p className="mini-label">Insurance</p>
                <h3>Insurance</h3>
              </div>
              <button
                className="edit-chip"
                onClick={() => toggleEditSection("insurance")}
                type="button"
              >
                {editingSections.insurance ? "Done" : "Edit"}
              </button>
            </div>
            {editingSections.insurance ? (
              <>
                <div className="grid two-up">
                  <label>
                    Insurance provider
                    <input
                      onChange={(event) =>
                        updateDraftVault((current) => ({
                          ...current,
                          insurance: { ...current.insurance, providerName: event.target.value }
                        }))
                      }
                      value={vault.insurance.providerName}
                    />
                  </label>
                  <label>
                    Insurance member ID
                    <input
                      onChange={(event) =>
                        updateDraftVault((current) => ({
                          ...current,
                          insurance: { ...current.insurance, memberId: event.target.value }
                        }))
                      }
                      value={vault.insurance.memberId}
                    />
                  </label>
                </div>
                <div className="grid two-up">
                  <label>
                    Group number
                    <input
                      onChange={(event) =>
                        updateDraftVault((current) => ({
                          ...current,
                          insurance: { ...current.insurance, groupNumber: event.target.value }
                        }))
                      }
                      value={vault.insurance.groupNumber}
                    />
                  </label>
                  <label>
                    Subscriber name
                    <input
                      onChange={(event) =>
                        updateDraftVault((current) => ({
                          ...current,
                          insurance: { ...current.insurance, subscriberName: event.target.value }
                        }))
                      }
                      value={vault.insurance.subscriberName}
                    />
                  </label>
                </div>
              </>
            ) : (
              <div className="insurance-display-card">
                <p className="insurance-card-label">Insurance</p>
                <h4>{vault.insurance.providerName || "No insurance on file"}</h4>
                <p className="insurance-card-id">
                  Member ID: <strong>{vault.insurance.memberId || "Not added"}</strong>
                </p>
                <div className="insurance-card-meta">
                  <div>
                    <span>Group number</span>
                    <strong>{vault.insurance.groupNumber || "Not added"}</strong>
                  </div>
                  <div>
                    <span>Subscriber</span>
                    <strong>{vault.insurance.subscriberName || "Not added"}</strong>
                  </div>
                </div>
              </div>
            )}
          </article>

          <article className="saved-section-card">
            <div className="saved-section-header">
              <div>
                <p className="mini-label">Emergency contact</p>
                <h3>Emergency contact</h3>
              </div>
              <button
                className="edit-chip"
                onClick={() => toggleEditSection("emergency")}
                type="button"
              >
                {editingSections.emergency ? "Done" : "Edit"}
              </button>
            </div>
            {editingSections.emergency ? (
              <div className="grid three-up">
                <label>
                  Contact name
                  <input
                    onChange={(event) =>
                      updateDraftVault((current) => ({
                        ...current,
                        emergencyContact: { ...current.emergencyContact, name: event.target.value }
                      }))
                    }
                    value={vault.emergencyContact.name}
                  />
                </label>
                <label>
                  Relationship
                  <input
                    onChange={(event) =>
                      updateDraftVault((current) => ({
                        ...current,
                        emergencyContact: {
                          ...current.emergencyContact,
                          relationship: event.target.value
                        }
                      }))
                    }
                    value={vault.emergencyContact.relationship}
                  />
                </label>
                <label>
                  Phone
                  <input
                    onChange={(event) =>
                      updateDraftVault((current) => ({
                        ...current,
                        emergencyContact: { ...current.emergencyContact, phone: event.target.value }
                      }))
                    }
                    value={vault.emergencyContact.phone}
                  />
                </label>
              </div>
            ) : (
              <div className="emergency-display-card">
                <p className="insurance-card-label">Emergency contact</p>
                <h4>{vault.emergencyContact.name || "No emergency contact on file"}</h4>
                <p className="emergency-card-subline">
                  {vault.emergencyContact.relationship || "Relationship not added"}
                </p>
                <p className="emergency-card-phone">{vault.emergencyContact.phone || "Phone not added"}</p>
              </div>
            )}
          </article>
        </div>

        <div className="form-footer">
          <button className="primary-button" disabled={isSaving} onClick={syncVaultNow} type="button">
            {isSaving ? "Syncing..." : "Sync now"}
          </button>
          <button
            className="secondary-button"
            disabled={isLoadingServer}
            onClick={loadFromServer}
            type="button"
          >
            {isLoadingServer ? "Loading..." : "Load saved profile"}
          </button>
          <p>{vault.lastUpdatedAt ? `Autosaved ${new Date(vault.lastUpdatedAt).toLocaleString()}` : "Changes save automatically as you type."}</p>
        </div>

        {message ? <p className="info-text">{message}</p> : null}
      </section>

    </div>
  );
}

type EditablePatientSection = keyof typeof initialEditingSections;

const initialEditingSections = {
  questionnaire: false,
  profile: false,
  conditions: false,
  medications: false,
  allergies: false,
  insurance: false,
  emergency: false
};

function SavedValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="saved-value-card">
      <p className="saved-value-label">{label}</p>
      <p className="saved-value-text">{value || "Not added"}</p>
    </div>
  );
}

function SavedEntry({
  title,
  subtitle,
  tone = "default"
}: {
  title: string;
  subtitle?: string;
  tone?: "default" | "alert";
}) {
  return (
    <div className={`saved-entry-card ${tone === "alert" ? "saved-entry-alert" : ""}`}>
      <p className="saved-entry-title">{title || "Not added"}</p>
      {subtitle ? <p className="saved-entry-subtitle">{subtitle}</p> : null}
    </div>
  );
}

function EmptySavedState({ text }: { text: string }) {
  return <p className="saved-empty-state">{text}</p>;
}

function SurgeryHistoryEditor({
  entries,
  onAdd,
  onRemove,
  onUpdate
}: {
  entries: SurgeryHistoryEntry[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof SurgeryHistoryEntry, value: string) => void;
}) {
  return (
    <div className="questionnaire-field-block surgery-history-block">
      <div>
        <p className="questionnaire-field-label">Surgeries, hospitalizations, or major illnesses</p>
        <p className="field-help">Add each item separately so your care team can review the timeline clearly.</p>
      </div>
      <div className="repeatable-history-list">
        {entries.map((entry, index) => (
          <div className="repeatable-history-row" key={`surgery-history-${index}`}>
            <label>
              Surgery, hospitalization, or major illness
              <input
                onChange={(event) => onUpdate(index, "description", event.target.value)}
                placeholder="Example: Open heart surgery"
                value={entry.description}
              />
            </label>
            <label>
              Year
              <input
                inputMode="numeric"
                maxLength={4}
                onChange={(event) => onUpdate(index, "year", event.target.value)}
                placeholder="2013"
                value={entry.year}
              />
            </label>
            <button className="secondary-button" onClick={() => onRemove(index)} type="button">
              Remove
            </button>
          </div>
        ))}
      </div>
      <button className="secondary-button" onClick={onAdd} type="button">
        Add another surgery or hospitalization
      </button>
    </div>
  );
}

function getConditionDisplayNote(notes: string) {
  return notes.trim().toLowerCase() === "selected in medical questionnaire." ? "" : notes;
}

function getPatientCompletionItems(vault: PatientVault): {
  section: EditablePatientSection;
  label: string;
  complete: boolean;
}[] {
  return [
    {
      section: "questionnaire",
      label: "Medical questionnaire",
      complete: true
    },
    {
      section: "profile",
      label: "Patient details",
      complete: Boolean(vault.fullName && vault.email && vault.phone && vault.dateOfBirth)
    },
    {
      section: "conditions",
      label: "Medical conditions",
      complete: true
    },
    {
      section: "medications",
      label: "Current medications",
      complete: true
    },
    {
      section: "allergies",
      label: "Allergies",
      complete: true
    },
    {
      section: "insurance",
      label: "Insurance",
      complete: Boolean(vault.insurance.providerName || vault.insurance.memberId)
    },
    {
      section: "emergency",
      label: "Emergency contact",
      complete: Boolean(vault.emergencyContact.name && vault.emergencyContact.phone)
    }
  ];
}

const questionnaireConditionOptions = [
  "No known major medical conditions",
  "High blood pressure",
  "High cholesterol",
  "Heart disease, chest pain, or heart attack",
  "Heart murmur or valve problem",
  "Pacemaker, defibrillator, or implanted heart device",
  "Congestive heart failure",
  "Irregular heartbeat or atrial fibrillation",
  "Stroke or TIA",
  "Blood clot, DVT, or pulmonary embolism",
  "Bleeding disorder or easy bruising",
  "Blood thinner or antiplatelet medication use",
  "Anemia or blood disorder",
  "Diabetes or prediabetes",
  "Thyroid disease",
  "Adrenal or hormone disorder",
  "Asthma",
  "COPD, emphysema, or chronic bronchitis",
  "Sleep apnea",
  "Tuberculosis or chronic lung infection",
  "Seizures or epilepsy",
  "Migraine or chronic headaches",
  "Parkinson's disease, multiple sclerosis, or movement disorder",
  "Memory loss, dementia, or cognitive concerns",
  "Fainting, dizziness, or falls",
  "Kidney disease",
  "Dialysis or kidney transplant history",
  "Liver disease or hepatitis",
  "Stomach ulcers, reflux, or digestive disease",
  "Inflammatory bowel disease",
  "Cancer history",
  "Chemotherapy, radiation, or immunotherapy",
  "Immune suppression or transplant history",
  "Autoimmune disease",
  "HIV/AIDS",
  "Chronic infection or antibiotic-resistant infection history",
  "Osteoporosis or bone density concerns",
  "Bisphosphonate, Prolia, or other bone medication use",
  "Joint replacement",
  "Implanted device, port, shunt, or hardware",
  "Chronic pain condition",
  "Arthritis or mobility limitation",
  "Anxiety, depression, PTSD, or other mental health condition",
  "Eating disorder or nutritional concern",
  "Latex sensitivity",
  "Medication allergy history",
  "Food, environmental, or adhesive allergy history",
  "Tobacco or nicotine use",
  "Alcohol use concern",
  "Substance use or recovery history",
  "History of anesthesia reaction",
  "Hospitalization or ER visit in the last year",
  "Specialist care or ongoing medical monitoring"
];

const surgeryHistoryTitle = "Surgery / hospitalization history";
const pregnancyStatusTitle = "Pregnancy or nursing status";

const questionnaireNarrativePrompts = [
  {
    title: surgeryHistoryTitle,
    label: "Surgeries, hospitalizations, or major illnesses",
    placeholder: "Add each surgery, hospitalization, or major illness separately."
  },
  {
    title: "Anesthesia or sedation history",
    label: "Anesthesia, sedation, or procedure concerns",
    placeholder: "Reactions to anesthesia, nausea, breathing problems, difficult IV access, panic, fainting, or other procedure concerns."
  },
  {
    title: "Bleeding or healing concerns",
    label: "Bleeding or healing concerns",
    placeholder: "Blood thinners, easy bruising, bleeding disorders, delayed healing, immune suppression, or recent infections."
  },
  {
    title: "Current symptoms or recent changes",
    label: "Current symptoms or recent health changes",
    placeholder: "Chest pain, shortness of breath, fever, infection, new pain, dizziness, swelling, recent diagnosis, or medication changes."
  },
  {
    title: "Specialists and care team",
    label: "Doctors, specialists, or care team members",
    placeholder: "Primary care provider, cardiologist, endocrinologist, oncologist, psychiatrist, surgeon, or anyone managing a condition."
  },
  {
    title: "Functional or accessibility needs",
    label: "Mobility, communication, or accessibility needs",
    placeholder: "Wheelchair/walker use, hearing or vision needs, interpreter needs, anxiety accommodations, caregiver support, or transportation concerns."
  },
  {
    title: pregnancyStatusTitle,
    label: "Pregnancy or nursing",
    placeholder: "Pregnant, nursing, or not applicable."
  },
  {
    title: "Additional pre-visit notes",
    label: "Anything else your care team should know?",
    placeholder: "Anything not covered above, including goals, concerns, privacy preferences, or information you want reviewed before the visit."
  }
];

type SurgeryHistoryEntry = {
  description: string;
  year: string;
};

function parseSurgeryHistoryEntries(notes: string): SurgeryHistoryEntry[] {
  return notes
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [first, second] = line.split(" | ");
      if (second !== undefined) {
        return {
          year: first.trim(),
          description: second.trim()
        };
      }

      const yearMatch = line.match(/^(.*?)(?:\s+in|\s+-|\s*,)?\s*((?:19|20)\d{2})$/i);
      if (yearMatch) {
        return {
          description: yearMatch[1]?.trim() ?? "",
          year: yearMatch[2]?.trim() ?? ""
        };
      }

      return {
        description: line,
        year: ""
      };
    });
}

function serializeSurgeryHistoryEntries(entries: SurgeryHistoryEntry[]) {
  return entries
    .map((entry) => ({
      description: entry.description.trim(),
      year: entry.year.trim()
    }))
    .filter((entry) => entry.description || entry.year)
    .map((entry) => (entry.year ? `${entry.year} | ${entry.description}` : entry.description))
    .join("\n");
}

function sanitizeVault(vault: PatientVault): PatientVault {
  return {
    ...vault,
    fullName: vault.fullName.trim(),
    email: vault.email.trim(),
    phone: vault.phone.trim(),
    dateOfBirth: vault.dateOfBirth.trim(),
    medicalConditions: vault.medicalConditions
      .map((condition) => ({
        ...condition,
        name: condition.name.trim(),
        notes: condition.notes.trim()
      }))
      .filter((condition) => condition.name || condition.notes),
    medications: vault.medications
      .map((medication) => ({
        ...medication,
        name: medication.name.trim(),
        dose: medication.dose.trim(),
        frequency: medication.frequency.trim()
      }))
      .filter((medication) => medication.name || medication.dose || medication.frequency),
    allergies: vault.allergies
      .map((allergy) => ({
        ...allergy,
        allergen: allergy.allergen.trim(),
        reaction: allergy.reaction.trim()
      }))
      .filter((allergy) => allergy.allergen || allergy.reaction),
    insurance: {
      providerName: vault.insurance.providerName.trim(),
      memberId: vault.insurance.memberId.trim(),
      groupNumber: vault.insurance.groupNumber.trim(),
      subscriberName: vault.insurance.subscriberName.trim()
    },
    emergencyContact: {
      name: vault.emergencyContact.name.trim(),
      relationship: vault.emergencyContact.relationship.trim(),
      phone: vault.emergencyContact.phone.trim()
    }
  };
}

function formatVaultDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}
