"use client";

import Image from "next/image";
import { useState } from "react";
import clearPathLogo from "@/ClearPath-Care-logo.png";
import { useAuth } from "@/components/auth-provider";
import {
  conditionCatalog,
  mediaCatalog,
  practiceCatalog
} from "@/lib/clinical-catalog";

export function PracticeSettingsView() {
  const { currentUser } = useAuth();
  const [practiceId, setPracticeId] = useState(
    () => currentUser?.practiceId ?? practiceCatalog[0]?.id ?? ""
  );
  const [diagnosisId, setDiagnosisId] = useState("");
  const [infoPageTitle, setInfoPageTitle] = useState("");
  const [infoPageIntro, setInfoPageIntro] = useState("");
  const [consentIntro, setConsentIntro] = useState("");
  const [preferredMediaAssetIds, setPreferredMediaAssetIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function togglePreferredMedia(mediaId: string) {
    setPreferredMediaAssetIds((current) =>
      current.includes(mediaId) ? current.filter((id) => id !== mediaId) : [...current, mediaId]
    );
  }

  async function handleSave() {
    if (!diagnosisId || !infoPageTitle || !infoPageIntro) {
      setMessage("Choose a diagnosis and fill in the title and intro before saving.");
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
          diagnosisId,
          infoPageTitle,
          infoPageIntro,
          consentIntro,
          preferredMediaAssetIds
        })
      });

      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to save the override.");
      }

      setMessage(data.message || "Practice settings saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save the override.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <section className="panel patient-hero">
        <div className="brand-lockup">
          <Image alt="ClearPath Care logo" className="brand-logo" priority src={clearPathLogo} />
          <div>
            <p className="eyebrow">Practice settings</p>
            <p className="brand-name">ClearPath Care</p>
          </div>
        </div>
        <h1 className="patient-title">Practice education defaults</h1>
        <p className="lede">
          Office or front-desk staff can manage the default education page, consent intro, and
          preferred media here for the whole practice.
        </p>
        {currentUser ? (
          <p className="catalog-note">Signed in practice: {practiceCatalog.find((practice) => practice.id === practiceId)?.name}</p>
        ) : null}
      </section>

      <section className="panel">
        <div className="grid two-up">
          <label>
            Practice
            <select
              disabled={Boolean(currentUser)}
              onChange={(event) => setPracticeId(event.target.value)}
              value={practiceId}
            >
              {practiceCatalog.map((practice) => (
                <option key={practice.id} value={practice.id}>
                  {practice.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Diagnosis
          <select onChange={(event) => setDiagnosisId(event.target.value)} value={diagnosisId}>
            <option value="">Choose a diagnosis</option>
            {conditionCatalog.map((diagnosis) => (
              <option key={diagnosis.id} value={diagnosis.id}>
                {diagnosis.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Info page title
          <input
            onChange={(event) => setInfoPageTitle(event.target.value)}
            placeholder="Office-specific education page title"
            value={infoPageTitle}
          />
        </label>

        <label>
          Info page intro
          <textarea
            onChange={(event) => setInfoPageIntro(event.target.value)}
            placeholder="Add the office-specific framing patients should see first."
            rows={4}
            value={infoPageIntro}
          />
        </label>

        <label>
          Consent intro
          <textarea
            onChange={(event) => setConsentIntro(event.target.value)}
            placeholder="Add office-specific consent framing or instructions."
            rows={4}
            value={consentIntro}
          />
        </label>

        <div className="section-intro">
          <h3>Preferred media</h3>
          <p>Select the ClearPath assets this office wants to use by default.</p>
        </div>

        <div className="option-grid">
          {mediaCatalog.map((asset) => {
            const checked = preferredMediaAssetIds.includes(asset.id);
            return (
              <label className={`option-card ${checked ? "selected" : ""}`} key={asset.id}>
                <input checked={checked} onChange={() => togglePreferredMedia(asset.id)} type="checkbox" />
                <div>
                  <strong>{asset.title}</strong>
                  <p>{asset.description}</p>
                  <span>{asset.type}</span>
                </div>
              </label>
            );
          })}
        </div>

        <div className="form-footer">
          <button className="primary-button" disabled={isSaving} onClick={handleSave} type="button">
            {isSaving ? "Saving settings..." : "Save practice default"}
          </button>
          <p>The saved override becomes the default package for this diagnosis at that practice.</p>
        </div>

        {message ? <p className="info-text">{message}</p> : null}
      </section>
    </>
  );
}
