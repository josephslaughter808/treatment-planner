"use client";

import { useMemo, useState } from "react";
import { markTreatmentRejected, readTimelineFromStorage } from "@/lib/patient-vault";

export function PatientDiagnosisDetailView({ eventId }: { eventId: string }) {
  const [activeTab, setActiveTab] = useState<"condition" | "treatments">("condition");
  const [message, setMessage] = useState<string | null>(null);
  const event = useMemo(
    () =>
      readTimelineFromStorage().find(
        (entry) => entry.type === "diagnosis" && entry.id === eventId
      ),
    [eventId]
  );

  if (!event || event.type !== "diagnosis") {
    return (
      <section className="panel empty-state">
        <h3>Diagnosis not found</h3>
      </section>
    );
  }

  return (
    <section className="panel diagnosis-detail-screen">
      <div className="diagnosis-detail-header">
        <p className="eyebrow">Diagnosis</p>
        <h1>{event.diagnosisLabel}</h1>
        <p className="diagnosis-subtitle">{event.commonName}</p>
        <p className="diagnosis-descriptor">{event.descriptor}</p>
      </div>

      <div className="tab-row">
        <button
          className={`tab-button ${activeTab === "condition" ? "active" : ""}`}
          onClick={() => setActiveTab("condition")}
          type="button"
        >
          Condition
        </button>
        <button
          className={`tab-button ${activeTab === "treatments" ? "active" : ""}`}
          onClick={() => setActiveTab("treatments")}
          type="button"
        >
          Treatment options
        </button>
      </div>

      {activeTab === "condition" ? (
        <div className="dialogue-list">
          {event.conditionSections.map((section) => (
            <article className="dialogue-card" key={section.title}>
              <h4>{section.title}</h4>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="dialogue-list">
          {event.treatmentOptions.map((option) => (
            <article className="dialogue-card" key={option.label}>
              <h4>{option.label}</h4>
              <p>{option.summary}</p>
              <p><strong>Visits:</strong> {option.visits.join(" ")}</p>
              <p><strong>Temporary phase:</strong> {option.temporaryNotes.join(" ")}</p>
              <button
                className="secondary-button"
                onClick={() => {
                  markTreatmentRejected({
                    diagnosisEventId: event.id,
                    treatmentLabel: option.label
                  });
                  setMessage(`${option.label} marked as rejected.`);
                }}
                type="button"
              >
                Mark treatment rejected
              </button>
            </article>
          ))}
          {message ? <p className="info-text">{message}</p> : null}
        </div>
      )}
    </section>
  );
}
