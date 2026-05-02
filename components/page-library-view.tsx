"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { useAuth } from "@/components/auth-provider";
import { CarePageRenderer, type CarePageContent } from "@/components/care-page-renderer";
import {
  conditionCatalog,
  conditionsById,
  getPracticeOverride,
  getTreatmentsForDiagnosis,
  mediaById,
  practiceCatalog,
  treatmentCatalog,
  treatmentsById,
  type DiagnosisTemplate,
  type TreatmentOption
} from "@/lib/clinical-catalog";
import { buildMockPlan, type AnalysisResponse } from "@/lib/mock-analysis";

const generalAssetCatalog = [
  {
    id: "general-doctor-patient-conversation",
    title: "Doctor talking with patient",
    type: "general visual",
    description: "A reassuring consult-room image that fits most diagnosis and treatment pages."
  },
  {
    id: "general-chairside-explanation",
    title: "Chairside explanation visual",
    type: "general visual",
    description: "A broad office conversation image that works well in introductions and consent sections."
  },
  {
    id: "general-care-team-support",
    title: "Care team support image",
    type: "general visual",
    description: "A neutral image showing a provider team helping a patient understand the next step."
  }
] as const;

type LibraryMode = "diagnosis" | "treatment";

type DesignControls = {
  fontFamily: "Merriweather" | "Georgia" | "Avenir Next" | "Source Sans 3";
  headingSize: number;
  bodySize: number;
  headingColor: string;
  bodyColor: string;
  sectionSpacing: number;
  cardRadius: number;
  lineHeight: number;
};

const diagnosisWorkingSet = conditionCatalog;
const treatmentWorkingSet = treatmentCatalog.slice(0, 10);

export function PageLibraryView({ mode }: { mode: LibraryMode }) {
  const { currentUser } = useAuth();
  const practiceId = currentUser?.practiceId ?? practiceCatalog[0]?.id ?? "";
  const diagnosisItems = diagnosisWorkingSet;
  const treatmentItems = treatmentWorkingSet;
  const firstDiagnosisId = diagnosisItems[0]?.id ?? "";
  const firstTreatmentId = treatmentItems[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(mode === "diagnosis" ? firstDiagnosisId : firstTreatmentId);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editorTab, setEditorTab] = useState<"item-assets" | "general-assets">("item-assets");
  const [designControls, setDesignControls] = useState<DesignControls>({
    fontFamily: "Source Sans 3",
    headingSize: 36,
    bodySize: 17,
    headingColor: "#2f261f",
    bodyColor: "#605246",
    sectionSpacing: 20,
    cardRadius: 22,
    lineHeight: 1.65
  });

  const selectedDiagnosis = mode === "diagnosis" ? conditionsById[selectedId] : undefined;
  const selectedTreatment = mode === "treatment" ? treatmentsById[selectedId] : undefined;
  const selectedDiagnosisForTreatment = useMemo(
    () =>
      selectedTreatment
        ? diagnosisItems.find((diagnosis) => diagnosis.treatmentOptionIds.includes(selectedTreatment.id)) ?? diagnosisItems[0]
        : undefined,
    [diagnosisItems, selectedTreatment]
  );

  const baseOverrideKey = mode === "diagnosis" ? selectedDiagnosis?.id : selectedDiagnosisForTreatment?.id;
  const initialOverride = baseOverrideKey ? getPracticeOverride(practiceId, baseOverrideKey) : undefined;
  const [infoPageTitle, setInfoPageTitle] = useState(initialOverride?.infoPageTitle ?? "");
  const [infoPageIntro, setInfoPageIntro] = useState(initialOverride?.infoPageIntro ?? "");
  const [consentIntro, setConsentIntro] = useState(initialOverride?.consentIntro ?? "");
  const [preferredMediaAssetIds, setPreferredMediaAssetIds] = useState<string[]>(
    initialOverride?.preferredMediaAssetIds ?? []
  );

  const diagnosisPreview = useMemo<AnalysisResponse | null>(() => {
    const diagnosisId = mode === "diagnosis" ? selectedDiagnosis?.id : selectedDiagnosisForTreatment?.id;
    const treatmentIds =
      mode === "diagnosis"
        ? getTreatmentsForDiagnosis(selectedDiagnosis?.id ?? "")
            .slice(0, 3)
            .map((treatment) => treatment.id)
        : selectedTreatment
          ? [selectedTreatment.id]
          : [];

    if (!diagnosisId || treatmentIds.length === 0) {
      return null;
    }

    return buildMockPlan(
      {
        patientName: "Preview patient",
        patientEmail: "preview@clearpathcare.test",
        dateOfBirth: "1990-01-01",
        practiceId,
        providerId: currentUser?.id ?? "preview-provider",
        providerLabel: currentUser?.name ?? "Preview provider",
        diagnosisId,
        toothLabel: "",
        selectedTreatmentIds: treatmentIds
      },
      []
    );
  }, [
    currentUser?.id,
    currentUser?.name,
    mode,
    practiceId,
    selectedDiagnosis?.id,
    selectedDiagnosisForTreatment?.id,
    selectedTreatment
  ]);

  const mediaAssets = useMemo(() => {
    if (mode === "treatment") {
      return (selectedTreatment?.mediaAssetIds ?? [])
        .map((id) => mediaById[id])
        .filter(Boolean)
        .map((asset) => ({
          id: asset.id,
          title: asset.title,
          type: asset.type,
          description: asset.description,
          duration: asset.duration
        }));
    }

    return (diagnosisPreview?.mediaPlan ?? []).map((asset) => ({
      id: `diagnosis-${asset.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      title: asset.title,
      type: asset.type,
      description: asset.description,
      duration: asset.duration
    }));
  }, [diagnosisPreview?.mediaPlan, mode, selectedTreatment?.mediaAssetIds]);

  const diagnosisTreatmentCards = useMemo(
    () => diagnosisPreview?.treatmentCards ?? [],
    [diagnosisPreview?.treatmentCards]
  );
  const commonQuestions = useMemo(
    () =>
      mode === "diagnosis"
        ? selectedDiagnosis?.commonQuestions ?? []
        : selectedDiagnosisForTreatment?.commonQuestions ?? [],
    [mode, selectedDiagnosis?.commonQuestions, selectedDiagnosisForTreatment?.commonQuestions]
  );

  const listItems = mode === "diagnosis" ? diagnosisItems : treatmentItems;

  function togglePreferredMedia(mediaId: string) {
    setPreferredMediaAssetIds((current) =>
      current.includes(mediaId) ? current.filter((id) => id !== mediaId) : [...current, mediaId]
    );
  }

  function selectItem(nextId: string) {
    const overrideKey =
      mode === "diagnosis"
        ? nextId
        : diagnosisItems.find((diagnosis) => diagnosis.treatmentOptionIds.includes(nextId))?.id;
    const override = overrideKey ? getPracticeOverride(practiceId, overrideKey) : undefined;
    setSelectedId(nextId);
    setInfoPageTitle(override?.infoPageTitle ?? "");
    setInfoPageIntro(override?.infoPageIntro ?? "");
    setConsentIntro(override?.consentIntro ?? "");
    setPreferredMediaAssetIds(override?.preferredMediaAssetIds ?? []);
    setIsEditing(false);
    setMessage(null);
    setEditorTab("item-assets");
  }

  async function handleSave() {
    const saveKey = mode === "diagnosis" ? selectedDiagnosis?.id : selectedDiagnosisForTreatment?.id;
    if (!saveKey || !infoPageTitle || !infoPageIntro) {
      setMessage(`Add a title and intro before saving this ${mode} page.`);
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/practice-overrides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          practiceId,
          diagnosisId: saveKey,
          infoPageTitle,
          infoPageIntro,
          consentIntro,
          preferredMediaAssetIds
        })
      });

      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error || `Unable to save the ${mode} page.`);
      }

      setMessage(data.message || `${capitalize(mode)} page saved.`);
      setIsEditing(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Unable to save the ${mode} page.`);
    } finally {
      setIsSaving(false);
    }
  }

  const previewTitle =
    mode === "diagnosis"
      ? infoPageTitle.trim() || selectedDiagnosis?.label || "Diagnosis page"
      : infoPageTitle.trim() || selectedTreatment?.label || "Treatment page";

  const previewSubtitle =
    mode === "diagnosis"
      ? buildCommonName(selectedDiagnosis?.label ?? "")
      : selectedTreatment?.optionGroupLabel || "Treatment explanation";

  const previewDescriptor =
    mode === "diagnosis"
      ? infoPageIntro.trim() || selectedDiagnosis?.plainLanguageSummary || ""
      : infoPageIntro.trim() || selectedTreatment?.summary || "";
  const reviewDate = "07/03/2025";
  const pageContent = useMemo<CarePageContent | null>(() => {
    if (mode === "diagnosis") {
      if (!selectedDiagnosis) {
        return null;
      }

      return buildDiagnosisCarePage({
        diagnosis: selectedDiagnosis,
        title: previewTitle,
        intro: previewDescriptor,
        commonQuestions,
        mediaAssets,
        treatmentCards: diagnosisTreatmentCards
      });
    }

    if (!selectedTreatment) {
      return null;
    }

    return buildTreatmentCarePage({
      treatment: selectedTreatment,
      title: previewTitle,
      intro: previewDescriptor,
      mediaAssets,
      commonQuestions
    });
  }, [
    commonQuestions,
    diagnosisTreatmentCards,
    mediaAssets,
    mode,
    previewDescriptor,
    previewTitle,
    selectedDiagnosis,
    selectedTreatment
  ]);

  return (
    <div className="treatment-library-layout">
      <aside className="panel treatment-library-sidebar">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{mode === "diagnosis" ? "Diagnosis library" : "Treatment library"}</p>
            <h2>{mode === "diagnosis" ? "Diagnosis pages" : "Treatment pages"}</h2>
          </div>
        </div>

        <div className="treatment-library-list">
          {listItems.map((item) => {
            const active = item.id === selectedId;
            return (
              <button
                className={`treatment-library-row ${active ? "active" : ""}`}
                key={item.id}
                onClick={() => selectItem(item.id)}
                type="button"
              >
                <strong>{item.label}</strong>
                <small>
                  {mode === "diagnosis"
                    ? `${getTreatmentsForDiagnosis(item.id).length} related treatment options`
                    : (item as TreatmentOption).optionGroupLabel}
                </small>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="treatment-library-main">
        {selectedId ? (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Patient page preview</p>
                <h2>{previewTitle}</h2>
                <p className="catalog-note">
                  This preview mirrors the patient-facing structure for the selected {mode}.
                </p>
              </div>
              <button
                className={isEditing ? "secondary-button" : "primary-button"}
                onClick={() => setIsEditing((current) => !current)}
                type="button"
              >
                {isEditing ? "Close edit" : "Edit page"}
              </button>
            </div>

            <div className={`treatment-editor-workspace ${isEditing ? "editing" : ""}`}>
              <section
                className="panel diagnosis-detail-screen provider-treatment-preview-panel care-page-preview"
                style={
                  {
                    "--treatment-heading-color": designControls.headingColor,
                    "--treatment-body-color": designControls.bodyColor,
                    "--treatment-heading-size": `${designControls.headingSize}px`,
                    "--treatment-body-size": `${designControls.bodySize}px`,
                    "--treatment-section-gap": `${designControls.sectionSpacing}px`,
                    "--treatment-card-radius": `${designControls.cardRadius}px`,
                    "--treatment-line-height": `${designControls.lineHeight}`,
                    "--treatment-font-family": designControls.fontFamily
                  } as CSSProperties
                }
              >
                <div className="treatment-preview-meta">
                  <div className="treatment-page-meta">
                    <span>{capitalize(mode)} page preview</span>
                    <span>Medically reviewed.</span>
                    <span>Last updated on {reviewDate}.</span>
                    <span>{previewSubtitle}</span>
                  </div>
                </div>
                {pageContent ? <CarePageRenderer content={pageContent} /> : null}
              </section>

              {isEditing ? (
                <aside className="panel treatment-editor-sidebar treatment-editor-sidebar-shell">
                  <div className="section-intro">
                    <h3>Page editor</h3>
                    <p>Update the wording, styling, and asset selection for this {mode} page.</p>
                  </div>

                  <div className="treatment-edit-stack">
                    <label>
                      Page title
                      <input
                        onChange={(event) => setInfoPageTitle(event.target.value)}
                        placeholder={`Office-specific ${mode} page title`}
                        value={infoPageTitle}
                      />
                    </label>

                    <label>
                      Page intro
                      <textarea
                        onChange={(event) => setInfoPageIntro(event.target.value)}
                        placeholder={`Add the office-specific opening explanation for this ${mode} page.`}
                        rows={4}
                        value={infoPageIntro}
                      />
                    </label>

                    <label>
                      Consent intro
                      <textarea
                        onChange={(event) => setConsentIntro(event.target.value)}
                        placeholder="Add office-specific consent framing."
                        rows={4}
                        value={consentIntro}
                      />
                    </label>

                    <div className="section-intro">
                      <h3>Text customization</h3>
                    </div>

                    <div className="grid two-up">
                      <label>
                        Font
                        <select
                          onChange={(event) =>
                            setDesignControls((current) => ({
                              ...current,
                              fontFamily: event.target.value as DesignControls["fontFamily"]
                            }))
                          }
                          value={designControls.fontFamily}
                        >
                          <option value="Source Sans 3">Source Sans 3</option>
                          <option value="Avenir Next">Avenir Next</option>
                          <option value="Merriweather">Merriweather</option>
                          <option value="Georgia">Georgia</option>
                        </select>
                      </label>

                      <label>
                        Heading size
                        <input
                          max={48}
                          min={28}
                          onChange={(event) =>
                            setDesignControls((current) => ({
                              ...current,
                              headingSize: Number(event.target.value)
                            }))
                          }
                          type="range"
                          value={designControls.headingSize}
                        />
                      </label>
                    </div>

                    <div className="grid two-up">
                      <label>
                        Body size
                        <input
                          max={22}
                          min={15}
                          onChange={(event) =>
                            setDesignControls((current) => ({
                              ...current,
                              bodySize: Number(event.target.value)
                            }))
                          }
                          type="range"
                          value={designControls.bodySize}
                        />
                      </label>

                      <label>
                        Line spacing
                        <input
                          max={2}
                          min={1.3}
                          onChange={(event) =>
                            setDesignControls((current) => ({
                              ...current,
                              lineHeight: Number(event.target.value)
                            }))
                          }
                          step="0.05"
                          type="range"
                          value={designControls.lineHeight}
                        />
                      </label>
                    </div>

                    <div className="grid two-up">
                      <label>
                        Heading color
                        <input
                          onChange={(event) =>
                            setDesignControls((current) => ({
                              ...current,
                              headingColor: event.target.value
                            }))
                          }
                          type="color"
                          value={designControls.headingColor}
                        />
                      </label>

                      <label>
                        Body color
                        <input
                          onChange={(event) =>
                            setDesignControls((current) => ({
                              ...current,
                              bodyColor: event.target.value
                            }))
                          }
                          type="color"
                          value={designControls.bodyColor}
                        />
                      </label>
                    </div>

                    <div className="grid two-up">
                      <label>
                        Section spacing
                        <input
                          max={32}
                          min={12}
                          onChange={(event) =>
                            setDesignControls((current) => ({
                              ...current,
                              sectionSpacing: Number(event.target.value)
                            }))
                          }
                          type="range"
                          value={designControls.sectionSpacing}
                        />
                      </label>

                      <label>
                        Card radius
                        <input
                          max={30}
                          min={12}
                          onChange={(event) =>
                            setDesignControls((current) => ({
                              ...current,
                              cardRadius: Number(event.target.value)
                            }))
                          }
                          type="range"
                          value={designControls.cardRadius}
                        />
                      </label>
                    </div>

                    <div className="section-intro">
                      <h3>Assets</h3>
                    </div>

                    <div className="tab-row compact-tab-row">
                      <button
                        className={`tab-button ${editorTab === "item-assets" ? "active" : ""}`}
                        onClick={() => setEditorTab("item-assets")}
                        type="button"
                      >
                        {mode === "diagnosis" ? "This diagnosis" : "This treatment"}
                      </button>
                      <button
                        className={`tab-button ${editorTab === "general-assets" ? "active" : ""}`}
                        onClick={() => setEditorTab("general-assets")}
                        type="button"
                      >
                        General assets
                      </button>
                    </div>

                    <div className="treatment-editor-assets">
                      {(editorTab === "item-assets" ? mediaAssets : generalAssetCatalog).map((asset) => {
                        const checked = preferredMediaAssetIds.includes(asset.id);
                        return (
                          <article className="saved-entry-card" key={asset.id}>
                            <p className="saved-entry-subtitle">{asset.type}</p>
                            <strong>{asset.title}</strong>
                            <p>{asset.description}</p>
                            <button
                              className={checked ? "secondary-button" : "primary-button"}
                              onClick={() => togglePreferredMedia(asset.id)}
                              type="button"
                            >
                              {checked ? "Remove from page" : "Add to page"}
                            </button>
                          </article>
                        );
                      })}
                    </div>

                    <div className="form-footer">
                      <button className="primary-button" disabled={isSaving} onClick={handleSave} type="button">
                        {isSaving ? `Saving ${mode} page...` : `Save ${mode} page`}
                      </button>
                      <p>The saved version becomes the default page for this content at your practice.</p>
                    </div>
                  </div>
                </aside>
              ) : null}
            </div>

            {message ? <p className="info-text">{message}</p> : null}
          </section>
        ) : (
          <section className="panel empty-state">
            <h3>No page selected</h3>
          </section>
        )}
      </section>
    </div>
  );
}

function buildCommonName(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("abscess")) {
    return "Infection";
  }
  if (normalized.includes("myocardial infarction")) {
    return "Heart attack";
  }
  if (normalized.includes("pulpitis")) {
    return "Nerve inflammation";
  }
  return "Patient explanation page";
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildDiagnosisCarePage(input: {
  diagnosis: DiagnosisTemplate;
  title: string;
  intro: string;
  commonQuestions: string[];
  mediaAssets: Array<{ id: string; title: string; type: string; description: string; duration?: string }>;
  treatmentCards: AnalysisResponse["treatmentCards"];
}): CarePageContent {
  const education = input.diagnosis.educationSections;
  const heroMedia = input.mediaAssets[0] ?? {
    id: "hero-diagnosis",
    title: "Diagnosis hero visual",
    type: "diagram",
    description: "Large x-ray, clinical illustration, or calm explainer image for the diagnosis.",
    duration: undefined
  };
  const galleryItems = input.mediaAssets.length > 0 ? input.mediaAssets : [heroMedia];
  const treatmentCount = input.treatmentCards.length;

  return {
    pageKind: "Diagnosis Page",
    eyebrow: "Your diagnosis explained simply",
    title: input.title,
    intro: [
      input.intro,
      "This page is meant to slow things down and explain what your provider is seeing in a way that feels clear, calm, and easy to understand."
    ],
    summary: toPlainLanguageSummary(input.diagnosis.plainLanguageSummary),
    heroMedia,
    heroNote: "This diagnosis page should help the patient understand what happened before treatment choices are compared.",
    ribbon: [
      {
        title: "What happened",
        body: education[0]?.body ?? "The problem developed gradually inside the tooth and surrounding tissues."
      },
      {
        title: "Why it matters",
        body: education[1]?.body ?? "Without treatment, discomfort, infection, or structural damage may continue to worsen."
      },
      {
        title: "What comes next",
        body:
          treatmentCount > 0
            ? `Your provider may review ${treatmentCount} treatment option${treatmentCount === 1 ? "" : "s"} based on the tooth condition and long-term predictability.`
            : "Your provider will review the next recommended step based on the condition of the tooth."
      }
    ],
    sections: [
      {
        eyebrow: "What this diagnosis means",
        title: "The condition needs to make sense before treatment does.",
        paragraphs: [
          education[0]?.body ?? input.diagnosis.plainLanguageSummary,
          education[2]?.body ?? "This section should connect the diagnosis to why your provider is concerned and what can happen next."
        ],
        bullets: education.map((item) => item.body).slice(0, 4),
        labels: buildLabelsFromDiagnosis(input.diagnosis),
        media: galleryItems.slice(0, 1),
        layout: "media-right"
      },
      {
        eyebrow: "Symptoms and signs",
        title: "Some patients feel a lot. Others notice very little until it worsens.",
        paragraphs: [
          "Diagnosis pages should explain both the symptoms a patient might feel and the clinical signs your office may be seeing on imaging or exam."
        ],
        storyItems: buildDiagnosisStories(input.diagnosis),
        labels: buildQuestionLabels(input.commonQuestions),
        media: galleryItems.slice(1, 2).length > 0 ? galleryItems.slice(1, 2) : galleryItems.slice(0, 1),
        layout: "media-left"
      },
      {
        eyebrow: "Helpful visuals",
        title: "Pictures and videos should make the diagnosis easier to understand at a glance.",
        paragraphs: [
          "This media section is where the office can place x-rays, tooth diagrams, short explainer videos, and annotated photos that reinforce the written explanation."
        ],
        media: galleryItems.slice(0, 2),
        layout: "full-bleed"
      }
    ],
    timeline:
      treatmentCount > 0
        ? {
            eyebrow: "Treatment direction",
            title: "What the conversation usually moves toward next",
            intro:
              "After the diagnosis is clear, the next part of the visit is usually about whether the tooth can be saved, what that takes, and what recovery would look like.",
            notes: [
              "Diagnosis pages should set up the treatment discussion without overwhelming the patient.",
              "Equal treatment options should feel balanced and easy to compare.",
              "If the tooth has a poor outlook, that should still be explained in simple language."
            ],
            steps: input.treatmentCards.slice(0, 4).map((card, index) => ({
              label: `Option ${index + 1}`,
              title: card.label,
              body: `${card.summary} ${card.visits[0] ?? ""}`.trim()
            }))
          }
        : undefined,
    gallery: {
      eyebrow: "Media gallery",
      title: "Detailed visuals for complete understanding",
      intro:
        "The best diagnosis pages do not rely on one image. They use several visuals and short video moments so the patient can understand the problem from more than one angle.",
      items: galleryItems.slice(0, 4)
    },
    faqs: {
      eyebrow: "Common questions",
      title: "Questions patients usually ask after hearing this diagnosis",
      intro: "These answers should be short, direct, and reassuring without hiding the seriousness of the problem.",
      items: buildFaqItems(input.commonQuestions, "diagnosis")
    },
    closing: {
      title: "The goal is understanding before decision-making.",
      body:
        "A strong diagnosis page should help the patient understand what is happening, why your office is concerned, and why treatment recommendations make sense.",
      note:
        "This is where future office photos, x-rays, short videos, and branded explainers will make the page feel even more premium."
    }
  };
}

function buildTreatmentCarePage(input: {
  treatment: TreatmentOption;
  title: string;
  intro: string;
  mediaAssets: Array<{ id: string; title: string; type: string; description: string; duration?: string }>;
  commonQuestions: string[];
}): CarePageContent {
  const heroMedia = input.mediaAssets[0] ?? {
    id: "hero-treatment",
    title: "Treatment hero visual",
    type: "video",
    description: "Large treatment explainer video or step-by-step overview visual.",
    duration: "2:00"
  };
  const galleryItems = input.mediaAssets.length > 0 ? input.mediaAssets : [heroMedia];

  return {
    pageKind: "Treatment Page",
    eyebrow: "Your treatment explained simply",
    title: input.title,
    intro: [
      input.intro,
      "Treatment pages should feel calm and high-end while also being extremely clear about what the procedure does, why it is recommended, and what recovery is like."
    ],
    summary: "In plain language: this page should show the patient what the treatment is, how it works, what to expect at each step, and where videos or diagrams can help them feel prepared.",
    heroMedia,
    heroNote: "This treatment page should make the procedure feel understandable instead of intimidating.",
    ribbon: [
      {
        title: "What this treatment does",
        body: input.treatment.summary
      },
      {
        title: "Visit pattern",
        body: input.treatment.visits[0] ?? "Your provider will guide you through the sequence of visits."
      },
      {
        title: "Recovery focus",
        body: input.treatment.temporaryNotes[0] ?? "Patients should know what is normal during the recovery period and when to call the office."
      }
    ],
    sections: [
      {
        eyebrow: "How the treatment works",
        title: "The patient should understand the procedure before the procedure happens.",
        paragraphs: [
          input.treatment.summary,
          "A premium treatment page should explain the steps in simple language and pair that explanation with videos, diagrams, and recovery visuals."
        ],
        bullets: input.treatment.patientBenefits,
        labels: [input.treatment.optionGroupLabel, "Explained simply", "Procedure overview"],
        media: galleryItems.slice(0, 1),
        layout: "media-right"
      },
      {
        eyebrow: "Visit-by-visit expectations",
        title: "Patients should be able to picture the treatment flow clearly.",
        paragraphs: [
          "This section should outline the sequence of visits so the patient understands what happens first, what may be temporary, and when the final outcome is expected."
        ],
        storyItems: input.treatment.visits.map((visit, index) => ({
          title: `Visit ${index + 1}`,
          body: visit
        })),
        media: galleryItems.slice(1, 2).length > 0 ? galleryItems.slice(1, 2) : galleryItems.slice(0, 1),
        layout: "media-left"
      },
      {
        eyebrow: "Recovery and tradeoffs",
        title: "Patients need simple honesty about healing, discomfort, and limitations.",
        paragraphs: [
          input.treatment.temporaryNotes.join(" "),
          input.treatment.patientTradeoffs.join(" ")
        ],
        bullets: input.treatment.patientTradeoffs,
        labels: ["Recovery", "Temporary phase", "Aftercare"],
        media: galleryItems.slice(0, 2),
        layout: "full-bleed"
      }
    ],
    timeline: {
      eyebrow: "Treatment timeline",
      title: "A step-by-step path makes the procedure easier to trust.",
      intro:
        "This is where the page should slow the patient down and show the treatment as a sequence instead of a single intimidating event.",
      notes: [
        "Each step should feel specific and easy to follow.",
        "Temporary phases should be explained clearly.",
        "The final restoration or healing milestone should feel like a destination."
      ],
      steps: input.treatment.visits.map((visit, index) => ({
        label: `Step ${index + 1}`,
        title: buildTimelineTitle(index, input.treatment.label),
        body: visit
      }))
    },
    gallery: {
      eyebrow: "Pictures and videos",
      title: "Media should do a lot of the teaching here",
      intro:
        "The ideal treatment page uses multiple visual blocks: a hero video, a procedure diagram, recovery photos, and simple handouts the patient can revisit later.",
      items: galleryItems.slice(0, 4)
    },
    faqs: {
      eyebrow: "Common questions",
      title: "Questions patients usually ask before saying yes to treatment",
      intro: "This is where we answer the practical concerns that affect confidence and follow-through.",
      items: buildFaqItems(input.commonQuestions, "treatment")
    },
    closing: {
      title: "Aesthetic and reassuring does not mean vague.",
      body:
        "The best treatment pages feel beautiful, simple, and clear while still being detailed enough that the patient understands what the office is recommending.",
      note:
        "Once we add real practice videos, x-rays, before-and-after images, and branded diagrams, these pages will feel much closer to the exact format you shared."
    }
  };
}

function buildDiagnosisStories(diagnosis: DiagnosisTemplate) {
  const sections = diagnosis.educationSections;
  return [
    {
      title: "What patients may feel",
      body:
        sections[1]?.body ??
        "Patients may notice pain, pressure, swelling, sensitivity, or changes when chewing depending on how advanced the condition is."
    },
    {
      title: "What your provider may see",
      body:
        sections[2]?.body ??
        "Providers may see structural breakdown, infection, changes on x-ray, or signs that the tooth is no longer responding normally."
    },
    {
      title: "Why early explanation matters",
      body:
        "When the condition is explained clearly with visuals, patients are more likely to understand the urgency and the reason for treatment."
    }
  ];
}

function buildLabelsFromDiagnosis(diagnosis: DiagnosisTemplate) {
  const bits = diagnosis.label
    .split(/[\s,]+/)
    .filter((part) => part.length > 4)
    .slice(0, 4);
  return bits.length > 0 ? bits : ["Diagnosis", "Patient education"];
}

function buildQuestionLabels(questions: string[]) {
  if (questions.length === 0) {
    return ["Symptoms", "Pain", "Swelling", "What next"];
  }

  return questions.slice(0, 4).map((question) => {
    const short = question.replace(/\?$/, "").split(" ").slice(0, 3).join(" ");
    return short.length > 20 ? `${short.slice(0, 17)}...` : short;
  });
}

function buildFaqItems(questions: string[], mode: "diagnosis" | "treatment"): { question: string; answer: string }[] {
  const fallback =
    mode === "diagnosis"
      ? [
          "How serious is this?",
          "Can this heal on its own?",
          "Why am I being shown treatment choices?"
        ]
      : [
          "Will this hurt?",
          "How many visits does this usually take?",
          "What is recovery like?"
        ];

  return (questions.length > 0 ? questions : fallback).slice(0, 5).map((question) => ({
    question,
    answer:
      mode === "diagnosis"
        ? "This answer should be short, plain-language, and specific enough that the patient understands the condition without feeling overwhelmed."
        : "This answer should focus on expectations, clarity, and confidence so the patient understands the procedure and what comes next."
  }));
}

function buildTimelineTitle(index: number, label: string) {
  if (index === 0) {
    return `Getting started with ${label.toLowerCase()}`;
  }
  if (index === 1) {
    return "Middle treatment phase";
  }
  return "Final healing or completion phase";
}

function toPlainLanguageSummary(summary: string) {
  return `In plain language: ${summary.charAt(0).toLowerCase()}${summary.slice(1)}`;
}
