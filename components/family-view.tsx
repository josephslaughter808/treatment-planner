"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  createMemberId,
  emptyVault,
  makeBlankAllergy,
  makeBlankCondition,
  makeBlankMedication,
  readVaultFromStorage,
  writeVaultToStorage,
  type AllergyEntry,
  type AdultCareLink,
  type ConditionEntry,
  type DependentProfile,
  type FamilyAccessState,
  type MedicationEntry,
  type PatientVault
} from "@/lib/patient-vault";
import { getSupabaseAuthHeaders } from "@/lib/supabase-browser";

type SurgeryHistoryEntry = {
  description: string;
  year: string;
};

const familyStorageKey = "clearpath-family-access";
const surgeryHistoryTitle = "Surgery / hospitalization history";
const pregnancyStatusTitle = "Pregnancy or nursing status";

export function FamilyView() {
  const { currentUser } = useAuth();
  const [family, setFamily] = useState<FamilyAccessState>(() => readFamilyAccess());
  const [ownerVault, setOwnerVault] = useState<PatientVault>(() => readVaultFromStorage());
  const [selectedDependentId, setSelectedDependentId] = useState<string | null>(null);
  const [dependentDraft, setDependentDraft] = useState({
    name: "",
    dateOfBirth: "",
    relationship: "Child",
    legalAuthority: "Parent or legal guardian"
  });
  const [adultDraft, setAdultDraft] = useState({ name: "", email: "", relationship: "Spouse" });
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ownerVaultRef = useRef(ownerVault);

  const selectedDependent = family.dependents.find((dependent) => dependent.id === selectedDependentId) ?? null;
  const incomingRequests = family.adultLinks.filter((link) => link.status === "pending-received");
  const sentRequests = family.adultLinks.filter((link) => link.status === "pending-sent");
  const approvedAdults = family.adultLinks.filter((link) => link.status === "approved");

  useEffect(() => {
    ownerVaultRef.current = ownerVault;
  }, [ownerVault]);

  const saveFamilyToServer = useCallback(
    async (nextFamily: FamilyAccessState, baseVault?: PatientVault) => {
      if (!currentUser || currentUser.role !== "patient") {
        return;
      }

      const sourceVault = baseVault ?? ownerVaultRef.current;
      const nextVault: PatientVault = {
        ...emptyVault,
        ...sourceVault,
        fullName: sourceVault.fullName || currentUser.name,
        email: currentUser.email,
        familyAccess: nextFamily,
        lastUpdatedAt: new Date().toISOString()
      };

      setOwnerVault(nextVault);
      writeVaultToStorage(nextVault);

      try {
        await fetch("/api/patient-vault", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(await getSupabaseAuthHeaders())
          },
          body: JSON.stringify(nextVault)
        });
      } catch {
        // Local storage remains the offline fallback; the next family edit will retry.
      }
    },
    [currentUser]
  );

  function updateFamily(nextFamily: FamilyAccessState) {
    setFamily(nextFamily);
    writeFamilyAccess(nextFamily);

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      void saveFamilyToServer(nextFamily);
    }, 700);
  }

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "patient") {
      return;
    }

    let active = true;
    const patientUser = currentUser;

    async function hydrateFamilyAccess() {
      try {
        const response = await fetch(`/api/patient-vault?email=${encodeURIComponent(patientUser.email)}`, {
          headers: await getSupabaseAuthHeaders()
        });
        const data = (await response.json()) as { vault?: PatientVault | null };

        if (!active || !response.ok) {
          return;
        }

        const localFamily = readFamilyAccess();
        const serverVault = data.vault;
        const serverFamily = normalizeFamilyAccess(serverVault?.familyAccess);

        if (serverVault) {
          setOwnerVault(serverVault);
          writeVaultToStorage(serverVault);
        }

        if (hasFamilyContent(serverFamily)) {
          setFamily(serverFamily);
          writeFamilyAccess(serverFamily);
          return;
        }

        if (hasFamilyContent(localFamily)) {
          setFamily(localFamily);
          writeFamilyAccess(localFamily);
          await saveFamilyToServer(localFamily, serverVault ?? ownerVaultRef.current);
        }
      } catch {
        // The local family profile still works offline.
      }
    }

    void hydrateFamilyAccess();
    return () => {
      active = false;
    };
  }, [currentUser, saveFamilyToServer]);

  function addDependent() {
    const name = dependentDraft.name.trim();
    if (!name) {
      return;
    }

    const dependent: DependentProfile = {
      id: crypto.randomUUID(),
      relationship: dependentDraft.relationship.trim() || "Dependent",
      legalAuthority: dependentDraft.legalAuthority.trim() || "Legal authority on file",
      vault: makeDependentVault(name, dependentDraft.dateOfBirth)
    };

    updateFamily({
      ...family,
      dependents: [...family.dependents, dependent]
    });
    setDependentDraft({
      name: "",
      dateOfBirth: "",
      relationship: "Child",
      legalAuthority: "Parent or legal guardian"
    });
    setSelectedDependentId(dependent.id);
  }

  function removeDependent(id: string) {
    updateFamily({ ...family, dependents: family.dependents.filter((dependent) => dependent.id !== id) });
    if (selectedDependentId === id) {
      setSelectedDependentId(null);
    }
  }

  function updateDependentVault(dependentId: string, updater: PatientVault | ((current: PatientVault) => PatientVault)) {
    updateFamily({
      ...family,
      dependents: family.dependents.map((dependent) => {
        if (dependent.id !== dependentId) {
          return dependent;
        }

        const nextVault = typeof updater === "function" ? updater(dependent.vault) : updater;
        return {
          ...dependent,
          vault: {
            ...nextVault,
            lastUpdatedAt: new Date().toISOString()
          }
        };
      })
    });
  }

  function requestAdultAccess() {
    if (!adultDraft.email.trim()) {
      return;
    }

    updateFamily({
      ...family,
      adultLinks: [
        ...family.adultLinks,
        {
          id: crypto.randomUUID(),
          name: adultDraft.name.trim() || adultDraft.email.trim(),
          email: adultDraft.email.trim(),
          relationship: adultDraft.relationship.trim() || "Adult family member",
          status: "pending-sent",
          requestedAt: new Date().toISOString()
        }
      ]
    });
    setAdultDraft({ name: "", email: "", relationship: "Spouse" });
  }

  function respondToAdultRequest(id: string, status: "approved" | "rejected") {
    updateFamily({
      ...family,
      adultLinks: family.adultLinks.map((link) =>
        link.id === id ? { ...link, status, respondedAt: new Date().toISOString() } : link
      )
    });
  }

  function removeAdultLink(id: string) {
    updateFamily({
      ...family,
      adultLinks: family.adultLinks.filter((link) => link.id !== id)
    });
  }

  return (
    <>
      <section className="panel family-hub-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Family</p>
            <h2>Family profiles and permissions</h2>
            <p>
              Add dependents you legally manage directly, including children or adults under guardianship.
              Other adults stay as linked accounts and are view-only unless they approve access.
            </p>
          </div>
        </div>

        <div className="family-section-block">
          <div className="family-section-heading">
            <div>
              <p className="mini-label">Care Circle</p>
              <h3>Adults connected to you</h3>
              <p>Spouse, parent, adult child, caregiver, or another adult who grants permission.</p>
            </div>
          </div>

          <div className="family-permission-grid">
            <div className="dialogue-card family-permission-panel">
              <p className="mini-label">Request access</p>
              <h4>Ask to view an adult account</h4>
              <p className="field-help">
                Adults must approve access from their own ClearPath account. Once approved, this connection is
                view-only unless we later add a separate legal authority workflow.
              </p>
              <div className="grid three-up">
                <label>
                  Name
                  <input
                    onChange={(event) => setAdultDraft((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Spouse, parent, adult child..."
                    value={adultDraft.name}
                  />
                </label>
                <label>
                  Email
                  <input
                    onChange={(event) => setAdultDraft((current) => ({ ...current, email: event.target.value }))}
                    placeholder="name@example.com"
                    type="email"
                    value={adultDraft.email}
                  />
                </label>
                <label>
                  Relationship
                  <input
                    onChange={(event) =>
                      setAdultDraft((current) => ({ ...current, relationship: event.target.value }))
                    }
                    value={adultDraft.relationship}
                  />
                </label>
              </div>
              <button className="primary-button" onClick={requestAdultAccess} type="button">
                Send permission request
              </button>
            </div>
          </div>

          <div className="saved-entry-list">
            {incomingRequests.map((link) => (
              <div className="saved-entry-card family-member-card" key={link.id}>
                <div>
                  <p className="saved-entry-title">{link.name}</p>
                  <p className="saved-entry-subtitle">
                    Wants view-only access • {link.relationship} • {link.email}
                  </p>
                </div>
                <div className="family-card-actions">
                  <button className="primary-button" onClick={() => respondToAdultRequest(link.id, "approved")} type="button">
                    Accept
                  </button>
                  <button className="edit-chip" onClick={() => respondToAdultRequest(link.id, "rejected")} type="button">
                    Reject
                  </button>
                </div>
              </div>
            ))}

            {approvedAdults.map((link) => (
              <div className="saved-entry-card family-member-card" key={link.id}>
                <div>
                  <p className="saved-entry-title">{link.name}</p>
                  <p className="saved-entry-subtitle">
                    Linked view-only • {link.relationship} • {link.email}
                  </p>
                </div>
                <div className="family-card-actions">
                  <button className="secondary-button" type="button">
                    View history
                  </button>
                  <button className="edit-chip" onClick={() => removeAdultLink(link.id)} type="button">
                    Revoke
                  </button>
                </div>
              </div>
            ))}

            {sentRequests.map((link) => (
              <div className="saved-entry-card family-member-card" key={link.id}>
                <div>
                  <p className="saved-entry-title">{link.name}</p>
                  <p className="saved-entry-subtitle">
                    Request sent • {link.relationship} • {link.email}
                  </p>
                </div>
                <button className="edit-chip" onClick={() => removeAdultLink(link.id)} type="button">
                  Cancel
                </button>
              </div>
            ))}

            {incomingRequests.length + approvedAdults.length + sentRequests.length === 0 ? (
              <p className="saved-empty-state">No adult account links yet.</p>
            ) : null}
          </div>
        </div>

        <div className="family-section-block">
          <div className="family-section-heading">
            <div>
              <p className="mini-label">Kids / Dependents</p>
              <h3>Profiles you manage</h3>
              <p>
                These do not need their own login. Use this for children or legally-managed dependents such
                as a parent under guardianship.
              </p>
            </div>
          </div>

          <div className="dialogue-card family-add-child-card">
            <div className="grid two-up">
              <label>
                Dependent name
                <input
                  onChange={(event) => setDependentDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Full name"
                  value={dependentDraft.name}
                />
              </label>
              <label>
                Date of birth
                <input
                  onChange={(event) =>
                    setDependentDraft((current) => ({ ...current, dateOfBirth: event.target.value }))
                  }
                  type="date"
                  value={dependentDraft.dateOfBirth}
                />
              </label>
              <label>
                Relationship
                <input
                  onChange={(event) =>
                    setDependentDraft((current) => ({ ...current, relationship: event.target.value }))
                  }
                  placeholder="Child, parent, ward..."
                  value={dependentDraft.relationship}
                />
              </label>
              <label>
                Legal authority
                <input
                  onChange={(event) =>
                    setDependentDraft((current) => ({ ...current, legalAuthority: event.target.value }))
                  }
                  placeholder="Parent, guardian, POA, conservator..."
                  value={dependentDraft.legalAuthority}
                />
              </label>
            </div>
            <button className="primary-button" onClick={addDependent} type="button">
              Add dependent profile
            </button>
          </div>

          <div className="child-profile-grid">
            {family.dependents.length > 0 ? (
              family.dependents.map((dependent) => (
                <article className="saved-entry-card child-profile-card" key={dependent.id}>
                  <div>
                    <p className="mini-label">{dependent.relationship}</p>
                    <h4>{dependent.vault.fullName || "Dependent profile"}</h4>
                    <p className="saved-entry-subtitle">
                      {[dependent.vault.dateOfBirth ? `DOB ${dependent.vault.dateOfBirth}` : "DOB not added", dependent.legalAuthority, dependent.vault.medicalConditions.length ? `${dependent.vault.medicalConditions.length} conditions` : "No conditions listed"]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  </div>
                  <div className="family-card-actions">
                    <button className="primary-button" onClick={() => setSelectedDependentId(dependent.id)} type="button">
                      Edit dependent history
                    </button>
                    <button className="edit-chip" onClick={() => removeDependent(dependent.id)} type="button">
                      Remove
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="saved-empty-state">No dependent profiles yet.</p>
            )}
          </div>
        </div>
      </section>

      {selectedDependent ? (
        <DependentMedicalProfileModal
          dependent={selectedDependent}
          onClose={() => setSelectedDependentId(null)}
          onUpdate={(nextVault) => updateDependentVault(selectedDependent.id, nextVault)}
        />
      ) : null}
    </>
  );
}

function DependentMedicalProfileModal({
  dependent,
  onClose,
  onUpdate
}: {
  dependent: DependentProfile;
  onClose: () => void;
  onUpdate: (updater: PatientVault | ((current: PatientVault) => PatientVault)) => void;
}) {
  const vault = dependent.vault;

  function updateField(field: keyof PatientVault, value: string) {
    onUpdate((current) => ({ ...current, [field]: value }));
  }

  function upsertCondition(name: string, notes = "") {
    onUpdate((current) => {
      const existing = current.medicalConditions.find((condition) => condition.name === name);
      if (existing) {
        return {
          ...current,
          medicalConditions: current.medicalConditions.map((condition) =>
            condition.name === name ? { ...condition, notes } : condition
          )
        };
      }

      return {
        ...current,
        medicalConditions: [...current.medicalConditions, { ...makeBlankCondition(), name, notes }]
      };
    });
  }

  function removeCondition(id: string) {
    onUpdate((current) => ({
      ...current,
      medicalConditions: current.medicalConditions.filter((condition) => condition.id !== id)
    }));
  }

  function updateCondition(id: string, field: keyof ConditionEntry, value: string) {
    onUpdate((current) => ({
      ...current,
      medicalConditions: current.medicalConditions.map((condition) =>
        condition.id === id ? { ...condition, [field]: value } : condition
      )
    }));
  }

  function addMedication() {
    onUpdate((current) => ({ ...current, medications: [...current.medications, makeBlankMedication()] }));
  }

  function updateMedication(id: string, field: keyof MedicationEntry, value: string) {
    onUpdate((current) => ({
      ...current,
      medications: current.medications.map((medication) =>
        medication.id === id ? { ...medication, [field]: value } : medication
      )
    }));
  }

  function removeMedication(id: string) {
    onUpdate((current) => ({
      ...current,
      medications: current.medications.filter((medication) => medication.id !== id)
    }));
  }

  function addAllergy() {
    onUpdate((current) => ({ ...current, allergies: [...current.allergies, makeBlankAllergy()] }));
  }

  function updateAllergy(id: string, field: keyof AllergyEntry, value: string) {
    onUpdate((current) => ({
      ...current,
      allergies: current.allergies.map((allergy) =>
        allergy.id === id ? { ...allergy, [field]: value } : allergy
      )
    }));
  }

  function removeAllergy(id: string) {
    onUpdate((current) => ({
      ...current,
      allergies: current.allergies.filter((allergy) => allergy.id !== id)
    }));
  }

  function setQuestionnaireNote(title: string, notes: string) {
    onUpdate((current) => {
      if (!notes.trim()) {
        return {
          ...current,
          medicalConditions: current.medicalConditions.filter((condition) => condition.name !== title)
        };
      }

      const existing = current.medicalConditions.find((condition) => condition.name === title);
      if (existing) {
        return {
          ...current,
          medicalConditions: current.medicalConditions.map((condition) =>
            condition.name === title ? { ...condition, notes } : condition
          )
        };
      }

      return {
        ...current,
        medicalConditions: [...current.medicalConditions, { ...makeBlankCondition(), name: title, notes }]
      };
    });
  }

  function getQuestionnaireNote(title: string) {
    return vault.medicalConditions.find((condition) => condition.name === title)?.notes ?? "";
  }

  function getSurgeryEntries() {
    const parsed = parseSurgeryHistoryEntries(getQuestionnaireNote(surgeryHistoryTitle));
    return parsed.length > 0 ? parsed : [{ description: "", year: "" }];
  }

  function updateSurgeryEntry(index: number, field: keyof SurgeryHistoryEntry, value: string) {
    const nextEntries = getSurgeryEntries().map((entry, entryIndex) =>
      entryIndex === index ? { ...entry, [field]: value } : entry
    );
    setQuestionnaireNote(surgeryHistoryTitle, serializeSurgeryHistoryEntries(nextEntries));
  }

  function addSurgeryEntry() {
    setQuestionnaireNote(
      surgeryHistoryTitle,
      serializeSurgeryHistoryEntries([...getSurgeryEntries(), { description: "", year: "" }])
    );
  }

  function removeSurgeryEntry(index: number) {
    const nextEntries = getSurgeryEntries().filter((_, entryIndex) => entryIndex !== index);
    setQuestionnaireNote(surgeryHistoryTitle, serializeSurgeryHistoryEntries(nextEntries));
  }

  return (
    <div className="patient-finder-backdrop family-modal-backdrop" role="presentation">
      <section aria-label={`${vault.fullName} medical history`} aria-modal="true" className="patient-finder-dialog family-child-modal" role="dialog">
        <div className="patient-finder-header">
          <div>
            <p className="eyebrow">Dependent chart</p>
            <h2>{vault.fullName || "Dependent profile"}</h2>
            <p>
              Changes save automatically to this dependent profile. Authority: {dependent.legalAuthority}.
            </p>
          </div>
          <button className="secondary-button" onClick={onClose} type="button">
            Close chart
          </button>
        </div>

        <div className="dependent-edit-banner">
          <div>
            <p className="mini-label">Edit mode</p>
            <strong>You can update this dependent&apos;s medical history directly.</strong>
          </div>
          <span>Children and legal dependents are managed here. Care Circle adults stay view-only.</span>
        </div>

        <div className="child-chart-summary">
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

        <div className="child-chart-scroll">
          <section className="saved-section-card child-chart-section">
            <div className="saved-section-header">
              <div>
                <p className="mini-label">Profile</p>
                <h3>Dependent details</h3>
              </div>
            </div>
            <div className="grid three-up">
              <label>
                Full name
                <input onChange={(event) => updateField("fullName", event.target.value)} value={vault.fullName} />
              </label>
              <label>
                Date of birth
                <input
                  onChange={(event) => updateField("dateOfBirth", event.target.value)}
                  type="date"
                  value={vault.dateOfBirth}
                />
              </label>
              <label>
                Phone or guardian contact
                <input onChange={(event) => updateField("phone", event.target.value)} value={vault.phone} />
              </label>
            </div>
          </section>

          <section className="saved-section-card child-chart-section">
            <div className="saved-section-header">
              <div>
                <p className="mini-label">Guided questionnaire</p>
                <h3>Medical history overview</h3>
              </div>
            </div>
            <div className="guided-option-grid">
              {childQuestionnaireConditionOptions.map((option) => {
                const checked = vault.medicalConditions.some((condition) => condition.name === option);
                return (
                  <label className="guided-option" key={option}>
                    <input
                      checked={checked}
                      onChange={() =>
                        checked
                          ? removeCondition(vault.medicalConditions.find((condition) => condition.name === option)?.id ?? "")
                          : upsertCondition(option)
                      }
                      type="checkbox"
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>

            <div className="grid two-up">
              <label>
                Anesthesia, sedation, or procedure concerns
                <textarea
                  onChange={(event) => setQuestionnaireNote("Anesthesia or sedation history", event.target.value)}
                  placeholder="Nausea, breathing concerns, panic, fainting, difficult IV access, or prior reactions."
                  value={getQuestionnaireNote("Anesthesia or sedation history")}
                />
              </label>
              <label>
                Current symptoms or recent health changes
                <textarea
                  onChange={(event) => setQuestionnaireNote("Current symptoms or recent changes", event.target.value)}
                  placeholder="Fever, new pain, recent diagnosis, medication changes, ER visits, or specialist care."
                  value={getQuestionnaireNote("Current symptoms or recent changes")}
                />
              </label>
              <label>
                Pregnancy or nursing
                <select
                  onChange={(event) => setQuestionnaireNote(pregnancyStatusTitle, event.target.value)}
                  value={getQuestionnaireNote(pregnancyStatusTitle)}
                >
                  <option value="">Select one</option>
                  <option value="No">No</option>
                  <option value="Not applicable">Not applicable</option>
                  <option value="Pregnant">Pregnant</option>
                  <option value="Nursing">Nursing</option>
                </select>
              </label>
              <label>
                Anything else the office should know?
                <textarea
                  onChange={(event) => setQuestionnaireNote("Additional pre-visit notes", event.target.value)}
                  placeholder="Goals, concerns, privacy preferences, communication needs, or anything not covered."
                  value={getQuestionnaireNote("Additional pre-visit notes")}
                />
              </label>
            </div>

            <div className="questionnaire-field-block surgery-history-block">
              <div>
                <p className="questionnaire-field-label">Surgeries, hospitalizations, or major illnesses</p>
                <p className="field-help">Add each item separately.</p>
              </div>
              <div className="repeatable-history-list">
                {getSurgeryEntries().map((entry, index) => (
                  <div className="repeatable-history-row" key={`child-surgery-${index}`}>
                    <label>
                      Surgery, hospitalization, or major illness
                      <input
                        onChange={(event) => updateSurgeryEntry(index, "description", event.target.value)}
                        placeholder="Example: Tonsillectomy"
                        value={entry.description}
                      />
                    </label>
                    <label>
                      Year
                      <input
                        inputMode="numeric"
                        maxLength={4}
                        onChange={(event) => updateSurgeryEntry(index, "year", event.target.value)}
                        placeholder="2024"
                        value={entry.year}
                      />
                    </label>
                    <button className="secondary-button" onClick={() => removeSurgeryEntry(index)} type="button">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button className="secondary-button" onClick={addSurgeryEntry} type="button">
                Add another surgery or hospitalization
              </button>
            </div>
          </section>

          <section className="saved-section-card child-chart-section">
            <div className="saved-section-header">
              <div>
                <p className="mini-label">Conditions</p>
                <h3>Medical conditions</h3>
              </div>
              <button className="secondary-button" onClick={() => upsertCondition("")} type="button">
                Add condition
              </button>
            </div>
            <div className="dialogue-list">
              {vault.medicalConditions.length > 0 ? (
                vault.medicalConditions.map((condition) => (
                  <div className="dialogue-card form-card" key={condition.id}>
                    <label>
                      Condition
                      <input
                        onChange={(event) => updateCondition(condition.id, "name", event.target.value)}
                        value={condition.name}
                      />
                    </label>
                    <label>
                      Notes
                      <textarea
                        onChange={(event) => updateCondition(condition.id, "notes", event.target.value)}
                        value={condition.notes}
                      />
                    </label>
                    <button className="edit-chip" onClick={() => removeCondition(condition.id)} type="button">
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <p className="saved-empty-state">No conditions added yet.</p>
              )}
            </div>
          </section>

          <section className="saved-section-card child-chart-section">
            <div className="saved-section-header">
              <div>
                <p className="mini-label">Medications</p>
                <h3>Current medications</h3>
              </div>
              <button className="secondary-button" onClick={addMedication} type="button">
                Add medication
              </button>
            </div>
            <div className="dialogue-list">
              {vault.medications.length > 0 ? (
                vault.medications.map((medication) => (
                  <div className="dialogue-card form-card" key={medication.id}>
                    <div className="grid three-up">
                      <label>
                        Medication
                        <input
                          onChange={(event) => updateMedication(medication.id, "name", event.target.value)}
                          value={medication.name}
                        />
                      </label>
                      <label>
                        Dose
                        <input
                          onChange={(event) => updateMedication(medication.id, "dose", event.target.value)}
                          value={medication.dose}
                        />
                      </label>
                      <label>
                        Frequency
                        <input
                          onChange={(event) => updateMedication(medication.id, "frequency", event.target.value)}
                          value={medication.frequency}
                        />
                      </label>
                    </div>
                    <button className="edit-chip" onClick={() => removeMedication(medication.id)} type="button">
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <p className="saved-empty-state">No medications added yet.</p>
              )}
            </div>
          </section>

          <section className="saved-section-card child-chart-section">
            <div className="saved-section-header">
              <div>
                <p className="mini-label">Allergies</p>
                <h3>Allergies and reactions</h3>
              </div>
              <button className="secondary-button" onClick={addAllergy} type="button">
                Add allergy
              </button>
            </div>
            <div className="dialogue-list">
              {vault.allergies.length > 0 ? (
                vault.allergies.map((allergy) => (
                  <div className="dialogue-card form-card" key={allergy.id}>
                    <div className="grid three-up">
                      <label>
                        Allergen
                        <input
                          onChange={(event) => updateAllergy(allergy.id, "allergen", event.target.value)}
                          value={allergy.allergen}
                        />
                      </label>
                      <label>
                        Reaction
                        <input
                          onChange={(event) => updateAllergy(allergy.id, "reaction", event.target.value)}
                          value={allergy.reaction}
                        />
                      </label>
                      <label>
                        Severity
                        <select
                          onChange={(event) => updateAllergy(allergy.id, "severity", event.target.value)}
                          value={allergy.severity}
                        >
                          <option value="mild">Mild</option>
                          <option value="moderate">Moderate</option>
                          <option value="severe">Severe</option>
                        </select>
                      </label>
                    </div>
                    <button className="edit-chip" onClick={() => removeAllergy(allergy.id)} type="button">
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <p className="saved-empty-state">No allergies added yet.</p>
              )}
            </div>
          </section>

          <section className="saved-section-card child-chart-section">
            <div className="saved-section-header">
              <div>
                <p className="mini-label">Insurance and emergency</p>
                <h3>Visit details</h3>
              </div>
            </div>
            <div className="grid two-up">
              <label>
                Insurance provider
                <input
                  onChange={(event) =>
                    onUpdate((current) => ({
                      ...current,
                      insurance: { ...current.insurance, providerName: event.target.value }
                    }))
                  }
                  value={vault.insurance.providerName}
                />
              </label>
              <label>
                Member ID
                <input
                  onChange={(event) =>
                    onUpdate((current) => ({
                      ...current,
                      insurance: { ...current.insurance, memberId: event.target.value }
                    }))
                  }
                  value={vault.insurance.memberId}
                />
              </label>
              <label>
                Emergency contact
                <input
                  onChange={(event) =>
                    onUpdate((current) => ({
                      ...current,
                      emergencyContact: { ...current.emergencyContact, name: event.target.value }
                    }))
                  }
                  value={vault.emergencyContact.name}
                />
              </label>
              <label>
                Emergency phone
                <input
                  onChange={(event) =>
                    onUpdate((current) => ({
                      ...current,
                      emergencyContact: { ...current.emergencyContact, phone: event.target.value }
                    }))
                  }
                  value={vault.emergencyContact.phone}
                />
              </label>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function makeDependentVault(fullName: string, dateOfBirth: string): PatientVault {
  return {
    ...emptyVault,
    profileId: crypto.randomUUID(),
    fullName,
    dateOfBirth,
    memberId: createMemberId("CPK"),
    walletCode: createMemberId("KID"),
    lastUpdatedAt: new Date().toISOString()
  };
}

function readFamilyAccess(): FamilyAccessState {
  if (typeof window === "undefined") {
    return { dependents: [], adultLinks: [] };
  }

  try {
    const stored = window.localStorage.getItem(familyStorageKey);
    if (!stored) {
      return { dependents: [], adultLinks: [] };
    }

    const parsed = JSON.parse(stored) as Partial<FamilyAccessState> & {
      children?: unknown[];
      authorizedAdults?: unknown[];
    };
    const nextFamily = normalizeFamilyAccess({
      dependents: parsed.dependents ?? parsed.children ?? [],
      adultLinks: parsed.adultLinks ?? parsed.authorizedAdults ?? []
    });

    writeFamilyAccess(nextFamily);
    return nextFamily;
  } catch {
    return { dependents: [], adultLinks: [] };
  }
}

function writeFamilyAccess(family: FamilyAccessState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(familyStorageKey, JSON.stringify(family));
}

function normalizeFamilyAccess(rawFamily: unknown): FamilyAccessState {
  const family = isRecord(rawFamily) ? rawFamily : {};
  return {
    dependents: Array.isArray(family.dependents) ? family.dependents.map(normalizeDependentProfile) : [],
    adultLinks: Array.isArray(family.adultLinks) ? family.adultLinks.map(normalizeAdultCareLink) : []
  };
}

function hasFamilyContent(family: FamilyAccessState) {
  return family.dependents.length > 0 || family.adultLinks.length > 0;
}

function normalizeDependentProfile(rawProfile: unknown): DependentProfile {
  const profile = isRecord(rawProfile) ? rawProfile : {};
  const rawVault = isRecord(profile.vault) ? (profile.vault as Partial<PatientVault>) : null;
  const fullName = getString(rawVault?.fullName) || getString(profile.name) || "Dependent profile";
  const dateOfBirth = getString(rawVault?.dateOfBirth) || getString(profile.dateOfBirth);
  const vault: PatientVault = rawVault
    ? {
        ...emptyVault,
        ...rawVault,
        profileId: getString(rawVault.profileId) || crypto.randomUUID(),
        fullName,
        dateOfBirth,
        memberId: getString(rawVault.memberId) || createMemberId("CPK"),
        walletCode: getString(rawVault.walletCode) || createMemberId("KID"),
        lastUpdatedAt: getString(rawVault.lastUpdatedAt) || new Date().toISOString(),
        medicalConditions: Array.isArray(rawVault.medicalConditions) ? rawVault.medicalConditions : [],
        medications: Array.isArray(rawVault.medications) ? rawVault.medications : [],
        allergies: Array.isArray(rawVault.allergies) ? rawVault.allergies : [],
        insurance: { ...emptyVault.insurance, ...(isRecord(rawVault.insurance) ? rawVault.insurance : {}) },
        emergencyContact: {
          ...emptyVault.emergencyContact,
          ...(isRecord(rawVault.emergencyContact) ? rawVault.emergencyContact : {})
        },
        emergencyDisclosure: {
          ...emptyVault.emergencyDisclosure,
          ...(isRecord(rawVault.emergencyDisclosure) ? rawVault.emergencyDisclosure : {})
        },
        clearanceDocuments: Array.isArray(rawVault.clearanceDocuments) ? rawVault.clearanceDocuments : [],
        officeConnections: Array.isArray(rawVault.officeConnections) ? rawVault.officeConnections : [],
        familyAccess: { dependents: [], adultLinks: [] }
      }
    : makeDependentVault(fullName, dateOfBirth);

  return {
    id: getString(profile.id) || crypto.randomUUID(),
    relationship: getString(profile.relationship) || "Dependent",
    legalAuthority: getString(profile.legalAuthority) || "Legal authority on file",
    vault
  };
}

function normalizeAdultCareLink(rawLink: unknown): AdultCareLink {
  const link = isRecord(rawLink) ? rawLink : {};
  const status = getString(link.status);
  const normalizedStatus: AdultCareLink["status"] =
    status === "pending-sent" || status === "pending-received" || status === "approved" || status === "rejected"
      ? status
      : "approved";

  return {
    id: getString(link.id) || crypto.randomUUID(),
    name: getString(link.name) || getString(link.email) || "Adult family member",
    email: getString(link.email),
    relationship: getString(link.relationship) || "Adult family member",
    status: normalizedStatus,
    requestedAt: getString(link.requestedAt) || new Date().toISOString(),
    respondedAt: getString(link.respondedAt) || undefined
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

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

const childQuestionnaireConditionOptions = [
  "No known major medical conditions",
  "High blood pressure",
  "Heart condition, murmur, or chest pain",
  "Asthma or breathing condition",
  "Seizures or epilepsy",
  "Diabetes or blood sugar concern",
  "Bleeding or bruising concern",
  "Anemia or blood disorder",
  "Immune suppression or chronic infection",
  "Cancer history",
  "Kidney or liver disease",
  "Developmental, behavioral, or sensory needs",
  "Anxiety, panic, or procedure fear",
  "Latex sensitivity",
  "Medication allergy history",
  "Food, environmental, or adhesive allergy history",
  "Tobacco, vaping, alcohol, or substance exposure concern",
  "Hospitalization or ER visit in the last year",
  "Specialist care or ongoing medical monitoring"
];
