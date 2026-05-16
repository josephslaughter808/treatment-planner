"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import clearPathLogo from "@/ClearPath-Care-logo.png";
import { useAuth } from "@/components/auth-provider";
import {
  catalogStats,
  conditionCatalog,
  getPracticeOverride,
  getProvidersForPractice,
  getTreatmentsForDiagnosis,
  practiceCatalog,
  conditionsById
} from "@/lib/clinical-catalog";
import type { AnalysisResponse, IntakePayload } from "@/lib/mock-analysis";
import {
  patientPreviewStorageKey,
  type StoredImagingAsset,
  type StoredPatientPreview
} from "@/lib/package-preview";
import { upsertTimelineEvent } from "@/lib/patient-vault";
import { adultTeeth } from "@/lib/teeth";

const defaultPracticeId = practiceCatalog[0]?.id ?? "";
const defaultProviders = getProvidersForPractice(defaultPracticeId);

export function IntakeExperience() {
  const { currentUser } = useAuth();
  const [payload, setPayload] = useState<IntakePayload>(() => createInitialPayload(currentUser));
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSavingCase, setIsSavingCase] = useState(false);

  const diagnosisOptions = useMemo(
    () => getTreatmentsForDiagnosis(payload.diagnosisId),
    [payload.diagnosisId]
  );
  const practiceProviders = useMemo(
    () => getProvidersForPractice(payload.practiceId),
    [payload.practiceId]
  );
  const selectedOverride = getPracticeOverride(payload.practiceId, payload.diagnosisId);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = buildCaseFormData(payload, files);

    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Unable to build the education package.");
      }

      const data = (await response.json()) as AnalysisResponse;
      setResult(data);
      setSaveMessage(null);
      const imagingAssets = await buildImagingAssets(files);
      persistPatientPreview({
        analysis: data,
        payload,
        imagingAssets,
        updatedAt: new Date().toISOString()
      });
    } catch (submitError) {
      setResult(null);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong while generating the package."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveCase() {
    if (!result) {
      return;
    }

    setIsSavingCase(true);
    setSaveMessage(null);

    const formData = buildCaseFormData(payload, files);
    formData.append("analysis", JSON.stringify(result));

    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        body: formData
      });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to save the case.");
      }

      if (payload.patientEmail && payload.patientName && payload.diagnosisId) {
        const diagnosisTimelineId = `diagnosis-${result.packageVersionId || new Date().toISOString()}`;
        upsertTimelineEvent({
          id: diagnosisTimelineId,
          type: "diagnosis",
          patientEmail: payload.patientEmail,
          patientName: payload.patientName,
          createdAt: new Date().toISOString(),
          diagnosisId: payload.diagnosisId,
          practiceId: payload.practiceId,
          diagnosisLabel: conditionsById[payload.diagnosisId]?.label || payload.diagnosisId,
          commonName: buildCommonName(
            conditionsById[payload.diagnosisId]?.label || payload.diagnosisId,
            conditionsById[payload.diagnosisId]?.plainLanguageSummary || ""
          ),
          descriptor:
            conditionsById[payload.diagnosisId]?.plainLanguageSummary ||
            "A diagnosis is on file and has active treatment information attached.",
          providerName: payload.providerLabel || "Provider",
          diagnosisDate: new Date().toISOString(),
          conditionSections: result.diagnosisSections,
          treatmentOptions: result.treatmentCards
        });
      }

      setSaveMessage(data.message || "Case saved.");
    } catch (saveError) {
      setSaveMessage(saveError instanceof Error ? saveError.message : "Unable to save the case.");
    } finally {
      setIsSavingCase(false);
    }
  }

  function updatePractice(practiceId: string) {
    const providers = getProvidersForPractice(practiceId);
    setPayload((current) => ({
      ...current,
      practiceId,
      providerId: providers[0]?.id ?? "",
      providerLabel: providers[0]?.name ?? ""
    }));
  }

  function updateProvider(providerId: string) {
    const provider = practiceProviders.find((person) => person.id === providerId);
    setPayload((current) => ({
      ...current,
      providerId,
      providerLabel: provider?.name ?? ""
    }));
  }

  function updateDiagnosis(diagnosisId: string) {
    setPayload((current) => ({
      ...current,
      diagnosisId,
      selectedTreatmentIds: []
    }));
  }

  function toggleTreatment(treatmentId: string) {
    setPayload((current) => ({
      ...current,
      selectedTreatmentIds: current.selectedTreatmentIds.includes(treatmentId)
        ? current.selectedTreatmentIds.filter((id) => id !== treatmentId)
        : [...current.selectedTreatmentIds, treatmentId]
    }));
  }

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="brand-lockup">
            <Image alt="ClearPath Care logo" className="brand-logo" priority src={clearPathLogo} />
            <div>
              <p className="eyebrow">Office workflow, preset education</p>
              <p className="brand-name">ClearPath Care</p>
            </div>
          </div>
          <h1>Let the office choose the case. Let ClearPath teach the patient.</h1>
          <p className="lede">
            Front desk or office staff can build a case on behalf of any provider in the practice.
            The office selects the provider, tooth, diagnosis, and treatment options. ClearPath
            handles the patient-facing explanation, media, and consent package.
          </p>
          <div className="hero-points">
            <div>
              <span>Office-first access</span>
              <p>One office login can support multiple providers while still recording whose diagnosis the case belongs to.</p>
            </div>
            <div>
              <span>No chairside authoring</span>
              <p>Doctors do not need to rewrite treatment explanations between patients.</p>
            </div>
            <div>
              <span>Growing dental library</span>
              <p>{catalogStats.diagnoses} diagnoses and {catalogStats.treatments} treatment paths are ready in the starter catalog already.</p>
            </div>
          </div>
        </div>

        <aside className="hero-card">
          <div className="card-glow" />
          <p className="mini-label">Workflow</p>
          <ol>
            <li>Office user selects the diagnosing provider for the case.</li>
            <li>Office selects tooth, diagnosis, and treatment options.</li>
            <li>Patients receive a clear package with imaging, education, and consent context.</li>
          </ol>
          {currentUser ? (
            <p className="catalog-note">
              Signed in as {currentUser.name} at {practiceCatalog.find((practice) => practice.id === currentUser.practiceId)?.name}.
            </p>
          ) : (
            <p className="catalog-note">
              Log in to lock the workflow to a specific office and team profile.
            </p>
          )}
          <p className="disclaimer">
            Practice-level customization belongs in settings, not in the middle of a patient workflow.
          </p>
        </aside>
      </section>

      <section className="workspace">
        <form className="panel intake-panel" onSubmit={handleSubmit}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Case setup</p>
              <h2>Choose the education package inputs</h2>
            </div>
          </div>

          <div className="grid two-up">
            <label>
              Patient name
              <input
                onChange={(event) =>
                  setPayload((current) => ({ ...current, patientName: event.target.value }))
                }
                placeholder="Jordan Smith"
                value={payload.patientName}
              />
            </label>
            <label>
              Patient email
              <input
                onChange={(event) =>
                  setPayload((current) => ({ ...current, patientEmail: event.target.value }))
                }
                placeholder="patient@example.com"
                type="email"
                value={payload.patientEmail}
              />
            </label>
          </div>

          <div className="grid two-up">
            <label>
              Date of birth
              <input
                onChange={(event) =>
                  setPayload((current) => ({ ...current, dateOfBirth: event.target.value }))
                }
                type="date"
                value={payload.dateOfBirth}
              />
            </label>
            <label>
              Practice profile
              <select
                disabled={Boolean(currentUser)}
                onChange={(event) => updatePractice(event.target.value)}
                value={payload.practiceId}
              >
                {practiceCatalog.map((practice) => (
                  <option key={practice.id} value={practice.id}>
                    {practice.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid two-up">
            <label>
              Diagnosing provider
              <select onChange={(event) => updateProvider(event.target.value)} value={payload.providerId}>
                {practiceProviders.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tooth
              <select
                onChange={(event) =>
                  setPayload((current) => ({ ...current, toothLabel: event.target.value }))
                }
                value={payload.toothLabel}
              >
                <option value="">Choose a tooth</option>
                {adultTeeth.map((tooth) => (
                  <option key={tooth.id} value={tooth.label}>
                    {tooth.display}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Diagnosis
            <select onChange={(event) => updateDiagnosis(event.target.value)} value={payload.diagnosisId}>
              <option value="">Choose a diagnosis</option>
              {conditionCatalog.map((condition) => (
                <option key={condition.id} value={condition.id}>
                  {condition.label}
                </option>
              ))}
            </select>
          </label>

          <div className="catalog-summary">
            <strong>{conditionsById[payload.diagnosisId]?.label || "Select a diagnosis"}</strong>
            <p>
              {conditionsById[payload.diagnosisId]?.plainLanguageSummary ||
                "Choose a diagnosis to load the matching preset treatment options."}
            </p>
            <p>
              {selectedOverride
                ? "This practice already has a custom version saved for the selected diagnosis."
                : "This diagnosis will use the ClearPath default package until the practice creates an override."}
            </p>
            {currentUser ? <p>Package builder opened by: {currentUser.name}</p> : null}
            {payload.providerLabel ? <p>Diagnosis entered for: {payload.providerLabel}</p> : null}
            {payload.toothLabel ? <p>Case label: {payload.toothLabel}</p> : null}
            {payload.patientEmail ? <p>Patient email: {payload.patientEmail}</p> : null}
          </div>

          <section className="choice-section">
            <div className="section-intro">
              <h3>Treatment options to present</h3>
              <p>
                If multiple options are equally appropriate, select them together so the package
                presents them fairly.
              </p>
            </div>

            {diagnosisOptions.length > 0 ? (
              <div className="option-grid">
                {diagnosisOptions.map((option) => {
                  const checked = payload.selectedTreatmentIds.includes(option.id);

                  return (
                    <label className={`option-card ${checked ? "selected" : ""}`} key={option.id}>
                      <input
                        checked={checked}
                        onChange={() => toggleTreatment(option.id)}
                        type="checkbox"
                      />
                      <div>
                        <strong>{option.label}</strong>
                        <p>{option.summary}</p>
                        <span>{option.optionGroupLabel}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="empty-inline">
                Choose a diagnosis first to load preset treatment options.
              </div>
            )}
          </section>

          <label className="upload-field">
            Imaging uploads
            <input
              accept="image/*,.dcm"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              type="file"
            />
            <span>
              Uploaded x-rays and scans become part of the patient package so the patient can view
              or download them alongside the education materials.
            </span>
          </label>

          {files.length > 0 ? (
            <div className="file-list" aria-live="polite">
              {files.map((file) => (
                <span key={`${file.name}-${file.lastModified}`}>{file.name}</span>
              ))}
            </div>
          ) : null}

          <div className="form-footer">
            <button className="primary-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Building package..." : "Build patient package"}
            </button>
            <p>
              This generates the default patient education page, media set, and consent preview for
              the selected office and diagnosis.
            </p>
          </div>

          <div className="preview-link-row">
            <Link className="secondary-link" href="/patient" target="_blank">
              Open patient tab
            </Link>
            <Link className="secondary-link" href="/settings" target="_blank">
              Open settings
            </Link>
            <p>Keep the provider builder here and the patient-facing package in a second tab.</p>
          </div>

          {error ? <p className="error-text">{error}</p> : null}
        </form>

        <section className="panel output-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Package preview</p>
              <h2>Patient education and consent bundle</h2>
            </div>
          </div>

          {result ? (
            <div className="analysis-stack">
              <div className="highlight-card">
                <p className="mini-label">{result.packageSource}</p>
                <h3>{result.headline}</h3>
                <p>{result.summary}</p>
              </div>

              <article>
                <h3>Equal option handling</h3>
                <p>{result.fairnessNote}</p>
              </article>

              <article>
                <h3>Diagnosis education page</h3>
                <div className="dialogue-list">
                  {result.diagnosisSections.map((section) => (
                    <div className="dialogue-card" key={section.title}>
                      <h4>{section.title}</h4>
                      <p>{section.body}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article>
                <h3>Treatment comparison cards</h3>
                <div className="dialogue-list">
                  {result.treatmentCards.map((card) => (
                    <div className="dialogue-card" key={card.label}>
                      <h4>{card.label}</h4>
                      <p>{card.summary}</p>
                      <p><strong>Group:</strong> {card.optionGroupLabel}</p>
                      <p><strong>Visits:</strong> {card.visits.join(" ")}</p>
                      <p><strong>Temporary phase:</strong> {card.temporaryNotes.join(" ")}</p>
                      <p><strong>Benefits:</strong> {card.patientBenefits.join(" ")}</p>
                      <p><strong>Tradeoffs:</strong> {card.patientTradeoffs.join(" ")}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article>
                <h3>Videos, diagrams, and handouts</h3>
                <div className="dialogue-list">
                  {result.mediaPlan.map((asset) => (
                    <div className="dialogue-card" key={`${asset.type}-${asset.title}`}>
                      <h4>{asset.title}</h4>
                      <p>{asset.description}</p>
                      <p>
                        <strong>Type:</strong> {asset.type}
                        {asset.duration ? ` • ${asset.duration}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </article>

              <article>
                <h3>Consent package preview</h3>
                <div className="dialogue-list">
                  {result.consentPreview.map((consent) => (
                    <div className="dialogue-card" key={consent.title}>
                      <h4>{consent.title}</h4>
                      <p>{consent.intro}</p>
                      <ul>
                        {consent.sections.map((section) => (
                          <li key={section}>{section}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </article>

              <article>
                <h3>Practice defaults</h3>
                <ul>
                  {result.practiceDefaults.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article>
                <h3>Patient question strategy</h3>
                <p>{result.aiQnaGuidance}</p>
              </article>

              <article>
                <h3>Common patient questions</h3>
                <ul>
                  {result.commonQuestions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <div className="form-footer">
                <button
                  className="primary-button"
                  disabled={isSavingCase}
                  onClick={handleSaveCase}
                  type="button"
                >
                  {isSavingCase ? "Saving case..." : "Save case record"}
                </button>
                <p>Save which package, options, provider, tooth, and files this patient received.</p>
              </div>
              {saveMessage ? <p className="info-text">{saveMessage}</p> : null}
            </div>
          ) : (
            <div className="empty-state">
              <p className="mini-label">Preview ready</p>
              <h3>No package built yet</h3>
              <p>
                Select a provider, diagnosis, tooth, and one or more treatment options to preview
                the preset info page and consent bundle.
              </p>
            </div>
          )}
        </section>
      </section>
    </>
  );
}

function createInitialPayload(currentUser: ReturnType<typeof useAuth>["currentUser"]): IntakePayload {
  const seededPracticeId = currentUser?.practiceId ?? defaultPracticeId;
  const providers = getProvidersForPractice(seededPracticeId);
  const seededProvider =
    currentUser?.role === "provider"
      ? providers.find((provider) => provider.id === currentUser.id)
      : providers[0];

  return {
    patientName: "",
    patientEmail: "",
    dateOfBirth: "",
    practiceId: seededPracticeId,
    providerId: seededProvider?.id ?? defaultProviders[0]?.id ?? "",
    providerLabel: seededProvider?.name ?? defaultProviders[0]?.name ?? "",
    diagnosisId: "",
    toothLabel: "",
    selectedTreatmentIds: []
  };
}

function buildCaseFormData(payload: IntakePayload, files: File[]) {
  const formData = new FormData();
  formData.append("patientName", payload.patientName);
  formData.append("patientEmail", payload.patientEmail);
  formData.append("dateOfBirth", payload.dateOfBirth);
  formData.append("practiceId", payload.practiceId);
  formData.append("providerId", payload.providerId);
  formData.append("providerLabel", payload.providerLabel);
  formData.append("diagnosisId", payload.diagnosisId);
  formData.append("toothLabel", payload.toothLabel);
  payload.selectedTreatmentIds.forEach((id) => formData.append("selectedTreatmentIds", id));
  files.forEach((file) => formData.append("images", file));
  return formData;
}

function persistPatientPreview(preview: StoredPatientPreview) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(patientPreviewStorageKey, JSON.stringify(preview));
}

function buildCommonName(label: string, plainLanguageSummary: string) {
  const normalizedLabel = label.toLowerCase();

  if (normalizedLabel.includes("abscess")) {
    return "Infection";
  }
  if (normalizedLabel.includes("irreversible pulpitis")) {
    return "Inflamed nerve";
  }
  if (normalizedLabel.includes("necrotic pulp")) {
    return "Dead nerve";
  }
  if (normalizedLabel.includes("deep decay")) {
    return "Cavity";
  }
  if (normalizedLabel.includes("cracked tooth")) {
    return "Tooth crack";
  }

  const summary = plainLanguageSummary.replace(/\.$/, "").trim();
  if (!summary) {
    return "Condition";
  }

  const firstPhrase = summary.split(",")[0]?.split(".")[0]?.trim() || summary;
  return firstPhrase.length > 36 ? `${firstPhrase.slice(0, 33)}...` : firstPhrase;
}

async function buildImagingAssets(files: File[]): Promise<StoredImagingAsset[]> {
  const assets = await Promise.all(
    files.map(
      (file) =>
        new Promise<StoredImagingAsset>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result !== "string") {
              reject(new Error(`Unable to load ${file.name}.`));
              return;
            }

            resolve({
              name: file.name,
              type: file.type || "application/octet-stream",
              size: file.size,
              dataUrl: reader.result
            });
          };
          reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`));
          reader.readAsDataURL(file);
        })
    )
  );

  return assets;
}
