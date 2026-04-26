"use client";

import { useCallback, useEffect, useState } from "react";
import { practiceCatalog } from "@/lib/clinical-catalog";
import {
  emptyVault,
  makeBlankAllergy,
  makeBlankCondition,
  makeBlankMedication,
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
  const [vault, setVault] = useState<PatientVault>(() => readVaultFromStorage());
  const [message, setMessage] = useState<string | null>(null);
  const [checkIns, setCheckIns] = useState(() => readCheckInsFromStorage());
  const [shareLinks, setShareLinks] = useState<ShareLinkRecord[]>(() => readShareLinksFromStorage());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingServer, setIsLoadingServer] = useState(false);
  const [selectedPracticeId, setSelectedPracticeId] = useState(practiceCatalog[0]?.id ?? "");
  const [isCreatingShareLink, setIsCreatingShareLink] = useState(false);

  function updateVault(next: PatientVault) {
    const updated = { ...next, lastUpdatedAt: new Date().toISOString() };
    setVault(updated);
    writeVaultToStorage(updated);
  }

  async function saveVault() {
    setIsSaving(true);
    updateVault(vault);
    setCheckIns(readCheckInsFromStorage());

    try {
      const response = await fetch("/api/patient-vault", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...vault,
          lastUpdatedAt: new Date().toISOString()
        })
      });

      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to save the patient vault.");
      }

      setMessage(
        `${data.message || "Patient vault saved."} Office check-in and emergency card views are updated too.`
      );
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
      const response = await fetch(`/api/patient-vault?email=${encodeURIComponent(vault.email)}`);
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

    const response = await fetch(`/api/check-ins?patientEmail=${encodeURIComponent(patientEmail)}`);
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

    const response = await fetch(`/api/share-links?patientEmail=${encodeURIComponent(patientEmail)}`);
    const data = (await response.json()) as { shareLinks?: ShareLinkRecord[]; error?: string };
    if (!response.ok || !data.shareLinks) {
      return;
    }

    setShareLinks(data.shareLinks);
    writeShareLinksToStorage(data.shareLinks);
  }, []);

  useEffect(() => {
    if (vault.email) {
      void loadCheckInsFromServer(vault.email);
      void loadShareLinksFromServer(vault.email);
    }
  }, [loadCheckInsFromServer, loadShareLinksFromServer, vault.email]);

  async function createShareLink() {
    if (!vault.email) {
      setMessage("Add the patient email before generating an office share link.");
      return;
    }

    setIsCreatingShareLink(true);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();

    try {
      const response = await fetch("/api/share-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          patientEmail: vault.email,
          practiceId: selectedPracticeId,
          expiresAt
        })
      });

      const data = (await response.json()) as {
        message?: string;
        error?: string;
        shareLink?: ShareLinkRecord;
      };

      if (!response.ok || !data.shareLink) {
        throw new Error(data.error || "Unable to create a patient share link.");
      }

      const nextLinks = [data.shareLink, ...shareLinks];
      setShareLinks(nextLinks);
      writeShareLinksToStorage(nextLinks);
      setMessage(`${data.message || "Share link created."} Use the access code for office handoff.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create a share link.");
    } finally {
      setIsCreatingShareLink(false);
    }
  }

  return (
    <div className="vault-layout">
      <section className="panel wallet-card-panel">
        <p className="eyebrow">Wallet-style pass</p>
        <div className="wallet-card">
          <div>
            <p className="wallet-label">ClearPath Patient Pass</p>
            <h2>{vault.fullName || "Patient profile"}</h2>
            <p>{vault.email || "Add your email to activate office autofill."}</p>
          </div>
          <div className="wallet-metadata">
            <span>Member ID</span>
            <strong>{vault.memberId}</strong>
            <span>Wallet code</span>
            <strong>{vault.walletCode}</strong>
          </div>
        </div>
        <p className="catalog-note">
          Tonight’s functional version uses a reusable member ID and wallet code. Real Apple Wallet
          pass packaging can come next.
        </p>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Patient profile</p>
            <h2>Medical history vault</h2>
          </div>
        </div>

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
        </div>

        <div className="grid three-up">
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
          <label>
            Member ID
            <input disabled value={vault.memberId} />
          </label>
        </div>

        <div className="section-intro">
          <h3>Medical conditions</h3>
          <p>Add diagnoses or history items that offices should be able to autofill during intake.</p>
        </div>
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

        <div className="section-intro">
          <h3>Medications</h3>
          <p>These are the medications the patient wants to reuse during office intake and updates.</p>
        </div>
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

        <div className="section-intro">
          <h3>Allergies</h3>
          <p>Include medication allergies like penicillin and any reaction details offices or EMTs should understand.</p>
        </div>
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
                          item.id === allergy.id
                            ? { ...item, allergen: event.target.value }
                            : item
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
                          item.id === allergy.id
                            ? { ...item, reaction: event.target.value }
                            : item
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

        <div className="section-intro">
          <h3>Insurance and emergency contact</h3>
          <p>This is the information returning offices can confirm with one quick review instead of rebuilding intake every time.</p>
        </div>
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
        <div className="grid three-up">
          <label>
            Emergency contact
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
          <p>This saves a functional browser-based intake wallet profile for tonight’s prototype.</p>
        </div>

        {message ? <p className="info-text">{message}</p> : null}
      </section>

      <section className="panel">
        <p className="eyebrow">Office reuse</p>
        <h2>Connected office history</h2>
        {checkIns.length > 0 ? (
          <div className="dialogue-list">
            {checkIns.map((entry) => (
              <div className="dialogue-card" key={entry.id}>
                <h4>{entry.practiceName}</h4>
                <p>Status: {entry.status}</p>
                <p>Verified: {new Date(entry.verifiedAt).toLocaleString()}</p>
                <p>{entry.notes || "No office note recorded."}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No office check-ins have been recorded yet.</p>
        )}
      </section>

      <section className="panel">
        <p className="eyebrow">Office share links</p>
        <h2>Approve a practice-specific intake handoff</h2>
        <div className="grid two-up">
          <label>
            Practice
            <select onChange={(event) => setSelectedPracticeId(event.target.value)} value={selectedPracticeId}>
              {practiceCatalog.map((practice) => (
                <option key={practice.id} value={practice.id}>
                  {practice.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Access window
            <input disabled value="14 days from creation" />
          </label>
        </div>
        <div className="form-footer">
          <button
            className="primary-button"
            disabled={isCreatingShareLink}
            onClick={createShareLink}
            type="button"
          >
            {isCreatingShareLink ? "Creating link..." : "Create office access code"}
          </button>
          <p>This models the patient-approved handoff that a wallet pass or physical card could later trigger.</p>
        </div>

        {shareLinks.length > 0 ? (
          <div className="dialogue-list">
            {shareLinks.map((link) => (
              <div className="dialogue-card" key={link.id}>
                <h4>{link.practiceName}</h4>
                <p>
                  <strong>Access code:</strong> {link.accessCode}
                </p>
                <p>Status: {link.status}</p>
                <p>Expires: {new Date(link.expiresAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No office share links created yet.</p>
        )}
      </section>
    </div>
  );
}
