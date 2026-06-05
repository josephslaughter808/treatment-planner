"use client";

import { useMemo, useState } from "react";
import { readVaultFromStorage, type PatientVault } from "@/lib/patient-vault";

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
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=${encodeURIComponent(shareUrl)}`;

  async function copyShareCode() {
    await navigator.clipboard.writeText(accessCode);
    setMessage("Share code copied.");
  }

  async function copyShareLink() {
    await navigator.clipboard.writeText(shareUrl);
    setMessage("Office check-in link copied.");
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
    </section>
  );
}
