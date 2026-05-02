"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { useAuth } from "@/components/auth-provider";
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

type ArticleSection = {
  title: string;
  paragraphs: string[];
  bulletItems?: string[];
};

const diagnosisWorkingSet = conditionCatalog.slice(0, 10);
const treatmentWorkingSet = treatmentCatalog.slice(0, 10);
const contentTabsByMode = {
  diagnosis: { primary: "Overview", secondary: "Treatment options" },
  treatment: { primary: "Overview", secondary: "Procedure details" }
} as const;

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
  const [activeTab, setActiveTab] = useState<"primary" | "secondary">("primary");
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

  const treatmentSpecificSections = useMemo<ArticleSection[]>(() => {
    if (!selectedTreatment) {
      return [];
    }

    return [
      {
        title: "How this treatment works",
        paragraphs: [selectedTreatment.summary]
      },
      {
        title: "What to expect across visits",
        paragraphs: ["Your provider will guide you through the timing and sequence of visits."],
        bulletItems: selectedTreatment.visits
      },
      {
        title: "Temporary phase and recovery",
        paragraphs: [selectedTreatment.temporaryNotes.join(" ")]
      },
      {
        title: "Why patients choose it",
        paragraphs: [selectedTreatment.patientBenefits.join(" ")]
      },
      {
        title: "Tradeoffs to understand",
        paragraphs: [selectedTreatment.patientTradeoffs.join(" ")]
      }
    ];
  }, [selectedTreatment]);

  const diagnosisArticleSections = useMemo<ArticleSection[]>(() => {
    if (!selectedDiagnosis) {
      return [];
    }

    return [
      {
        title: "Overview",
        paragraphs: [infoPageIntro.trim() || selectedDiagnosis.plainLanguageSummary]
      },
      {
        title: "What this diagnosis means",
        paragraphs: [
          selectedDiagnosis.educationSections[0]?.body ||
          "This section explains what your provider is seeing and why it matters."
        ]
      },
      {
        title: "What you may notice",
        paragraphs: [
          selectedDiagnosis.educationSections[1]?.body ||
          "Patients may notice pain, swelling, sensitivity, changes when chewing, or sometimes very few symptoms at first."
        ]
      },
      {
        title: "Why treatment may be recommended",
        paragraphs: [
          selectedDiagnosis.educationSections[2]?.body ||
          "Dental problems often do not heal on their own, and early treatment can help preserve more options."
        ],
        bulletItems: selectedDiagnosis.commonQuestions.slice(0, 3)
      }
    ];
  }, [infoPageIntro, selectedDiagnosis]);

  const treatmentArticleSections = useMemo<ArticleSection[]>(() => {
    if (!selectedTreatment) {
      return [];
    }

    return [
      {
        title: "Overview",
        paragraphs: [infoPageIntro.trim() || selectedTreatment.summary]
      },
      {
        title: "What this treatment does",
        paragraphs: [
          selectedTreatment.patientBenefits.join(" ") ||
          "This treatment is meant to solve the immediate problem while protecting the tooth and surrounding tissues."
        ]
      },
      {
        title: "Procedure details",
        paragraphs: [
          "Your provider will walk through the procedure in steps so you know what happens before, during, and after treatment."
        ],
        bulletItems: selectedTreatment.visits
      },
      {
        title: "Risks and tradeoffs",
        paragraphs: [
          selectedTreatment.patientTradeoffs.join(" ") ||
          "Every treatment has tradeoffs, and your provider will review the important ones with you."
        ]
      },
      {
        title: "Recovery and outlook",
        paragraphs: [
          selectedTreatment.temporaryNotes.join(" ") ||
          "Recovery depends on the procedure, but patients are usually given clear aftercare and follow-up instructions."
        ]
      },
      {
        title: "Why patients still choose this option",
        paragraphs: [
          selectedTreatment.patientBenefits.join(" ") ||
          "This treatment can still be the best fit when the benefits line up with the tooth condition and the patient's goals."
        ]
      }
    ];
  }, [infoPageIntro, selectedTreatment]);

  const previewSections = useMemo(() => {
    return mode === "diagnosis" ? diagnosisArticleSections : treatmentArticleSections;
  }, [
    diagnosisArticleSections,
    mode,
    treatmentArticleSections
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
          description: asset.description
        }));
    }

    return (diagnosisPreview?.mediaPlan ?? []).map((asset) => ({
      id: `diagnosis-${asset.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      title: asset.title,
      type: asset.type,
      description: asset.description
    }));
  }, [diagnosisPreview?.mediaPlan, mode, selectedTreatment?.mediaAssetIds]);

  const diagnosisTreatmentCards = diagnosisPreview?.treatmentCards ?? [];
  const contents = useMemo(
    () =>
      mode === "diagnosis"
        ? ["Overview", "What this diagnosis means", "What you may notice", "Why treatment may be recommended", "Treatment options", "Common questions"]
        : ["Overview", "What this treatment does", "Procedure details", "Risks and tradeoffs", "Recovery and outlook", "Common questions"],
    [mode]
  );
  const commonQuestions =
    mode === "diagnosis"
      ? selectedDiagnosis?.commonQuestions ?? []
      : selectedDiagnosisForTreatment?.commonQuestions ?? [];

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
    setActiveTab("primary");
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
  const previewFacts =
    mode === "diagnosis"
      ? [
          `${diagnosisTreatmentCards.length || getTreatmentsForDiagnosis(selectedDiagnosis?.id ?? "").length} treatment paths`,
          `${mediaAssets.length} visual asset${mediaAssets.length === 1 ? "" : "s"}`,
          `${commonQuestions.length || 3} patient questions addressed`
        ]
      : [
          selectedTreatment?.optionGroupLabel || "Treatment guidance",
          `${mediaAssets.length} visual asset${mediaAssets.length === 1 ? "" : "s"}`,
          `${selectedTreatment?.visits.length ?? 0} visit milestone${selectedTreatment?.visits.length === 1 ? "" : "s"}`
        ];

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
                <section className="care-page-hero">
                  <div className="care-page-hero-copy diagnosis-detail-header treatment-preview-header">
                    <p className="eyebrow">{capitalize(mode)}</p>
                    <h1>{previewTitle}</h1>
                    <div className="treatment-page-meta">
                      <span>Medically reviewed.</span>
                      <span>Last updated on {reviewDate}.</span>
                    </div>
                    <p className="diagnosis-subtitle">{previewSubtitle}</p>
                    <p className="diagnosis-descriptor">{previewDescriptor}</p>
                  </div>

                  <aside className="care-page-hero-aside">
                    <p className="mini-label">Quick profile</p>
                    <h3>What the patient sees first</h3>
                    <div className="care-page-fact-list">
                      {previewFacts.map((fact) => (
                        <span className="care-page-fact-pill" key={fact}>
                          {fact}
                        </span>
                      ))}
                    </div>
                    <p className="care-page-hero-note">
                      This layout is designed to feel calm, polished, and easy to trust while still guiding treatment decisions.
                    </p>
                  </aside>
                </section>

                <article className="saved-section-card treatment-contents-card care-page-contents-card">
                  <div className="saved-section-header care-page-section-heading">
                    <div>
                      <p className="mini-label">Contents</p>
                      <h3>{mode === "diagnosis" ? "On this diagnosis page" : "On this treatment page"}</h3>
                    </div>
                  </div>
                  <div className="treatment-contents-list">
                    {contents.map((item) => (
                      <span className="treatment-content-pill" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                </article>

                <div className="tab-row">
                  <button
                    className={`tab-button ${activeTab === "primary" ? "active" : ""}`}
                    onClick={() => setActiveTab("primary")}
                    type="button"
                  >
                    {contentTabsByMode[mode].primary}
                  </button>
                  <button
                    className={`tab-button ${activeTab === "secondary" ? "active" : ""}`}
                    onClick={() => setActiveTab("secondary")}
                    type="button"
                  >
                    {contentTabsByMode[mode].secondary}
                  </button>
                </div>

                {activeTab === "primary" ? (
                  <div className="dialogue-list care-page-section-stack">
                    <ArticleSections sections={previewSections} />
                  </div>
                ) : (
                  <div className="article-flow care-page-section-stack">
                    {mode === "diagnosis"
                      ? diagnosisTreatmentCards.map((option) => (
                          <section className="article-section-block care-page-treatment-block" key={option.label}>
                            <h2>{option.label}</h2>
                            <p>{option.summary}</p>
                            <h3>What the visit pattern usually looks like</h3>
                            <ul className="article-bullets">
                              {option.visits.map((visit) => (
                                <li key={visit}>{visit}</li>
                              ))}
                            </ul>
                            <h3>Temporary phase and recovery</h3>
                            <ul className="article-bullets">
                              {option.temporaryNotes.map((note) => (
                                <li key={note}>{note}</li>
                              ))}
                            </ul>
                          </section>
                        ))
                      : <ArticleSections sections={treatmentSpecificSections.slice(2)} />}
                  </div>
                )}

                <section className="article-section-block care-page-feature-band">
                  <h2>Media and diagrams</h2>
                  <p>
                    These visuals are included to help the patient understand the diagnosis or treatment without relying only on technical language.
                  </p>
                  <div className="article-media-list">
                    {mediaAssets.map((asset) => (
                      <article className="article-media-item care-page-feature-card" key={asset.id}>
                        <p className="mini-label">{asset.type}</p>
                        <h3>{asset.title}</h3>
                        <p>{asset.description}</p>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="article-section-block care-page-feature-band">
                  <h2>Additional common questions</h2>
                  {commonQuestions.length > 0 ? (
                    <div className="article-faq-list">
                      {commonQuestions.map((question, index) => (
                        <div className="care-page-feature-card" key={question}>
                          <p className="mini-label">Question {index + 1}</p>
                          <h3>{question}</h3>
                          <p>
                            This section gives the patient a direct answer in plain language so they can understand the topic without needing to search elsewhere.
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>
                      Your provider will explain timing, recovery, and whether anything else needs to happen before or after this step.
                    </p>
                  )}
                </section>
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

function ArticleSections({ sections }: { sections: ArticleSection[] }) {
  return (
    <div className="article-flow">
      {sections.map((section) => (
        <section className="article-section-block care-page-article-card" key={section.title}>
          <h2>{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {section.bulletItems && section.bulletItems.length > 0 ? (
            <ul className="article-bullets">
              {section.bulletItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  );
}
