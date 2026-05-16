"use client";

import { useMemo, useState } from "react";
import { CarePageRenderer, type CarePageContent } from "@/components/care-page-renderer";
import { conditionsById, mediaById } from "@/lib/clinical-catalog";
import { markTreatmentRejected, readTimelineFromStorage } from "@/lib/patient-vault";

export function PatientDiagnosisDetailView({ eventId }: { eventId: string }) {
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

  const pageContent = buildPatientDiagnosisCarePage(event);

  return (
    <section className="patient-diagnosis-detail-space">
      <section className="panel diagnosis-detail-screen care-page-preview patient-care-detail-panel">
        <CarePageRenderer content={pageContent} />
      </section>
      <div className="dialogue-list care-page-action-list patient-treatment-options-list">
        {event.treatmentOptions.map((option) => (
          <article className="dialogue-card care-page-treatment-block patient-treatment-option-card" key={option.label}>
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
    </section>
  );
}

function buildPatientDiagnosisCarePage(
  event: Extract<ReturnType<typeof readTimelineFromStorage>[number], { type: "diagnosis" }>
): CarePageContent {
  const diagnosis = conditionsById[event.diagnosisId];
  const mediaItems = [
    ...(diagnosis?.mediaAssetIds ?? [])
      .map((id) => mediaById[id])
      .filter(Boolean)
      .map((asset) => ({
        title: asset.title,
        type: asset.type,
        description: asset.description,
        duration: asset.duration
      }))
  ];
  const heroMedia = mediaItems[0] ?? {
    title: "Diagnosis explainer visual",
    type: "diagram",
    description: "Large x-ray, annotated photo, or calm educational illustration for the diagnosis."
  };
  const questions = diagnosis?.commonQuestions ?? [];

  return {
    pageKind: "Diagnosis Page",
    eyebrow: "Your diagnosis explained simply",
    title: event.diagnosisLabel,
    intro: [
      event.descriptor,
      "This page is here to make the diagnosis and treatment path feel calmer, clearer, and easier to understand."
    ],
    summary: `In plain language: ${event.commonName.toLowerCase()}.`,
    heroMedia,
    heroNote: "Understanding the diagnosis first makes the treatment discussion much easier to follow.",
    ribbon: [
      {
        title: "Diagnosis",
        body: event.commonName
      },
      {
        title: "Provider note",
        body: event.providerName
      },
      {
        title: "Treatment options",
        body: `${event.treatmentOptions.length} option${event.treatmentOptions.length === 1 ? "" : "s"} connected to this diagnosis.`
      }
    ],
    sections: [
      {
        eyebrow: "What this means",
        title: "The goal is to help you understand the condition before making decisions.",
        paragraphs: event.conditionSections.slice(0, 2).map((section) => section.body),
        bullets: event.conditionSections.slice(2).map((section) => section.body),
        labels: [event.commonName, event.toothLabel || "Tooth-specific", "Diagnosis explanation"],
        media: mediaItems.slice(0, 1),
        layout: "media-right"
      },
      {
        eyebrow: "Treatment direction",
        title: "Once the diagnosis is clear, the next question is what the treatment path looks like.",
        paragraphs: [
          "This section connects the diagnosis to the treatment conversation in simple language before you review the actual options."
        ],
        storyItems: event.treatmentOptions.map((option) => ({
          title: option.label,
          body: option.summary
        })),
        media: mediaItems.slice(1, 2).length > 0 ? mediaItems.slice(1, 2) : mediaItems.slice(0, 1),
        layout: "media-left"
      }
    ],
    timeline: {
      eyebrow: "How treatment is usually discussed",
      title: "The conversation should feel step-by-step, not overwhelming.",
      intro: "Most patients want to know what the choices are, how many visits may be involved, and what recovery could look like.",
      notes: [
        "The page should give context before details.",
        "Images and videos should support understanding.",
        "The final choice still belongs in the provider conversation."
      ],
      steps: event.treatmentOptions.map((option, index) => ({
        label: `Option ${index + 1}`,
        title: option.label,
        body: `${option.visits[0] ?? option.summary} ${option.temporaryNotes[0] ?? ""}`.trim()
      }))
    },
    gallery: {
      eyebrow: "Pictures and videos",
      title: "Visuals should help the diagnosis make sense quickly",
      intro: "A strong patient page pairs the written explanation with diagrams, x-rays, and short videos whenever possible.",
      items: mediaItems.slice(0, 4).length > 0 ? mediaItems.slice(0, 4) : [heroMedia]
    },
    faqs: {
      eyebrow: "Common questions",
      title: "Questions patients often ask at this point",
      intro: "This section should answer the practical questions that help patients process the diagnosis.",
      items: (questions.length > 0 ? questions : ["How serious is this?", "Can the tooth be saved?", "Why am I seeing treatment options?"])
        .slice(0, 5)
        .map((question) => ({
          question,
          answer: "This answer should stay simple, direct, and reassuring while still being honest about the condition and what comes next."
        }))
    },
    closing: {
      title: "A clear diagnosis page builds confidence.",
      body: "The best version of this page combines a simple explanation, rich visuals, and clear transitions into treatment options.",
      note: "If anything still feels unclear, your provider can walk through these steps with you."
    }
  };
}
