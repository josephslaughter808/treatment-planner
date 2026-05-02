"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { patientPreviewStorageKey, type StoredPatientPreview } from "@/lib/package-preview";
import {
  patientTimelineUpdatedEvent,
  readTimelineFromStorage,
  readVaultFromStorage,
  type TimelineEvent
} from "@/lib/patient-vault";

export function TimelineView() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>(() => readTimelineFromStorage());
  const [preview, setPreview] = useState<StoredPatientPreview | null>(null);

  useEffect(() => {
    function sync() {
      setEvents(readTimelineFromStorage());

      const raw = window.localStorage.getItem(patientPreviewStorageKey);
      if (!raw) {
        setPreview(null);
        return;
      }

      try {
        setPreview(JSON.parse(raw) as StoredPatientPreview);
      } catch {
        setPreview(null);
      }
    }

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(patientTimelineUpdatedEvent, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(patientTimelineUpdatedEvent, sync);
    };
  }, []);

  const timelineEmail =
    currentUser?.role === "patient"
      ? (currentUser.email || readVaultFromStorage().email).toLowerCase()
      : preview?.payload.patientEmail?.toLowerCase() || readVaultFromStorage().email.toLowerCase();

  const timelineEvents = events.filter((event) =>
    timelineEmail ? event.patientEmail.toLowerCase() === timelineEmail : false
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (!timelineEmail) {
    return (
      <section className="panel empty-state">
        <p className="mini-label">Timeline</p>
        <h3>No patient timeline selected yet</h3>
        <p>
          Open a patient package or patient vault first so ClearPath knows which patient history to
          show on the timeline.
        </p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Timeline</p>
          <h2>Care history</h2>
        </div>
      </div>

      {timelineEvents.length > 0 ? (
        <div className="timeline-list">
          {timelineEvents.map((event, index) => (
            <div
              className={`timeline-item ${index === timelineEvents.length - 1 ? "timeline-item-last" : ""}`}
              key={event.id}
            >
              <span className="timeline-dot" />
              {event.type === "initial-history" ? (
                <article className="dialogue-card timeline-card">
                  <p className="mini-label">Initial medical history</p>
                  <h3>Medical history entered</h3>
                  <p>{event.summary}</p>
                  <p className="catalog-note">Entered on {formatDate(event.createdAt)}</p>
                </article>
              ) : (
                <article className="dialogue-card timeline-card">
                  <p className="mini-label">Diagnosis</p>
                  <h3>
                    Diagnosed with <strong>{event.diagnosisLabel}</strong>
                  </h3>
                  <p>
                    by {event.providerName} on {formatDate(event.diagnosisDate)}
                  </p>
                  {event.treatmentRejected ? (
                    <p className="timeline-rejected">
                      Treatment rejected
                      {event.rejectedTreatmentLabels?.length
                        ? `: ${event.rejectedTreatmentLabels.join(", ")}`
                        : ""}
                    </p>
                  ) : null}
                </article>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="mini-label">Timeline ready</p>
          <h3>No diagnoses yet</h3>
          <p>
            Save a case or complete the patient’s initial medical history to start building the
            timeline.
          </p>
        </div>
      )}
    </section>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}
