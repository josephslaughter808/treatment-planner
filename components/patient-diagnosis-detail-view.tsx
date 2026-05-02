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
    <section className="panel diagnosis-detail-screen care-page-preview">
      <section className="care-page-hero compact-care-page-hero">
        <div className="diagnosis-detail-header care-page-hero-copy">
          <p className="eyebrow">Diagnosis</p>
          <h1>{event.diagnosisLabel}</h1>
          <p className="diagnosis-subtitle">{event.commonName}</p>
          <p className="diagnosis-descriptor">{event.descriptor}</p>
        </div>

        <aside className="care-page-hero-aside">
          <p className="mini-label">At a glance</p>
          <h3>What this page covers</h3>
          <div className="care-page-fact-list">
            <span className="care-page-fact-pill">{event.conditionSections.length} education sections</span>
            <span className="care-page-fact-pill">{event.treatmentOptions.length} treatment options</span>
            {event.toothLabel ? <span className="care-page-fact-pill">{event.toothLabel}</span> : null}
          </div>
        </aside>
      </section>

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
        <div className="dialogue-list care-page-section-stack">
          {event.conditionSections.map((section) => (
            <article className="dialogue-card care-page-article-card" key={section.title}>
              <h4>{section.title}</h4>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="dialogue-list care-page-section-stack">
          {event.treatmentOptions.map((option) => (
            <article className="dialogue-card care-page-treatment-block" key={option.label}>
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
