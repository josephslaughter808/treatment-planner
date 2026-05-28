"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { getSupabaseAuthHeaders } from "@/lib/supabase-browser";
import {
  emptyVault,
  makeBlankAllergy,
  makeBlankCondition,
  makeBlankMedication,
  readTimelineFromStorage,
  upsertTimelineEvent,
  readCheckInsFromStorage,
  readShareLinksFromStorage,
  readVaultFromStorage,
  writeCheckInsToStorage,
  writeShareLinksToStorage,
  writeVaultToStorage,
  type PatientVault,
  type ShareLinkRecord
} from "@/lib/patient-vault";

export function PatientVaultView() {
  const { currentUser } = useAuth();
  const [vault, setVault] = useState<PatientVault>(() => readVaultFromStorage());
  const [message, setMessage] = useState<string | null>(null);
  const [checkIns, setCheckIns] = useState(() => readCheckInsFromStorage());
  const [shareLinks, setShareLinks] = useState<ShareLinkRecord[]>(() => readShareLinksFromStorage());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingServer, setIsLoadingServer] = useState(false);
  const [editingSections, setEditingSections] = useState({
    profile: false,
    conditions: false,
    medications: false,
    allergies: false,
    insurance: false,
    emergency: false
  });

  function updateVault(next: PatientVault) {
    const updated = { ...next, lastUpdatedAt: new Date().toISOString() };
    setVault(updated);
    writeVaultToStorage(updated);
  }

  async function saveVault() {
    setIsSaving(true);
    const nextVault = sanitizeVault({
      ...vault,
      lastUpdatedAt: new Date().toISOString()
    });
    updateVault(nextVault);
    setCheckIns(readCheckInsFromStorage());

    if (nextVault.email && nextVault.fullName) {
      const existingInitialEvent = readTimelineFromStorage().find(
        (event) =>
          event.type === "initial-history" &&
          event.patientEmail.toLowerCase() === nextVault.email.toLowerCase()
      );
      upsertTimelineEvent({
        id: `initial-history-${nextVault.email.toLowerCase()}`,
        type: "initial-history",
        patientEmail: nextVault.email,
        patientName: nextVault.fullName,
        createdAt: existingInitialEvent?.createdAt || nextVault.lastUpdatedAt,
        summary: "Initial medical history entered in ClearPath."
      });
    }

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

      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to save the patient vault.");
      }

      setMessage(
        `${data.message || "Patient vault saved."} Your office check-in view is updated too.`
      );
      setEditingSections({
        profile: false,
        conditions: false,
        medications: false,
        allergies: false,
        insurance: false,
        emergency: false
      });
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `${error.message} Local vault save still succeeded in this browser.`
          : "Local vault save succeeded, but server sync failed."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function loadFromServer() {
    if (!vault.email) {
      setMessage("Enter the patient email first so ClearPath knows which vault to load.");
      return;
    }

    setIsLoadingServer(true);
    try {
      const response = await fetch(`/api/patient-vault?email=${encodeURIComponent(vault.email)}`, {
        headers: await getSupabaseAuthHeaders()
      });
      const data = (await response.json()) as { vault?: PatientVault | null; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to load the patient vault.");
      }

      if (!data.vault) {
        setMessage("No server-side vault record was found for that email yet.");
        return;
      }

      setVault(data.vault);
      writeVaultToStorage(data.vault);
      await loadCheckInsFromServer(data.vault.email);
      await loadShareLinksFromServer(data.vault.email);
      setMessage("Loaded the patient vault from the server.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load the patient vault.");
    } finally {
      setIsLoadingServer(false);
    }
  }

  const loadCheckInsFromServer = useCallback(async (patientEmail: string) => {
    if (!patientEmail) {
      return;
    }

    const response = await fetch(`/api/check-ins?patientEmail=${encodeURIComponent(patientEmail)}`, {
      headers: await getSupabaseAuthHeaders()
    });
    const data = (await response.json()) as { records?: typeof checkIns; error?: string };
    if (!response.ok || !data.records) {
      return;
    }

    setCheckIns(data.records);
    writeCheckInsToStorage(data.records);
  }, []);

  const loadShareLinksFromServer = useCallback(async (patientEmail: string) => {
    if (!patientEmail) {
      return;
    }

    const response = await fetch(`/api/share-links?patientEmail=${encodeURIComponent(patientEmail)}`, {
      headers: await getSupabaseAuthHeaders()
    });
    const data = (await response.json()) as { shareLinks?: ShareLinkRecord[]; error?: string };
    if (!response.ok || !data.shareLinks) {
      return;
    }

    setShareLinks(data.shareLinks);
    writeShareLinksToStorage(data.shareLinks);
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "patient") {
      return;
    }

    if (vault.fullName && vault.email) {
      return;
    }

    const next = {
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

  useEffect(() => {
    if (vault.email) {
      void loadCheckInsFromServer(vault.email);
      void loadShareLinksFromServer(vault.email);
    }
  }, [loadCheckInsFromServer, loadShareLinksFromServer, vault.email]);

  useEffect(() => {
    if (!vault.email || !vault.fullName || !hasMeaningfulHistory(vault)) {
      return;
    }

    const existingInitialEvent = readTimelineFromStorage().find(
      (event) =>
        event.type === "initial-history" &&
        event.patientEmail.toLowerCase() === vault.email.toLowerCase()
    );

    upsertTimelineEvent({
      id: `initial-history-${vault.email.toLowerCase()}`,
      type: "initial-history",
      patientEmail: vault.email,
      patientName: vault.fullName,
      createdAt: existingInitialEvent?.createdAt || new Date().toISOString(),
      summary: "Initial medical history entered in ClearPath."
    });
  }, [vault]);

  const pendingClearances = vault.clearanceDocuments.filter((document) =>
    ["requested", "expired"].includes(document.status)
  );

  const activeOffices = getActiveOffices(vault, checkIns, shareLinks);

  function removeActiveOffice(practiceId: string) {
    const nextCheckIns = checkIns.filter((entry) => entry.practiceId !== practiceId);
    const nextShareLinks = shareLinks.filter((entry) => entry.practiceId !== practiceId);
    const nextVault = {
      ...vault,
      officeConnections: vault.officeConnections.filter((entry) => entry.practiceId !== practiceId)
    };

    setCheckIns(nextCheckIns);
    writeCheckInsToStorage(nextCheckIns);
    setShareLinks(nextShareLinks);
    writeShareLinksToStorage(nextShareLinks);
    updateVault(nextVault);
    setMessage("Office removed from your active list.");
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
                onClick={() =>
                  setEditingSections((current) => ({ ...current, profile: !current.profile }))
                }
                type="button"
              >
                {editingSections.profile ? "Done" : "✎ Edit"}
              </button>
            </div>
            {editingSections.profile ? (
              <div className="grid two-up">
                <label>
                  Full name
                  <input
                    onChange={(event) => setVault((current) => ({ ...current, fullName: event.target.value }))}
                    value={vault.fullName}
                  />
                </label>
                <label>
                  Email
                  <input
                    onChange={(event) => setVault((current) => ({ ...current, email: event.target.value }))}
                    type="email"
                    value={vault.email}
                  />
                </label>
                <label>
                  Phone
                  <input
                    onChange={(event) => setVault((current) => ({ ...current, phone: event.target.value }))}
                    value={vault.phone}
                  />
                </label>
                <label>
                  Date of birth
                  <input
                    onChange={(event) =>
                      setVault((current) => ({ ...current, dateOfBirth: event.target.value }))
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
                onClick={() =>
                  setEditingSections((current) => ({ ...current, conditions: !current.conditions }))
                }
                type="button"
              >
                {editingSections.conditions ? "Done" : "✎ Edit"}
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
                              setVault((current) => ({
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
                              setVault((current) => ({
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
                    setVault((current) => ({
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
                      subtitle={condition.notes || "Condition on file"}
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
                onClick={() =>
                  setEditingSections((current) => ({ ...current, medications: !current.medications }))
                }
                type="button"
              >
                {editingSections.medications ? "Done" : "✎ Edit"}
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
                              setVault((current) => ({
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
                              setVault((current) => ({
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
                              setVault((current) => ({
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
                    setVault((current) => ({
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
                onClick={() =>
                  setEditingSections((current) => ({ ...current, allergies: !current.allergies }))
                }
                type="button"
              >
                {editingSections.allergies ? "Done" : "✎ Edit"}
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
                              setVault((current) => ({
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
                              setVault((current) => ({
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
                              setVault((current) => ({
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
                    setVault((current) => ({
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
                onClick={() =>
                  setEditingSections((current) => ({ ...current, insurance: !current.insurance }))
                }
                type="button"
              >
                {editingSections.insurance ? "Done" : "✎ Edit"}
              </button>
            </div>
            {editingSections.insurance ? (
              <>
                <div className="grid two-up">
                  <label>
                    Insurance provider
                    <input
                      onChange={(event) =>
                        setVault((current) => ({
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
                        setVault((current) => ({
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
                        setVault((current) => ({
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
                        setVault((current) => ({
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
                onClick={() =>
                  setEditingSections((current) => ({ ...current, emergency: !current.emergency }))
                }
                type="button"
              >
                {editingSections.emergency ? "Done" : "✎ Edit"}
              </button>
            </div>
            {editingSections.emergency ? (
              <div className="grid three-up">
                <label>
                  Contact name
                  <input
                    onChange={(event) =>
                      setVault((current) => ({
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
                      setVault((current) => ({
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
                      setVault((current) => ({
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
          <button className="primary-button" disabled={isSaving} onClick={saveVault} type="button">
            {isSaving ? "Saving vault..." : "Save vault"}
          </button>
          <button
            className="secondary-button"
            disabled={isLoadingServer}
            onClick={loadFromServer}
            type="button"
          >
            {isLoadingServer ? "Loading..." : "Load from server"}
          </button>
          <p>{vault.lastUpdatedAt ? `Last saved ${new Date(vault.lastUpdatedAt).toLocaleString()}` : "Save your vault to lock in these cards."}</p>
        </div>

        {message ? <p className="info-text">{message}</p> : null}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Pending clearances</p>
            <h2>Pending clearance requests</h2>
          </div>
        </div>
        {pendingClearances.length > 0 ? (
          <div className="saved-entry-list">
            {pendingClearances.map((document) => (
              <div className="saved-entry-card saved-entry-alert" key={document.id}>
                <p className="saved-entry-title">{document.title || "Pending clearance"}</p>
                <p className="saved-entry-subtitle">
                  From {document.requestedFromOffice || "outside office"}
                  {document.requestedByPracticeName ? ` for ${document.requestedByPracticeName}` : ""}
                </p>
                {document.dueDate ? (
                  <p className="saved-entry-subtitle">Due {formatVaultDate(document.dueDate)}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptySavedState text="No pending clearances." />
        )}
      </section>

      <section className="panel">
        <p className="eyebrow">Active offices</p>
        <h2>Active offices</h2>
        {activeOffices.length > 0 ? (
          <div className="saved-entry-list">
            {activeOffices.map((office) => (
              <div className="saved-entry-card active-office-card" key={office.practiceId}>
                <div className="saved-section-header active-office-header">
                  <div>
                    <p className="saved-entry-title">{office.practiceName}</p>
                    <p className="saved-entry-subtitle">
                      Active since {formatVaultDate(office.lastVerifiedAt)}
                    </p>
                  </div>
                  <button
                    className="edit-chip"
                    onClick={() => removeActiveOffice(office.practiceId)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
                {office.notes ? <p className="saved-entry-subtitle">{office.notes}</p> : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptySavedState text="No active offices yet." />
        )}
      </section>

      <section className="panel">
        <p className="eyebrow">Requested forms</p>
        <h2>Requested forms</h2>
        <EmptySavedState text="No requested forms right now." />
      </section>
    </div>
  );
}

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
  subtitle: string;
  tone?: "default" | "alert";
}) {
  return (
    <div className={`saved-entry-card ${tone === "alert" ? "saved-entry-alert" : ""}`}>
      <p className="saved-entry-title">{title || "Not added"}</p>
      <p className="saved-entry-subtitle">{subtitle}</p>
    </div>
  );
}

function EmptySavedState({ text }: { text: string }) {
  return <p className="saved-empty-state">{text}</p>;
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

function getActiveOffices(vault: PatientVault, checkIns: ReturnType<typeof readCheckInsFromStorage>, shareLinks: ShareLinkRecord[]) {
  const officeMap = new Map<
    string,
    { practiceId: string; practiceName: string; lastVerifiedAt: string; notes: string }
  >();

  vault.officeConnections.forEach((entry) => {
    officeMap.set(entry.practiceId, entry);
  });

  checkIns.forEach((entry) => {
    const existing = officeMap.get(entry.practiceId);
    const nextDate =
      existing && new Date(existing.lastVerifiedAt).getTime() > new Date(entry.verifiedAt).getTime()
        ? existing.lastVerifiedAt
        : entry.verifiedAt;

    officeMap.set(entry.practiceId, {
      practiceId: entry.practiceId,
      practiceName: entry.practiceName,
      lastVerifiedAt: nextDate,
      notes: entry.notes || existing?.notes || ""
    });
  });

  shareLinks
    .filter((entry) => entry.status === "active" || entry.status === "used")
    .forEach((entry) => {
      const existing = officeMap.get(entry.practiceId);
      const nextDate =
        existing && new Date(existing.lastVerifiedAt).getTime() > new Date(entry.createdAt).getTime()
          ? existing.lastVerifiedAt
          : entry.createdAt;

      officeMap.set(entry.practiceId, {
        practiceId: entry.practiceId,
        practiceName: entry.practiceName,
        lastVerifiedAt: nextDate,
        notes: existing?.notes || ""
      });
    });

  return Array.from(officeMap.values()).sort(
    (a, b) => new Date(b.lastVerifiedAt).getTime() - new Date(a.lastVerifiedAt).getTime()
  );
}

function formatVaultDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function hasMeaningfulHistory(vault: PatientVault) {
  return Boolean(
    vault.dateOfBirth ||
      vault.phone ||
      vault.medicalConditions.length ||
      vault.medications.length ||
      vault.allergies.length ||
      vault.insurance.providerName ||
      vault.insurance.memberId ||
      vault.insurance.groupNumber ||
      vault.insurance.subscriberName ||
      vault.emergencyContact.name ||
      vault.emergencyContact.phone ||
      vault.emergencyContact.relationship
  );
}
