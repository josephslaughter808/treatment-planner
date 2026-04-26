"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import clearPathLogo from "@/ClearPath-Care-logo.png";
import type { StoredPatientPreview } from "@/lib/package-preview";
import { patientPreviewStorageKey } from "@/lib/package-preview";

export function PatientPackageView() {
  const [preview, setPreview] = useState<StoredPatientPreview | null>(null);
  const [enteredEmail, setEnteredEmail] = useState("");
  const [enteredDob, setEnteredDob] = useState("");

  useEffect(() => {
    function readPreview() {
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

    function handleStorage(event: StorageEvent) {
      if (event.key === patientPreviewStorageKey) {
        readPreview();
      }
    }

    readPreview();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <main className="shell patient-shell">
      <section className="patient-hero panel">
        <div className="brand-lockup">
          <Image alt="ClearPath Care logo" className="brand-logo" priority src={clearPathLogo} />
          <div>
            <p className="eyebrow">Patient view</p>
            <p className="brand-name">ClearPath Care</p>
          </div>
        </div>
        <h1 className="patient-title">Your treatment information package</h1>
        <p className="lede">
          This page is designed to give the patient a clear, calm explanation of the diagnosis,
          options, and consent details selected by the provider.
        </p>
      </section>

      {preview ? (
        preview.payload.patientEmail.toLowerCase() === enteredEmail.trim().toLowerCase() &&
        preview.payload.dateOfBirth === enteredDob ? (
        <section className="patient-layout">
          <article className="panel patient-summary">
            <p className="mini-label">{preview.analysis.packageSource}</p>
            <h2>{preview.analysis.headline}</h2>
            <p>{preview.analysis.summary}</p>
            {preview.payload.patientEmail ? (
              <p className="catalog-note">Patient email: {preview.payload.patientEmail}</p>
            ) : null}
            {preview.analysis.providerLabel ? (
              <p className="catalog-note">Diagnosing provider: {preview.analysis.providerLabel}</p>
            ) : null}
            {preview.analysis.toothLabel ? (
              <p className="catalog-note">Case label: {preview.analysis.toothLabel}</p>
            ) : null}
            <p className="catalog-note">
              Updated {new Date(preview.updatedAt).toLocaleString()}
            </p>
          </article>

          <article className="panel">
            <h2>What this diagnosis means</h2>
            <div className="dialogue-list">
              {preview.analysis.diagnosisSections.map((section) => (
                <div className="dialogue-card" key={section.title}>
                  <h4>{section.title}</h4>
                  <p>{section.body}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <h2>Your treatment options</h2>
            <p>{preview.analysis.fairnessNote}</p>
            <div className="dialogue-list">
              {preview.analysis.treatmentCards.map((card) => (
                <div className="dialogue-card" key={card.label}>
                  <h4>{card.label}</h4>
                  <p>{card.summary}</p>
                  <p><strong>Visits:</strong> {card.visits.join(" ")}</p>
                  <p><strong>Temporary phase:</strong> {card.temporaryNotes.join(" ")}</p>
                  <p><strong>Benefits:</strong> {card.patientBenefits.join(" ")}</p>
                  <p><strong>Tradeoffs:</strong> {card.patientTradeoffs.join(" ")}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <h2>Videos, diagrams, and handouts</h2>
            <div className="dialogue-list">
              {preview.analysis.mediaPlan.map((asset) => (
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

          <article className="panel">
            <h2>Diagnostic imaging</h2>
            {preview.imagingAssets.length > 0 ? (
              <div className="imaging-grid">
                {preview.imagingAssets.map((asset) => (
                  <div className="dialogue-card" key={asset.name}>
                    <h4>{asset.name}</h4>
                    {asset.type.startsWith("image/") ? (
                      <Image
                        alt={asset.name}
                        className="patient-image"
                        height={280}
                        src={asset.dataUrl}
                        unoptimized
                        width={420}
                      />
                    ) : (
                      <div className="non-image-file">
                        <p>This file type is available to download.</p>
                      </div>
                    )}
                    <p>
                      <strong>Type:</strong> {asset.type}
                    </p>
                    <p>
                      <strong>Size:</strong> {formatFileSize(asset.size)}
                    </p>
                    <a className="secondary-link" download={asset.name} href={asset.dataUrl}>
                      Download file
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p>No diagnostic imaging has been attached to this patient package yet.</p>
            )}
          </article>

          <article className="panel">
            <h2>Consent information</h2>
            <div className="dialogue-list">
              {preview.analysis.consentPreview.map((consent) => (
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

          <article className="panel">
            <h2>Common questions</h2>
            <ul>
              {preview.analysis.commonQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </article>
        </section>
        ) : (
          <section className="panel">
            <p className="mini-label">Patient verification</p>
            <h2>Verify your profile</h2>
            <p>
              Enter the email and date of birth tied to your patient profile before opening this package.
            </p>
            <div className="grid two-up">
              <label>
                Email
                <input
                  onChange={(event) => setEnteredEmail(event.target.value)}
                  placeholder="patient@example.com"
                  type="email"
                  value={enteredEmail}
                />
              </label>
              <label>
                Date of birth
                <input
                  onChange={(event) => setEnteredDob(event.target.value)}
                  type="date"
                  value={enteredDob}
                />
              </label>
            </div>
            <p className="catalog-note">
              In the production version, this should be backed by a case-based secure link or one-time code, not just browser-stored preview data.
            </p>
          </section>
        )
      ) : (
        <section className="panel empty-state">
          <p className="mini-label">Waiting for provider tab</p>
          <h3>No patient package yet</h3>
          <p>
            Generate a package from the provider view first. This tab will update when the latest
            preview is available in the browser.
          </p>
        </section>
      )}
    </main>
  );
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
