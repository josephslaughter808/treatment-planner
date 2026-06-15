"use client";

import { useMemo, useState } from "react";
import { buildClearPathPackage, validateClearPathPackage } from "@/lib/clearpath-package";
import { readVaultFromStorage, type PatientVault } from "@/lib/patient-vault";
import {
  translateClearPathPackageToCsv,
  translateClearPathPackageToOpenDentalPreview,
  translateClearPathPackageToPdfText
} from "@/lib/translators";

export function PatientShareView() {
  const [vault] = useState<PatientVault>(() => readVaultFromStorage());
  const [origin] = useState(() =>
    typeof window === "undefined" ? "https://clearpath-care.vercel.app" : window.location.origin
  );
  const [message, setMessage] = useState<string | null>(null);

  const accessCode = vault.walletCode || vault.memberId;
  const shareUrl = useMemo(() => {
    const url = new URL("/check-in", origin);
    url.searchParams.set("accessCode", accessCode);
    url.searchParams.set("memberId", accessCode);
    return url.toString();
  }, [accessCode, origin]);
  const clearPathPackage = useMemo(
    () =>
      buildClearPathPackage({
        vault,
        generatedByRole: "patient",
        consent: {
          recipientName: "Patient self-export",
          recipientType: "external-system",
          purposeOfUse: "patient-request"
        }
      }),
    [vault]
  );
  const packageValidation = useMemo(() => validateClearPathPackage(clearPathPackage), [clearPathPackage]);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=${encodeURIComponent(shareUrl)}`;

  async function copyShareCode() {
    await navigator.clipboard.writeText(accessCode);
    setMessage("Share code copied.");
  }

  async function copyShareLink() {
    await navigator.clipboard.writeText(shareUrl);
    setMessage("Office check-in link copied.");
  }

  function downloadClearPathJson() {
    downloadPayload({
      fileName: `${safeFileName(vault.fullName || "clearpath-package")}.clearpath.json`,
      mimeType: "application/json",
      payload: JSON.stringify(clearPathPackage, null, 2)
    });
    setMessage("ClearPath JSON package downloaded.");
  }

  function downloadCsv() {
    const result = translateClearPathPackageToCsv(clearPathPackage);
    downloadPayload(result);
    setMessage("CSV package downloaded.");
  }

  function downloadPdfSource() {
    const result = translateClearPathPackageToPdfText(clearPathPackage);
    downloadPayload(result);
    setMessage("PDF source summary downloaded.");
  }

  function downloadOpenDentalPreview() {
    const result = translateClearPathPackageToOpenDentalPreview(clearPathPackage);
    downloadPayload(result);
    setMessage("Open Dental reviewed-import preview downloaded.");
  }

  return (
    <section className="patient-share-layout">
      <article className="panel patient-share-pass">
        <div>
          <p className="eyebrow">QR check-in pass</p>
          <h2>Let the office scan your ClearPath code.</h2>
          <p>
            This QR opens the office check-in page with your ClearPath access code loaded. It does not place
            your medical history inside the QR itself.
          </p>
        </div>

        <div className="qr-card" aria-label="ClearPath QR code">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="ClearPath check-in QR code" src={qrImageUrl} />
        </div>

        <div className="share-code-card">
          <span>Office share code</span>
          <strong>{accessCode}</strong>
        </div>

        <div className="document-actions">
          <button className="primary-button" onClick={copyShareCode} type="button">
            Copy code
          </button>
          <button className="secondary-button" onClick={copyShareLink} type="button">
            Copy office link
          </button>
        </div>

        {message ? <p className="info-text">{message}</p> : null}
      </article>

      <aside className="panel patient-share-instructions">
        <p className="eyebrow">How it works</p>
        <h2>Use this at check-in.</h2>
        <div className="dialogue-list">
          <div className="dialogue-card">
            <h4>1. Show the QR code</h4>
            <p>The office scans it from your phone or types the share code manually.</p>
          </div>
          <div className="dialogue-card">
            <h4>2. Office reviews your profile</h4>
            <p>Your medical history, medications, allergies, emergency contact, and insurance are reviewed in ClearPath.</p>
          </div>
          <div className="dialogue-card">
            <h4>3. You stay in control</h4>
            <p>Future versions can add expiring permissions per office. For now, this supports the phase-one pilot check-in flow.</p>
          </div>
        </div>
      </aside>

      <article className="panel patient-share-instructions patient-package-export-panel">
        <p className="eyebrow">Translator hub package</p>
        <h2>Your ClearPath package is ready.</h2>
        <p>
          This is the first version of the translating hub. ClearPath turns your health profile into
          one package, then exports it into formats an office can review.
        </p>

        <div className="dialogue-list">
          <div className="dialogue-card">
            <h4>Package version</h4>
            <p>{clearPathPackage.packageVersion}</p>
          </div>
          <div className="dialogue-card">
            <h4>Included sections</h4>
            <p>{clearPathPackage.consent.sections.length} consent-scoped sections</p>
          </div>
          <div className="dialogue-card">
            <h4>Validation</h4>
            <p>{packageValidation.valid ? "Ready to translate" : packageValidation.errors.join(" ")}</p>
          </div>
        </div>

        {packageValidation.warnings.length ? (
          <div className="dialogue-card">
            <h4>Package notes</h4>
            <p>{packageValidation.warnings.join(" ")}</p>
          </div>
        ) : null}

        <div className="document-actions">
          <button className="primary-button" onClick={downloadClearPathJson} type="button">
            Download JSON
          </button>
          <button className="secondary-button" onClick={downloadCsv} type="button">
            Download CSV
          </button>
          <button className="secondary-button" onClick={downloadPdfSource} type="button">
            Download PDF source
          </button>
          <button className="secondary-button" onClick={downloadOpenDentalPreview} type="button">
            Open Dental preview
          </button>
        </div>
      </article>
    </section>
  );
}

function downloadPayload(input: { fileName?: string; mimeType?: string; payload: string }) {
  const blob = new Blob([input.payload], { type: input.mimeType || "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = input.fileName || "clearpath-package.txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "clearpath-package";
}
