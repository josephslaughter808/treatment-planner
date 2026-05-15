"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
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

type PersistedDesignConfig = {
  pageContent?: CarePageContent;
};

const diagnosisWorkingSet = conditionCatalog;
const treatmentWorkingSet = treatmentCatalog;

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

  const contentId = selectedId;
  const staticOverride = contentId ? getPracticeOverride(practiceId, contentId, mode) : undefined;
  const [preferredMediaAssetIds, setPreferredMediaAssetIds] = useState<string[]>([]);
  const [generalAssetIds, setGeneralAssetIds] = useState<string[]>([]);
  const [pageDraft, setPageDraft] = useState<CarePageContent | null>(null);
  const [consentIntro, setConsentIntro] = useState("");
  const [isLoadingOverride, setIsLoadingOverride] = useState(false);

  const diagnosisRelatedTreatments = useMemo(
    () => (selectedDiagnosis ? getTreatmentsForDiagnosis(selectedDiagnosis.id) : []),
    [selectedDiagnosis]
  );

  const baseMediaAssetIds = useMemo(() => {
    if (mode === "treatment") {
      return selectedTreatment?.mediaAssetIds ?? [];
    }

    return [
      ...(selectedDiagnosis?.mediaAssetIds ?? []),
      ...diagnosisRelatedTreatments.flatMap((treatment) => treatment.mediaAssetIds)
    ];
  }, [diagnosisRelatedTreatments, mode, selectedDiagnosis?.mediaAssetIds, selectedTreatment?.mediaAssetIds]);

  const itemMediaAssets = useMemo(
    () =>
      [...new Set(baseMediaAssetIds)]
        .map((id) => mediaById[id])
        .filter(Boolean)
        .map((asset) => ({
          id: asset.id,
          title: asset.title,
          type: asset.type,
          description: asset.description,
          duration: asset.duration
        })),
    [baseMediaAssetIds]
  );

  const mediaAssets = useMemo(() => {
    const mediaIds = new Set<string>([...baseMediaAssetIds, ...preferredMediaAssetIds, ...generalAssetIds]);

    return [...mediaIds]
      .map((id) => mediaById[id])
      .filter(Boolean)
      .map((asset) => ({
        id: asset.id,
        title: asset.title,
        type: asset.type,
        description: asset.description,
        duration: asset.duration
      }));
  }, [baseMediaAssetIds, generalAssetIds, preferredMediaAssetIds]);

  const diagnosisTreatmentCards = useMemo(() => diagnosisRelatedTreatments, [diagnosisRelatedTreatments]);
  const commonQuestions = useMemo(
    () =>
      mode === "diagnosis"
        ? selectedDiagnosis?.commonQuestions ?? []
        : selectedDiagnosisForTreatment?.commonQuestions ?? [],
    [mode, selectedDiagnosis?.commonQuestions, selectedDiagnosisForTreatment?.commonQuestions]
  );

  const listItems = mode === "diagnosis" ? diagnosisItems : treatmentItems;

  function togglePreferredMedia(mediaId: string) {
    setPreferredMediaAssetIds((current) => {
      const next = current.includes(mediaId) ? current.filter((id) => id !== mediaId) : [...current, mediaId];
      updateDraft((draft) => syncPageMedia(draft, resolveMediaPanels([...baseMediaAssetIds, ...next, ...generalAssetIds])));
      return next;
    });
  }

  function toggleGeneralMedia(mediaId: string) {
    setGeneralAssetIds((current) => {
      const next = current.includes(mediaId) ? current.filter((id) => id !== mediaId) : [...current, mediaId];
      updateDraft((draft) =>
        syncPageMedia(draft, resolveMediaPanels([...baseMediaAssetIds, ...preferredMediaAssetIds, ...next]))
      );
      return next;
    });
  }

  const basePageContent = useMemo<CarePageContent | null>(() => {
    if (mode === "diagnosis") {
      if (!selectedDiagnosis) {
        return null;
      }

      return buildDiagnosisCarePage({
        diagnosis: selectedDiagnosis,
        title: selectedDiagnosis.label,
        intro: selectedDiagnosis.plainLanguageSummary,
        commonQuestions,
        mediaAssets: itemMediaAssets,
        treatmentCards: diagnosisTreatmentCards
      });
    }

    if (!selectedTreatment) {
      return null;
    }

    return buildTreatmentCarePage({
      treatment: selectedTreatment,
      title: selectedTreatment.label,
      intro: selectedTreatment.summary,
      mediaAssets: itemMediaAssets,
      commonQuestions
    });
  }, [
    commonQuestions,
    diagnosisTreatmentCards,
    itemMediaAssets,
    mode,
    selectedDiagnosis,
    selectedTreatment
  ]);

  useEffect(() => {
    if (!contentId || !basePageContent) {
      return;
    }

    const resolvedBasePageContent = basePageContent;

    let cancelled = false;

    async function loadOverride() {
      setIsLoadingOverride(true);
      setMessage(null);

      const applyOverride = (override?: {
        infoPageTitle: string;
        infoPageIntro: string;
        consentIntro: string;
        preferredMediaAssetIds: string[];
        generalAssetIds?: string[];
        designConfig?: Record<string, unknown>;
      } | null) => {
        const config = (override?.designConfig ?? {}) as PersistedDesignConfig;
        const nextDraft = config.pageContent
          ? mergePageContent(resolvedBasePageContent, config.pageContent)
          : applyLegacyOverride(resolvedBasePageContent, override);
        const nextPreferredMedia = override?.preferredMediaAssetIds ?? [];
        const nextGeneralMedia = override?.generalAssetIds ?? [];
        const draftWithMedia = syncPageMedia(
          nextDraft,
          resolveMediaPanels([...baseMediaAssetIds, ...nextPreferredMedia, ...nextGeneralMedia])
        );

        if (cancelled) {
          return;
        }

        setPageDraft(draftWithMedia);
        setConsentIntro(override?.consentIntro ?? "");
        setPreferredMediaAssetIds(nextPreferredMedia);
        setGeneralAssetIds(nextGeneralMedia);
        setIsLoadingOverride(false);
      };

      applyOverride(staticOverride);

      try {
        const response = await fetch(
          `/api/practice-overrides?practiceId=${encodeURIComponent(practiceId)}&contentId=${encodeURIComponent(contentId)}&contentType=${mode}`
        );
        const data = (await response.json()) as {
          override?: {
            infoPageTitle: string;
            infoPageIntro: string;
            consentIntro: string;
            preferredMediaAssetIds: string[];
            generalAssetIds?: string[];
            designConfig?: Record<string, unknown>;
          } | null;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error || `Unable to load the saved ${mode} page.`);
        }

        applyOverride(data.override);
      } catch (error) {
        if (!cancelled) {
          setIsLoadingOverride(false);
          if (!staticOverride) {
            setMessage(error instanceof Error ? error.message : `Unable to load the ${mode} page.`);
          }
        }
      }
    }

    loadOverride();

    return () => {
      cancelled = true;
    };
  }, [baseMediaAssetIds, basePageContent, contentId, mode, practiceId, staticOverride]);

  function selectItem(nextId: string) {
    setSelectedId(nextId);
    setIsEditing(false);
    setMessage(null);
    setEditorTab("item-assets");
  }

  async function handleSave() {
    if (!contentId || !pageDraft || !pageDraft.title.trim() || pageDraft.intro.length === 0) {
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
          contentId,
          contentType: mode,
          infoPageTitle: pageDraft.title,
          infoPageIntro: pageDraft.intro[0] ?? "",
          consentIntro,
          preferredMediaAssetIds,
          generalAssetIds,
          designConfig: {
            pageContent: pageDraft
          }
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
    pageDraft?.title || (mode === "diagnosis" ? selectedDiagnosis?.label : selectedTreatment?.label) || "Patient page";

  const previewSubtitle =
    mode === "diagnosis"
      ? buildCommonName(selectedDiagnosis?.label ?? "")
      : selectedTreatment?.optionGroupLabel || "Treatment explanation";

  const reviewDate = "07/03/2025";
  const pageContent = pageDraft;

  function updateDraft(updater: (current: CarePageContent) => CarePageContent) {
    setPageDraft((current) => (current ? updater(current) : current));
  }

  function updateSection(
    index: number,
    updater: (section: CarePageContent["sections"][number]) => CarePageContent["sections"][number]
  ) {
    updateDraft((current) => ({
      ...current,
      sections: current.sections.map((section, sectionIndex) =>
        sectionIndex === index ? updater(section) : section
      )
    }));
  }

  function updateFaq(index: number, field: "question" | "answer", value: string) {
    updateDraft((current) => ({
      ...current,
      faqs: {
        ...current.faqs,
        items: current.faqs.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
      }
    }));
  }

  function updateTimelineStep(index: number, field: "label" | "title" | "body", value: string) {
    updateDraft((current) =>
      current.timeline
        ? {
            ...current,
            timeline: {
              ...current.timeline,
              steps: current.timeline.steps.map((step, stepIndex) =>
                stepIndex === index ? { ...step, [field]: value } : step
              )
            }
          }
        : current
    );
  }

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
                    <p>Edit the patient page directly. Every change updates the live preview on the left.</p>
                  </div>

                  {pageDraft ? (
                    <div className="treatment-edit-stack">
                      <label>
                        Page title
                        <input
                          onChange={(event) => updateDraft((current) => ({ ...current, title: event.target.value }))}
                          placeholder={`Office-specific ${mode} page title`}
                          value={pageDraft.title}
                        />
                      </label>

                      <label>
                        Header line
                        <input
                          onChange={(event) => updateDraft((current) => ({ ...current, eyebrow: event.target.value }))}
                          value={pageDraft.eyebrow}
                        />
                      </label>

                      <label>
                        Opening paragraphs
                        <textarea
                          onChange={(event) =>
                            updateDraft((current) => ({
                              ...current,
                              intro: splitParagraphs(event.target.value)
                            }))
                          }
                          rows={7}
                          value={joinParagraphs(pageDraft.intro)}
                        />
                      </label>

                      <label>
                        Summary box
                        <textarea
                          onChange={(event) => updateDraft((current) => ({ ...current, summary: event.target.value }))}
                          rows={3}
                          value={pageDraft.summary ?? ""}
                        />
                      </label>

                      <label>
                        Why this matters note
                        <textarea
                          onChange={(event) => updateDraft((current) => ({ ...current, heroNote: event.target.value }))}
                          rows={3}
                          value={pageDraft.heroNote}
                        />
                      </label>

                      <label>
                        Consent/supporting intro
                        <textarea
                          onChange={(event) => setConsentIntro(event.target.value)}
                          placeholder="Use this for office-specific instructions or consent framing."
                          rows={4}
                          value={consentIntro}
                        />
                      </label>

                      <div className="section-intro">
                        <h3>Ribbon cards</h3>
                      </div>

                      {pageDraft.ribbon.map((item, index) => (
                        <div className="saved-entry-card" key={`${item.title}-${index}`}>
                          <label>
                            Card title
                            <input
                              onChange={(event) =>
                                updateDraft((current) => ({
                                  ...current,
                                  ribbon: current.ribbon.map((entry, entryIndex) =>
                                    entryIndex === index ? { ...entry, title: event.target.value } : entry
                                  )
                                }))
                              }
                              value={item.title}
                            />
                          </label>
                          <label>
                            Card body
                            <textarea
                              onChange={(event) =>
                                updateDraft((current) => ({
                                  ...current,
                                  ribbon: current.ribbon.map((entry, entryIndex) =>
                                    entryIndex === index ? { ...entry, body: event.target.value } : entry
                                  )
                                }))
                              }
                              rows={3}
                              value={item.body}
                            />
                          </label>
                        </div>
                      ))}

                      <div className="section-intro">
                        <h3>Story sections</h3>
                      </div>

                      {pageDraft.sections.map((section, index) => (
                        <div className="saved-entry-card" key={`${section.title}-${index}`}>
                          <p className="saved-entry-subtitle">Section {index + 1}</p>
                          <label>
                            Eyebrow
                            <input
                              onChange={(event) => updateSection(index, (current) => ({ ...current, eyebrow: event.target.value }))}
                              value={section.eyebrow}
                            />
                          </label>
                          <label>
                            Heading
                            <input
                              onChange={(event) => updateSection(index, (current) => ({ ...current, title: event.target.value }))}
                              value={section.title}
                            />
                          </label>
                          <label>
                            Paragraphs
                            <textarea
                              onChange={(event) =>
                                updateSection(index, (current) => ({
                                  ...current,
                                  paragraphs: splitParagraphs(event.target.value)
                                }))
                              }
                              rows={6}
                              value={joinParagraphs(section.paragraphs)}
                            />
                          </label>
                          <label>
                            Bullet points
                            <textarea
                              onChange={(event) =>
                                updateSection(index, (current) => ({
                                  ...current,
                                  bullets: splitLines(event.target.value)
                                }))
                              }
                              rows={4}
                              value={joinLines(section.bullets ?? [])}
                            />
                          </label>
                          <label>
                            Highlight labels
                            <textarea
                              onChange={(event) =>
                                updateSection(index, (current) => ({
                                  ...current,
                                  labels: splitLines(event.target.value)
                                }))
                              }
                              rows={3}
                              value={joinLines(section.labels ?? [])}
                            />
                          </label>
                          {section.storyItems ? (
                            <label>
                              Story cards
                              <textarea
                                onChange={(event) =>
                                  updateSection(index, (current) => ({
                                    ...current,
                                    storyItems: splitStoryItems(event.target.value)
                                  }))
                                }
                                rows={6}
                                value={joinStoryItems(section.storyItems)}
                              />
                            </label>
                          ) : null}
                        </div>
                      ))}

                      {pageDraft.timeline ? (
                        <>
                          <div className="section-intro">
                            <h3>Timeline</h3>
                          </div>

                          <label>
                            Timeline intro
                            <textarea
                              onChange={(event) =>
                                updateDraft((current) =>
                                  current.timeline
                                    ? {
                                        ...current,
                                        timeline: { ...current.timeline, intro: event.target.value }
                                      }
                                    : current
                                )
                              }
                              rows={4}
                              value={pageDraft.timeline.intro}
                            />
                          </label>

                          <label>
                            Timeline notes
                            <textarea
                              onChange={(event) =>
                                updateDraft((current) =>
                                  current.timeline
                                    ? {
                                        ...current,
                                        timeline: { ...current.timeline, notes: splitLines(event.target.value) }
                                      }
                                    : current
                                )
                              }
                              rows={5}
                              value={joinLines(pageDraft.timeline.notes)}
                            />
                          </label>

                          {pageDraft.timeline.steps.map((step, index) => (
                            <div className="saved-entry-card" key={`${step.title}-${index}`}>
                              <p className="saved-entry-subtitle">Step {index + 1}</p>
                              <label>
                                Step label
                                <input
                                  onChange={(event) => updateTimelineStep(index, "label", event.target.value)}
                                  value={step.label}
                                />
                              </label>
                              <label>
                                Step title
                                <input
                                  onChange={(event) => updateTimelineStep(index, "title", event.target.value)}
                                  value={step.title}
                                />
                              </label>
                              <label>
                                Step description
                                <textarea
                                  onChange={(event) => updateTimelineStep(index, "body", event.target.value)}
                                  rows={3}
                                  value={step.body}
                                />
                              </label>
                            </div>
                          ))}
                        </>
                      ) : null}

                      <div className="section-intro">
                        <h3>Questions and answers</h3>
                      </div>

                      {pageDraft.faqs.items.map((item, index) => (
                        <div className="saved-entry-card" key={`${item.question}-${index}`}>
                          <label>
                            Question
                            <input onChange={(event) => updateFaq(index, "question", event.target.value)} value={item.question} />
                          </label>
                          <label>
                            Answer
                            <textarea
                              onChange={(event) => updateFaq(index, "answer", event.target.value)}
                              rows={4}
                              value={item.answer}
                            />
                          </label>
                        </div>
                      ))}

                      <div className="section-intro">
                        <h3>Closing section</h3>
                      </div>

                      <label>
                        Closing title
                        <input
                          onChange={(event) =>
                            updateDraft((current) => ({
                              ...current,
                              closing: { ...current.closing, title: event.target.value }
                            }))
                          }
                          value={pageDraft.closing.title}
                        />
                      </label>

                      <label>
                        Closing body
                        <textarea
                          onChange={(event) =>
                            updateDraft((current) => ({
                              ...current,
                              closing: { ...current.closing, body: event.target.value }
                            }))
                          }
                          rows={4}
                          value={pageDraft.closing.body}
                        />
                      </label>

                      <label>
                        Closing note
                        <textarea
                          onChange={(event) =>
                            updateDraft((current) => ({
                              ...current,
                              closing: { ...current.closing, note: event.target.value }
                            }))
                          }
                          rows={3}
                          value={pageDraft.closing.note}
                        />
                      </label>

                      <div className="section-intro">
                        <h3>Style controls</h3>
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
                        {(editorTab === "item-assets" ? itemMediaAssets : generalAssetCatalog).map((asset) => {
                          const checked =
                            editorTab === "item-assets"
                              ? preferredMediaAssetIds.includes(asset.id)
                              : generalAssetIds.includes(asset.id);
                          return (
                            <article className="saved-entry-card" key={asset.id}>
                              <p className="saved-entry-subtitle">{asset.type}</p>
                              <strong>{asset.title}</strong>
                              <p>{asset.description}</p>
                              <button
                                className={checked ? "secondary-button" : "primary-button"}
                                onClick={() =>
                                  editorTab === "item-assets"
                                    ? togglePreferredMedia(asset.id)
                                    : toggleGeneralMedia(asset.id)
                                }
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
                          {isSaving ? `Saving ${mode} page copy...` : `Save practice copy`}
                        </button>
                        <p>This saves a practice-specific copy and makes it the default page for this content at your office.</p>
                      </div>
                    </div>
                  ) : (
                    <p className="info-text">{isLoadingOverride ? "Loading saved page content..." : "Select a page to begin editing."}</p>
                  )}
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

function splitParagraphs(value: string) {
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function joinParagraphs(values: string[]) {
  return values.join("\n\n");
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function joinLines(values: string[]) {
  return values.join("\n");
}

function splitStoryItems(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [title, ...bodyParts] = line.split(" | ");
      return {
        title: title?.trim() || `Story ${index + 1}`,
        body: bodyParts.join(" | ").trim() || title.trim()
      };
    });
}

function joinStoryItems(values: Array<{ title: string; body: string }>) {
  return values.map((item) => `${item.title} | ${item.body}`).join("\n");
}

function resolveMediaPanels(ids: string[]) {
  return [...new Set(ids)]
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

function syncPageMedia(
  page: CarePageContent,
  media: Array<{ id: string; title: string; type: string; description: string; duration?: string }>
) {
  if (media.length === 0) {
    return page;
  }

  return {
    ...page,
    heroMedia: media[0],
    sections: page.sections.map((section, index) => ({
      ...section,
      media:
        index === 0
          ? media.slice(0, 1)
          : index === 1
            ? media.slice(1, 2).length > 0
              ? media.slice(1, 2)
              : media.slice(0, 1)
            : media.slice(0, 2)
    })),
    gallery: page.gallery
      ? {
          ...page.gallery,
          items: media.slice(0, 4)
        }
      : page.gallery
  };
}

function applyLegacyOverride(
  baseContent: CarePageContent,
  override?: {
    infoPageTitle: string;
    infoPageIntro: string;
  } | null
) {
  if (!override) {
    return baseContent;
  }

  return {
    ...baseContent,
    title: override.infoPageTitle || baseContent.title,
    intro:
      override.infoPageIntro && override.infoPageIntro.trim().length > 0
        ? [override.infoPageIntro, ...baseContent.intro.slice(1)]
        : baseContent.intro
  };
}

function mergePageContent(baseContent: CarePageContent, overrideContent: CarePageContent) {
  return {
    ...baseContent,
    ...overrideContent,
    heroMedia: overrideContent.heroMedia ?? baseContent.heroMedia,
    intro: overrideContent.intro?.length ? overrideContent.intro : baseContent.intro,
    ribbon: overrideContent.ribbon?.length ? overrideContent.ribbon : baseContent.ribbon,
    sections: overrideContent.sections?.length ? overrideContent.sections : baseContent.sections,
    timeline: overrideContent.timeline ?? baseContent.timeline,
    gallery: overrideContent.gallery ?? baseContent.gallery,
    faqs: overrideContent.faqs?.items?.length ? overrideContent.faqs : baseContent.faqs,
    closing: overrideContent.closing ?? baseContent.closing
  };
}

function buildDiagnosisCarePage(input: {
  diagnosis: DiagnosisTemplate;
  title: string;
  intro: string;
  commonQuestions: string[];
  mediaAssets: Array<{ id: string; title: string; type: string; description: string; duration?: string }>;
  treatmentCards: TreatmentOption[];
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
      "This page explains what your provider found, why it matters, and what the next steps may look like."
    ],
    summary: toPlainLanguageSummary(input.diagnosis.plainLanguageSummary),
    heroMedia,
    heroNote: "Understanding the diagnosis first makes the treatment conversation much easier to follow.",
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
        title: "Here is what this diagnosis means for your tooth and surrounding tissues.",
        paragraphs: [
          education[0]?.body ?? input.diagnosis.plainLanguageSummary,
          education[2]?.body ??
            `${input.diagnosis.label} can affect comfort, chewing, and long-term tooth health in different ways depending on how early or advanced the problem is.`
        ],
        bullets: education.map((item) => item.body).slice(0, 4),
        labels: buildLabelsFromDiagnosis(input.diagnosis),
        media: galleryItems.slice(0, 1),
        layout: "media-right"
      },
      {
        eyebrow: "Symptoms and signs",
        title: "You may notice a lot of symptoms, or almost none at all.",
        paragraphs: [
          `Some people with ${input.diagnosis.label.toLowerCase()} notice symptoms right away, while others do not realize how much the condition has progressed until it is pointed out on an exam or x-ray.`
        ],
        storyItems: buildDiagnosisStories(input.diagnosis),
        labels: buildQuestionLabels(input.commonQuestions),
        media: galleryItems.slice(1, 2).length > 0 ? galleryItems.slice(1, 2) : galleryItems.slice(0, 1),
        layout: "media-left"
      },
      {
        eyebrow: "Helpful visuals",
        title: "These visuals show where the problem is and why your provider is concerned.",
        paragraphs: [
          `These visuals are meant to show you where ${input.diagnosis.label.toLowerCase()} is happening, what structures are involved, and why your provider is concerned.`
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
              "Once the diagnosis is clear, the next step is usually deciding whether the tooth can be saved, what treatment would involve, and what recovery may look like.",
            notes: [
              `Some treatment options are more conservative, while others are recommended when ${input.diagnosis.label.toLowerCase()} has progressed further.`,
              "Your provider may compare more than one option if there is more than one reasonable path forward.",
              "If the outlook for the tooth or tissue is limited, that should still be explained clearly and honestly."
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
        "Use these visuals to understand the problem from more than one angle.",
      items: galleryItems.slice(0, 4)
    },
    faqs: {
      eyebrow: "Common questions",
      title: "Questions patients usually ask after hearing this diagnosis",
      intro: "These answers are here to help you understand the diagnosis clearly and calmly.",
      items: buildFaqItems(input.commonQuestions, "diagnosis", {
        diagnosisLabel: input.diagnosis.label,
        summary: input.diagnosis.plainLanguageSummary,
        treatmentLabels: input.treatmentCards.map((card) => card.label)
      })
    },
    closing: {
      title: "The goal is to help you understand the diagnosis before making a decision.",
      body:
        "Before choosing treatment, it helps to understand what is happening, why it matters, and how the recommendations fit the condition.",
      note: "If anything still feels unclear, your provider can walk through the images and treatment choices with you."
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
      "This page explains what the treatment does, why it may be recommended, and what you can expect during recovery."
    ],
    summary: "In plain language: this page explains what the treatment is, how it works, and what to expect at each step.",
    heroMedia,
    heroNote: "The goal is to make the procedure feel understandable instead of overwhelming.",
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
        title: "Here is what this treatment is designed to do.",
        paragraphs: [
          input.treatment.summary,
          `Knowing what ${input.treatment.label.toLowerCase()} is meant to do can make the treatment feel much more manageable and much less intimidating.`
        ],
        bullets: input.treatment.patientBenefits,
        labels: [input.treatment.optionGroupLabel, "Explained simply", "Procedure overview"],
        media: galleryItems.slice(0, 1),
        layout: "media-right"
      },
      {
        eyebrow: "Visit-by-visit expectations",
        title: "Here is what the treatment flow usually looks like.",
        paragraphs: [
          `This section outlines the sequence of visits so you know what happens first, what may be temporary, and when your provider expects the final result or healing phase to be reached.`
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
        title: "Here is what to know about healing, discomfort, and limitations.",
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
      title: "A step-by-step view can make the treatment feel much easier to understand.",
      intro: "Seeing the treatment as a sequence often makes it feel less intimidating and easier to understand.",
      notes: [
        "Each step should feel clear and easy to follow.",
        "Temporary phases are included here so they do not come as a surprise.",
        "The final healing or restoration step is the point the treatment is working toward."
      ],
      steps: input.treatment.visits.map((visit, index) => ({
        label: `Step ${index + 1}`,
        title: buildTimelineTitle(index, input.treatment.label),
        body: visit
      }))
    },
    gallery: {
      eyebrow: "Pictures and videos",
      title: "These visuals can help you picture the treatment more clearly.",
      intro: "These visuals make it easier to picture the treatment before and after your visit.",
      items: galleryItems.slice(0, 4)
    },
    faqs: {
      eyebrow: "Common questions",
      title: "Questions patients usually ask before saying yes to treatment",
      intro: "These answers cover the practical concerns most patients want to understand first.",
      items: buildFaqItems(input.commonQuestions, "treatment", {
        treatmentLabel: input.treatment.label,
        summary: input.treatment.summary,
        visitCount: input.treatment.visits.length,
        temporaryNotes: input.treatment.temporaryNotes,
        benefits: input.treatment.patientBenefits,
        tradeoffs: input.treatment.patientTradeoffs
      })
    },
    closing: {
      title: "You deserve a treatment explanation that is clear, calm, and specific.",
      body:
        "A good treatment page should feel simple and reassuring while still giving you enough detail to understand what is being recommended.",
      note:
        "If you have questions about timing, recovery, or alternatives, your provider can review them with you."
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
        "When the condition is explained clearly, it becomes easier to understand why treatment may be recommended."
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

function buildFaqItems(
  questions: string[],
  mode: "diagnosis" | "treatment",
  context:
    | {
        diagnosisLabel: string;
        summary: string;
        treatmentLabels: string[];
      }
    | {
        treatmentLabel: string;
        summary: string;
        visitCount: number;
        temporaryNotes: string[];
        benefits: string[];
        tradeoffs: string[];
      }
): { question: string; answer: string }[] {
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
        ? answerDiagnosisQuestion(question, context as {
            diagnosisLabel: string;
            summary: string;
            treatmentLabels: string[];
          })
        : answerTreatmentQuestion(question, context as {
            treatmentLabel: string;
            summary: string;
            visitCount: number;
            temporaryNotes: string[];
            benefits: string[];
            tradeoffs: string[];
          })
  }));
}

function answerDiagnosisQuestion(
  question: string,
  context: { diagnosisLabel: string; summary: string; treatmentLabels: string[] }
) {
  const q = question.toLowerCase();
  const diagnosis = context.diagnosisLabel.toLowerCase();

  if (q.includes("serious")) {
    return `${context.diagnosisLabel} can range from a manageable problem to something that becomes more urgent over time. The level of concern depends on how far it has progressed, what symptoms you have, and what your provider sees on the exam and x-rays.`;
  }
  if (q.includes("heal on its own") || q.includes("watch")) {
    return `Some early conditions can be watched for a short time, but many do not fully reverse on their own. Your provider will recommend monitoring only when it is reasonable and safe to do that.`;
  }
  if (q.includes("wait")) {
    return `Waiting can allow ${diagnosis} to worsen, which may mean more discomfort and fewer conservative treatment choices later. If your provider is concerned about delay, that usually means the condition is likely to keep progressing.`;
  }
  if (q.includes("why am i being shown treatment choices") || q.includes("what comes next")) {
    return context.treatmentLabels.length > 0
      ? `You are being shown treatment choices because there may be more than one reasonable way to manage ${diagnosis}. Your provider will explain why certain options fit better depending on the health of the tooth, gum, bone, or surrounding tissues.`
      : `The next step depends on how advanced ${diagnosis} is and whether the goal is observation, repair, infection control, or replacement.`;
  }
  if (q.includes("caused")) {
    return `${context.diagnosisLabel} usually develops over time rather than from one single moment. Habits, anatomy, hygiene, bite forces, prior treatment, and overall oral health can all play a role.`;
  }
  return `${context.summary} Your provider will relate that explanation to your symptoms, your x-rays, and whether treatment is needed now or can be safely monitored.`;
}

function answerTreatmentQuestion(
  question: string,
  context: {
    treatmentLabel: string;
    summary: string;
    visitCount: number;
    temporaryNotes: string[];
    benefits: string[];
    tradeoffs: string[];
  }
) {
  const q = question.toLowerCase();
  const treatment = context.treatmentLabel.toLowerCase();

  if (q.includes("hurt") || q.includes("pain")) {
    return `Most patients want to know how uncomfortable ${treatment} will be. Your provider will explain what is done to keep you comfortable during treatment and what soreness or sensitivity may be normal afterward.`;
  }
  if (q.includes("how many visits") || q.includes("how long")) {
    return context.visitCount > 1
      ? `${context.treatmentLabel} is often done over about ${context.visitCount} phases or visits, although the exact sequence can vary based on your condition and healing response.`
      : `${context.treatmentLabel} is often completed in a single main visit, with follow-up only if your provider wants to check healing or fine-tune the result.`;
  }
  if (q.includes("recovery")) {
    return context.temporaryNotes[0]
      ? `Recovery depends on the type of treatment, but one common part of the recovery phase is this: ${context.temporaryNotes[0]}`
      : `Recovery depends on the procedure, but your provider will explain what is normal afterward, how to protect the area, and when to call the office.`;
  }
  if (q.includes("benefit") || q.includes("why")) {
    return context.benefits[0]
      ? `One of the main reasons this treatment is recommended is that it can ${lowercaseFirst(context.benefits[0])}`
      : `${context.summary} Your provider is recommending it because they believe it addresses the current problem in a predictable way.`;
  }
  if (q.includes("risk") || q.includes("tradeoff")) {
    return context.tradeoffs[0]
      ? `Every treatment has tradeoffs. One important thing to understand about ${treatment} is that ${lowercaseFirst(context.tradeoffs[0])}`
      : `Every treatment has tradeoffs, and your provider will explain the ones that matter most for your specific situation.`;
  }
  return `${context.summary} Your provider will also explain how this fits your condition, what the likely benefits are, and what the next step would be after treatment.`;
}

function lowercaseFirst(value: string) {
  return value.charAt(0).toLowerCase() + value.slice(1);
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
