"use client";

import { useState } from "react";
import { readVaultFromStorage, writeVaultToStorage, type PatientVault } from "@/lib/patient-vault";

export function EmergencyCardView() {
  const [vault, setVault] = useState<PatientVault>(() => readVaultFromStorage());

  const bloodThinners = vault.medications.filter((entry) =>
    /warfarin|eliquis|xarelto|plavix|coumadin|apixaban|rivaroxaban/i.test(
      `${entry.name} ${entry.dose}`
    )
  );

  function updateDisclosure<K extends keyof PatientVault["emergencyDisclosure"]>(
    key: K,
    value: PatientVault["emergencyDisclosure"][K]
  ) {
    const next = {
      ...vault,
      emergencyDisclosure: {
        ...vault.emergencyDisclosure,
        [key]: value
      }
    };

    setVault(next);
    writeVaultToStorage(next);
  }

  return (
    <div className="grid emergency-layout">
      <section className="panel">
        <p className="eyebrow">Emergency disclosure settings</p>
        <h2>Choose what responders may see</h2>
        <div className="option-grid compact-options">
          <label className={`option-card ${vault.emergencyDisclosure.enabled ? "selected" : ""}`}>
            <input
              checked={vault.emergencyDisclosure.enabled}
              onChange={(event) => updateDisclosure("enabled", event.target.checked)}
              type="checkbox"
            />
            <div>
              <strong>Enable emergency card</strong>
              <p>Allow a limited emergency-only profile for incapacitation scenarios.</p>
            </div>
          </label>
          <label className={`option-card ${vault.emergencyDisclosure.showAllergies ? "selected" : ""}`}>
            <input
              checked={vault.emergencyDisclosure.showAllergies}
              onChange={(event) => updateDisclosure("showAllergies", event.target.checked)}
              type="checkbox"
            />
            <div>
              <strong>Share allergies</strong>
              <p>Medication and serious reaction alerts such as penicillin allergy.</p>
            </div>
          </label>
          <label className={`option-card ${vault.emergencyDisclosure.showConditions ? "selected" : ""}`}>
            <input
              checked={vault.emergencyDisclosure.showConditions}
              onChange={(event) => updateDisclosure("showConditions", event.target.checked)}
              type="checkbox"
            />
            <div>
              <strong>Share major conditions</strong>
              <p>High-value conditions the patient wants responders to see immediately.</p>
            </div>
          </label>
          <label className={`option-card ${vault.emergencyDisclosure.showMedications ? "selected" : ""}`}>
            <input
              checked={vault.emergencyDisclosure.showMedications}
              onChange={(event) => updateDisclosure("showMedications", event.target.checked)}
              type="checkbox"
            />
            <div>
              <strong>Share medications</strong>
              <p>Include current medication list in the emergency-only card.</p>
            </div>
          </label>
          <label className={`option-card ${vault.emergencyDisclosure.showEmergencyContact ? "selected" : ""}`}>
            <input
              checked={vault.emergencyDisclosure.showEmergencyContact}
              onChange={(event) => updateDisclosure("showEmergencyContact", event.target.checked)}
              type="checkbox"
            />
            <div>
              <strong>Share emergency contact</strong>
              <p>Let responders see the designated emergency contact directly.</p>
            </div>
          </label>
          <label className={`option-card ${vault.emergencyDisclosure.showBloodThinners ? "selected" : ""}`}>
            <input
              checked={vault.emergencyDisclosure.showBloodThinners}
              onChange={(event) => updateDisclosure("showBloodThinners", event.target.checked)}
              type="checkbox"
            />
            <div>
              <strong>Flag blood thinners</strong>
              <p>Highlight anticoagulants separately if they appear in the medication list.</p>
            </div>
          </label>
        </div>

        <label>
          Responder note
          <textarea
            onChange={(event) => updateDisclosure("responderMessage", event.target.value)}
            rows={4}
            value={vault.emergencyDisclosure.responderMessage}
          />
        </label>
      </section>

      <section className="panel">
        <p className="eyebrow">Emergency card preview</p>
        <div className="emergency-card">
          <h2>{vault.fullName || "Patient name"}</h2>
          <p>{vault.dateOfBirth || "Date of birth not entered"}</p>
          <p>{vault.emergencyDisclosure.responderMessage}</p>

          {vault.emergencyDisclosure.enabled ? (
            <div className="dialogue-list">
              {vault.emergencyDisclosure.showAllergies ? (
                <div className="dialogue-card emergency-section">
                  <h4>Allergies</h4>
                  <ul>
                    {vault.allergies.length > 0 ? (
                      vault.allergies.map((allergy) => (
                        <li key={allergy.id}>
                          {allergy.allergen || "Unnamed allergy"} {allergy.reaction ? `• ${allergy.reaction}` : ""}
                        </li>
                      ))
                    ) : (
                      <li>No allergies entered.</li>
                    )}
                  </ul>
                </div>
              ) : null}

              {vault.emergencyDisclosure.showConditions ? (
                <div className="dialogue-card emergency-section">
                  <h4>Serious conditions</h4>
                  <ul>
                    {vault.medicalConditions.length > 0 ? (
                      vault.medicalConditions.map((condition) => (
                        <li key={condition.id}>{condition.name || "Unnamed condition"}</li>
                      ))
                    ) : (
                      <li>No conditions entered.</li>
                    )}
                  </ul>
                </div>
              ) : null}

              {vault.emergencyDisclosure.showMedications ? (
                <div className="dialogue-card emergency-section">
                  <h4>Medications</h4>
                  <ul>
                    {vault.medications.length > 0 ? (
                      vault.medications.map((medication) => (
                        <li key={medication.id}>
                          {medication.name || "Unnamed medication"} {medication.dose ? `• ${medication.dose}` : ""}
                        </li>
                      ))
                    ) : (
                      <li>No medications entered.</li>
                    )}
                  </ul>
                </div>
              ) : null}

              {vault.emergencyDisclosure.showBloodThinners ? (
                <div className="dialogue-card emergency-section">
                  <h4>Blood thinner alert</h4>
                  <ul>
                    {bloodThinners.length > 0 ? (
                      bloodThinners.map((medication) => (
                        <li key={medication.id}>
                          {medication.name} {medication.dose ? `• ${medication.dose}` : ""}
                        </li>
                      ))
                    ) : (
                      <li>No anticoagulants detected in the current medication list.</li>
                    )}
                  </ul>
                </div>
              ) : null}

              {vault.emergencyDisclosure.showEmergencyContact ? (
                <div className="dialogue-card emergency-section">
                  <h4>Emergency contact</h4>
                  <p>{vault.emergencyContact.name || "No contact entered"}</p>
                  <p>{vault.emergencyContact.relationship}</p>
                  <p>{vault.emergencyContact.phone}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <p>The emergency card is currently disabled.</p>
          )}
        </div>
      </section>
    </div>
  );
}
