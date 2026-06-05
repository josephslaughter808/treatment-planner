"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { getSupabaseAuthHeaders } from "@/lib/supabase-browser";
import type { PatientVault } from "@/lib/patient-vault";

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
};

type WindowWithBarcodeDetector = Window & {
  BarcodeDetector?: BarcodeDetectorConstructor;
};

export function ProviderNewPatientView() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [addedPatient, setAddedPatient] = useState<PatientVault | null>(null);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [scanStatus, setScanStatus] = useState<"idle" | "starting" | "scanning" | "found" | "unsupported" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (scanLoopRef.current !== null) {
        window.clearTimeout(scanLoopRef.current);
        scanLoopRef.current = null;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    },
    []
  );

  function openCheckIn(code = accessCode) {
    const normalizedCode = getAccessCodeFromQrValue(code);
    if (!normalizedCode) {
      setMessage("Enter or scan a ClearPath access code first.");
      return;
    }

    router.push(`/check-in?accessCode=${encodeURIComponent(normalizedCode)}&memberId=${encodeURIComponent(normalizedCode)}`);
  }

  async function addPatientToPractice(code = accessCode) {
    const normalizedCode = getAccessCodeFromQrValue(code);
    if (!normalizedCode) {
      setMessage("Enter or scan a ClearPath access code first.");
      return;
    }

    if (!currentUser?.practiceId) {
      setMessage("Sign in as a provider before adding a patient to the practice database.");
      return;
    }

    setIsAddingPatient(true);
    setMessage(null);

    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getSupabaseAuthHeaders())
        },
        body: JSON.stringify({
          practiceId: currentUser.practiceId,
          accessCode: normalizedCode
        })
      });
      const data = (await response.json()) as {
        patient?: PatientVault;
        message?: string;
        error?: string;
      };

      if (!response.ok || !data.patient) {
        throw new Error(data.error || "Unable to add this patient to the practice database.");
      }

      setAddedPatient(data.patient);
      setAccessCode(normalizedCode);
      setScanStatus("found");
      setMessage(data.message || "Patient added to the practice database.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add this patient to the practice database.");
    } finally {
      setIsAddingPatient(false);
    }
  }

  async function startQrScan() {
    setMessage(null);

    if (typeof window === "undefined" || !("mediaDevices" in navigator)) {
      setScanStatus("unsupported");
      setMessage("This browser cannot access a camera. Enter the access code manually instead.");
      return;
    }

    const BarcodeDetector = (window as WindowWithBarcodeDetector).BarcodeDetector;
    if (!BarcodeDetector) {
      setScanStatus("unsupported");
      setMessage("QR scanning is not supported in this browser yet. Enter the access code manually.");
      return;
    }

    setScanStatus("starting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;

      if (!videoRef.current) {
        stopCamera();
        return;
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setScanStatus("scanning");

      const detector = new BarcodeDetector({ formats: ["qr_code"] });

      async function detectCode() {
        if (!videoRef.current || scanLoopRef.current === null) {
          return;
        }

        try {
          const results = await detector.detect(videoRef.current);
          const rawValue = results[0]?.rawValue;
          if (rawValue) {
            const scannedCode = getAccessCodeFromQrValue(rawValue);
            setAccessCode(scannedCode);
            setScanStatus("found");
            setMessage("QR code found. Adding patient to the practice database.");
            stopCamera();
            await addPatientToPractice(scannedCode);
            return;
          }
        } catch {
          setMessage("The camera is open, but ClearPath could not read a QR code yet.");
        }

        scanLoopRef.current = window.setTimeout(detectCode, 450);
      }

      scanLoopRef.current = window.setTimeout(detectCode, 300);
    } catch {
      stopCamera();
      setScanStatus("error");
      setMessage("Camera access was blocked or unavailable. Enter the access code manually.");
    }
  }

  function stopCamera() {
    if (scanLoopRef.current !== null) {
      window.clearTimeout(scanLoopRef.current);
      scanLoopRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanStatus((current) => (current === "scanning" || current === "starting" ? "idle" : current));
  }

  const isCameraActive = scanStatus === "starting" || scanStatus === "scanning";

  return (
    <section className="provider-new-patient-stage">
      <article className="provider-new-patient-hero">
        <div>
          <p className="eyebrow">New patient intake</p>
          <h2>Scan the patient code or type it in.</h2>
          <p>
            Use this page when a patient presents their ClearPath QR code from the patient app. Scanning or
            entering the code adds that patient to this practice database.
          </p>
        </div>
        <div className="provider-scan-status-card">
          <span>Mode</span>
          <strong>
            {isCameraActive
              ? "Scanning"
              : addedPatient
                ? "Patient added"
                : accessCode.trim()
                  ? "Code ready"
                  : "Waiting"}
          </strong>
        </div>
      </article>

      <div className="provider-new-patient-layout">
        <article className="panel provider-scan-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">QR scanner</p>
              <h2>Scan patient QR</h2>
              <p>Hold the patient phone QR code in front of the office camera until the code is detected.</p>
            </div>
          </div>

          <div className={`provider-camera-frame ${isCameraActive ? "active" : ""}`}>
            <video ref={videoRef} muted playsInline />
            {!isCameraActive ? (
              <div className="provider-camera-placeholder">
                <span />
                <strong>Camera preview</strong>
                <p>Start scanning when the patient has their QR pass open.</p>
              </div>
            ) : null}
            <i aria-hidden="true" />
          </div>

          <div className="provider-scan-actions">
            <button className="primary-button" disabled={isCameraActive} onClick={startQrScan} type="button">
              {scanStatus === "starting" ? "Starting camera..." : "Start QR scan"}
            </button>
            {isCameraActive ? (
              <button className="secondary-button" onClick={stopCamera} type="button">
                Stop camera
              </button>
            ) : null}
          </div>

          <p className="catalog-note">
            Camera scanning depends on browser support. Manual entry below is always available.
          </p>
        </article>

        <article className="panel provider-manual-code-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Manual entry</p>
              <h2>Enter access code</h2>
              <p>Use this if the camera is unavailable or the patient gives the office code directly.</p>
            </div>
          </div>

          <label className="provider-access-code-field">
            Patient access code
            <input
              autoCapitalize="characters"
              autoComplete="off"
              onChange={(event) => setAccessCode(event.target.value)}
              placeholder="Example: CP-ABC123"
              value={accessCode}
            />
          </label>

          <button
            className="primary-button provider-open-checkin-button"
            disabled={isAddingPatient}
            onClick={() => addPatientToPractice()}
            type="button"
          >
            {isAddingPatient ? "Adding patient..." : "Add patient to database"}
          </button>

          {addedPatient ? (
            <div className="provider-added-patient-card">
              <p className="eyebrow">Patient added</p>
              <h3>{addedPatient.fullName || "Patient profile"}</h3>
              <p>{addedPatient.email || "Email not entered"}</p>
              <p>
                {[addedPatient.dateOfBirth ? `DOB ${addedPatient.dateOfBirth}` : "", addedPatient.phone]
                  .filter(Boolean)
                  .join(" • ") || "Demographics can be reviewed in check-in."}
              </p>
              <button className="primary-button" onClick={() => openCheckIn()} type="button">
                Open check-in review
              </button>
            </div>
          ) : null}

          <div className="provider-code-help">
            <h3>Where the code comes from</h3>
            <p>The patient can open the Share tab in their patient app and show the QR code or office share code.</p>
            <p>The QR does not contain medical history. It only gives the office permission to connect the patient record.</p>
          </div>

          {message ? <p className="info-text">{message}</p> : null}
        </article>
      </div>
    </section>
  );
}

function getAccessCodeFromQrValue(value: string) {
  try {
    const url = new URL(value);
    return normalizeAccessCode(url.searchParams.get("accessCode") || url.searchParams.get("memberId") || value);
  } catch {
    return normalizeAccessCode(value);
  }
}

function normalizeAccessCode(value: string) {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}
