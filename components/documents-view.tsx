"use client";

import { useState } from "react";

type DocumentSlotId =
  | "release-emergency-contact"
  | "drivers-license-front"
  | "drivers-license-back"
  | "insurance-card-front"
  | "insurance-card-back"
  | "guardian-authorization";

type StoredDocument = {
  slotId: DocumentSlotId;
  fileName: string;
  fileType: string;
  dataUrl: string;
  uploadedAt: string;
};

type DocumentSlot = {
  id: DocumentSlotId;
  title: string;
  description: string;
};

const documentStorageKey = "clearpath-patient-documents";

const documentSlots: DocumentSlot[] = [
  {
    id: "release-emergency-contact",
    title: "Release of information",
    description: "Authorization allowing information to be released to your emergency contact or approved person."
  },
  {
    id: "drivers-license-front",
    title: "Driver's license or photo ID",
    description: "Front side of your driver's license, state ID, passport card, or other photo ID."
  },
  {
    id: "drivers-license-back",
    title: "Driver's license back",
    description: "Back side of your ID when an office needs the full card on file."
  },
  {
    id: "insurance-card-front",
    title: "Insurance card front",
    description: "Front side of your medical, dental, or other insurance card."
  },
  {
    id: "insurance-card-back",
    title: "Insurance card back",
    description: "Back side of your insurance card with payer contact or claims information."
  },
  {
    id: "guardian-authorization",
    title: "Guardian or legal authorization",
    description: "Power of attorney, guardianship, custody, or caregiver authorization documents if applicable."
  }
];

export function DocumentsView() {
  const [documents, setDocuments] = useState<StoredDocument[]>(() => readDocuments());
  const [message, setMessage] = useState<string | null>(null);

  async function handleUpload(slotId: DocumentSlotId, file: File | null) {
    if (!file) {
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    const nextDocuments = [
      ...documents.filter((document) => document.slotId !== slotId),
      {
        slotId,
        fileName: file.name,
        fileType: file.type,
        dataUrl,
        uploadedAt: new Date().toISOString()
      }
    ];

    setDocuments(nextDocuments);
    writeDocuments(nextDocuments);
    setMessage("Document saved on this device for check-in.");
  }

  function removeDocument(slotId: DocumentSlotId) {
    const nextDocuments = documents.filter((document) => document.slotId !== slotId);
    setDocuments(nextDocuments);
    writeDocuments(nextDocuments);
    setMessage("Document removed from this device.");
  }

  return (
    <section className="documents-layout">
      <section className="panel documents-intro-panel">
        <p className="eyebrow">Standard check-in documents</p>
        <h2>Keep the cards offices usually ask for.</h2>
        <p>
          Upload photos or PDFs for the documents you want ready at check-in. For the pilot, these are stored
          on this device; encrypted cloud document storage can be added before wider launch.
        </p>
      </section>

      <section className="document-slot-grid">
        {documentSlots.map((slot) => {
          const storedDocument = documents.find((document) => document.slotId === slot.id);
          return (
            <article className="panel document-slot-card" key={slot.id}>
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Document</p>
                  <h2>{slot.title}</h2>
                  <p>{slot.description}</p>
                </div>
              </div>

              {storedDocument ? (
                <div className="document-preview-card">
                  {storedDocument.fileType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={`${slot.title} preview`} src={storedDocument.dataUrl} />
                  ) : (
                    <a className="secondary-link" href={storedDocument.dataUrl} rel="noreferrer" target="_blank">
                      Open uploaded file
                    </a>
                  )}
                  <div>
                    <p className="saved-entry-title">{storedDocument.fileName}</p>
                    <p className="saved-entry-subtitle">
                      Uploaded {new Date(storedDocument.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="saved-empty-state">No document uploaded yet.</p>
              )}

              <div className="document-actions">
                <label className="secondary-button document-upload-button">
                  Upload
                  <input
                    accept="image/*,.pdf"
                    onChange={(event) => void handleUpload(slot.id, event.target.files?.[0] ?? null)}
                    type="file"
                  />
                </label>
                {storedDocument ? (
                  <button className="edit-chip" onClick={() => removeDocument(slot.id)} type="button">
                    Remove
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>

      {message ? <p className="info-text">{message}</p> : null}
    </section>
  );
}

function readDocuments(): StoredDocument[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(documentStorageKey);
    return stored ? (JSON.parse(stored) as StoredDocument[]) : [];
  } catch {
    return [];
  }
}

function writeDocuments(documents: StoredDocument[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(documentStorageKey, JSON.stringify(documents));
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read this file."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read this file."));
    reader.readAsDataURL(file);
  });
}
