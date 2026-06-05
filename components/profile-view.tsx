"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, PointerEvent, useRef, useState } from "react";
import { AvatarBadge } from "@/components/avatar-badge";
import { useAuth } from "@/components/auth-provider";
import { getSupabaseAuthHeaders } from "@/lib/supabase-browser";
import { practicesById } from "@/lib/clinical-catalog";
import {
  readCheckInsFromStorage,
  readShareLinksFromStorage,
  readVaultFromStorage,
  writeCheckInsToStorage,
  writeShareLinksToStorage,
  writeVaultToStorage,
  type PatientVault,
  type ShareLinkRecord
} from "@/lib/patient-vault";
import { isPatientRole } from "@/lib/account-directory";

export function ProfileView() {
  const router = useRouter();
  const { currentUser, signOut, updateProfile } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [name, setName] = useState(currentUser?.name ?? "");
  const [title, setTitle] = useState(currentUser?.title ?? "");
  const [phone, setPhone] = useState(currentUser?.phone ?? "");
  const [bio, setBio] = useState(currentUser?.bio ?? "");
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>(currentUser?.avatarDataUrl);
  const [avatarCropSource, setAvatarCropSource] = useState<string | null>(null);
  const [avatarCropNaturalSize, setAvatarCropNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [avatarCropZoom, setAvatarCropZoom] = useState(1);
  const [avatarCropOffset, setAvatarCropOffset] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef<{ pointerId: number; clientX: number; clientY: number; offsetX: number; offsetY: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [vault, setVault] = useState<PatientVault>(() => readVaultFromStorage());
  const [checkIns, setCheckIns] = useState(() => readCheckInsFromStorage());
  const [shareLinks, setShareLinks] = useState<ShareLinkRecord[]>(() => readShareLinksFromStorage());

  if (!currentUser) {
    return (
      <section className="panel empty-state">
        <p className="mini-label">Profile access</p>
        <h3>Log in to edit a profile</h3>
        <p>Sign in first so ClearPath can show the right profile, contact details, and account settings.</p>
        <Link className="primary-link" href="/login">
          Go to login
        </Link>
      </section>
    );
  }

  async function handleAvatarChange(file: File | null) {
    if (!file) {
      setAvatarCropSource(null);
      setAvatarCropNaturalSize(null);
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    const naturalSize = await readImageSize(dataUrl);
    setAvatarCropSource(dataUrl);
    setAvatarCropNaturalSize(naturalSize);
    setAvatarCropZoom(1);
    setAvatarCropOffset({ x: 0, y: 0 });
    setMessage("Move and zoom your photo until the circle looks right, then use this crop.");
  }

  function handleCropPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!avatarCropNaturalSize) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      offsetX: avatarCropOffset.x,
      offsetY: avatarCropOffset.y
    };
  }

  function handleCropPointerMove(event: PointerEvent<HTMLDivElement>) {
    const dragStart = dragStartRef.current;
    if (!dragStart || dragStart.pointerId !== event.pointerId || !avatarCropNaturalSize) {
      return;
    }

    const nextOffset = clampCropOffset(
      {
        x: dragStart.offsetX + event.clientX - dragStart.clientX,
        y: dragStart.offsetY + event.clientY - dragStart.clientY
      },
      avatarCropNaturalSize,
      avatarCropZoom
    );

    setAvatarCropOffset(nextOffset);
  }

  function handleCropPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (dragStartRef.current?.pointerId === event.pointerId) {
      dragStartRef.current = null;
    }
  }

  function handleCropZoomChange(value: string) {
    if (!avatarCropNaturalSize) {
      return;
    }

    const nextZoom = Number(value);
    setAvatarCropZoom(nextZoom);
    setAvatarCropOffset((currentOffset) => clampCropOffset(currentOffset, avatarCropNaturalSize, nextZoom));
  }

  async function applyAvatarCrop() {
    if (!avatarCropSource || !avatarCropNaturalSize) {
      return;
    }

    const croppedAvatar = await cropAvatarImage({
      dataUrl: avatarCropSource,
      naturalSize: avatarCropNaturalSize,
      offset: avatarCropOffset,
      zoom: avatarCropZoom
    });

    setAvatarDataUrl(croppedAvatar);
    setAvatarCropSource(null);
    setAvatarCropNaturalSize(null);
    setMessage("Profile picture crop ready. Save your profile to keep it.");
  }

  function clearAvatar() {
    setAvatarDataUrl("");
    setAvatarCropSource(null);
    setAvatarCropNaturalSize(null);
    setMessage("Profile picture removed. Save your profile to keep the change.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    const result = await updateProfile({
      name,
      title,
      phone,
      bio,
      avatarDataUrl
    });

    setMessage(result.message);
    if (result.ok) {
      setIsEditingProfile(false);
    }
    setIsSaving(false);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  async function archiveOffice(practiceId: string) {
    const nextCheckIns = checkIns.filter((entry) => entry.practiceId !== practiceId);
    const nextShareLinks = shareLinks.filter((entry) => entry.practiceId !== practiceId);
    const nextVault = {
      ...vault,
      officeConnections: vault.officeConnections.filter((entry) => entry.practiceId !== practiceId),
      lastUpdatedAt: new Date().toISOString()
    };

    setCheckIns(nextCheckIns);
    writeCheckInsToStorage(nextCheckIns);
    setShareLinks(nextShareLinks);
    writeShareLinksToStorage(nextShareLinks);
    setVault(nextVault);
    writeVaultToStorage(nextVault);
    setMessage("Office archived. It will no longer show in your active office list.");

    try {
      await fetch("/api/patient-vault", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getSupabaseAuthHeaders())
        },
        body: JSON.stringify(nextVault)
      });
    } catch {
      setMessage("Office archived on this device. ClearPath will sync the change the next time your profile syncs.");
    }
  }

  const activeOffices = getActiveOffices(vault, checkIns, shareLinks);
  const isPatientAccount = isPatientRole(currentUser.role);

  return (
    <section className="grid profile-layout profile-screen">
      <article className="panel profile-card">
        <AvatarBadge
          accentColor={currentUser.avatarColor}
          imageUrl={avatarDataUrl}
          name={name || currentUser.name}
          size="lg"
        />
        <div className="profile-card-copy">
          <p className="mini-label">Live profile card</p>
          <h2>{name || currentUser.name}</h2>
          <p>{title || currentUser.title}</p>
          <div className="profile-meta">
            <p className="catalog-note">{practicesById[currentUser.practiceId]?.name}</p>
            <p className="catalog-note">{currentUser.email}</p>
            <p className="catalog-note">{phone || currentUser.phone}</p>
          </div>
        </div>
        <div className="profile-card-actions">
          <button className="primary-button" onClick={() => setIsEditingProfile(true)} type="button">
            Edit profile
          </button>
          <button className="secondary-button profile-logout-button" onClick={handleSignOut} type="button">
            Log out
          </button>
        </div>
      </article>

      {isEditingProfile ? (
        <form className="panel form-card" onSubmit={handleSubmit}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Profile settings</p>
              <h2>{isPatientAccount ? "Update your account profile" : "Update your office profile"}</h2>
            </div>
            <button className="edit-chip" onClick={() => setIsEditingProfile(false)} type="button">
              Close
            </button>
          </div>

          <div className="grid two-up">
            <label>
              Full name
              <input onChange={(event) => setName(event.target.value)} value={name} />
            </label>
            <label>
              Title
              <input onChange={(event) => setTitle(event.target.value)} value={title} />
            </label>
          </div>

          <div className="grid two-up">
            <label>
              Email
              <input disabled value={currentUser.email} />
            </label>
            <label>
              Phone
              <input onChange={(event) => setPhone(event.target.value)} value={phone} />
            </label>
          </div>

          <label className="upload-field">
            Profile picture
            <input
              accept="image/*"
              onChange={(event) => handleAvatarChange(event.target.files?.[0] ?? null)}
              type="file"
            />
            <span>Choose a photo, then drag and zoom it so your face sits inside the circle.</span>
          </label>

          {avatarCropSource && avatarCropNaturalSize ? (
            <section className="avatar-crop-card" aria-label="Profile picture crop editor">
              <div
                className="avatar-crop-preview"
                onPointerCancel={handleCropPointerUp}
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={handleCropPointerUp}
                role="img"
                style={{ touchAction: "none" }}
                aria-label="Drag photo to choose what appears inside the profile circle"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  draggable={false}
                  src={avatarCropSource}
                  style={getCropPreviewStyle(avatarCropNaturalSize, avatarCropZoom, avatarCropOffset)}
                />
                <span className="avatar-crop-ring" aria-hidden="true" />
              </div>

              <div className="avatar-crop-controls">
                <div>
                  <p className="saved-value-label">Set your circle</p>
                  <p className="catalog-note">Drag the photo to center it. Use zoom to choose how close it should be.</p>
                </div>
                <label className="avatar-zoom-control">
                  Zoom
                  <input
                    aria-label="Zoom profile picture"
                    max="2.8"
                    min="1"
                    onChange={(event) => handleCropZoomChange(event.target.value)}
                    step="0.05"
                    type="range"
                    value={avatarCropZoom}
                  />
                </label>
                <div className="avatar-crop-actions">
                  <button className="primary-button" onClick={applyAvatarCrop} type="button">
                    Use this crop
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setAvatarCropSource(null);
                      setAvatarCropNaturalSize(null);
                    }}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          <div className="avatar-current-row">
            <AvatarBadge
              accentColor={currentUser.avatarColor}
              imageUrl={avatarDataUrl}
              name={name || currentUser.name}
              size="md"
            />
            <div>
              <p className="saved-value-label">Current profile picture</p>
              <p className="catalog-note">This is the exact crop that will show in the app.</p>
            </div>
            {avatarDataUrl ? (
              <button className="secondary-button" onClick={clearAvatar} type="button">
                Remove photo
              </button>
            ) : null}
          </div>

          <label>
            Bio
            <textarea onChange={(event) => setBio(event.target.value)} rows={5} value={bio} />
          </label>

          <div className="form-footer">
            <button className="primary-button" disabled={isSaving} type="submit">
              {isSaving ? "Saving profile..." : "Save profile"}
            </button>
            <p>Saving closes the editor and returns to your profile card.</p>
          </div>
        </form>
      ) : (
        <article className="panel account-summary-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Account profile</p>
              <h2>Your account details</h2>
              <p>Review your account card. Open the editor only when you need to make a change.</p>
            </div>
          </div>
          <div className="saved-value-grid">
            <SavedProfileValue label="Full name" value={name || currentUser.name} />
            <SavedProfileValue label="Email" value={currentUser.email} />
            <SavedProfileValue label="Phone" value={phone || currentUser.phone} />
            <SavedProfileValue label="Role" value={currentUser.role} />
          </div>
        </article>
      )}

      {message ? <p className="info-text profile-message">{message}</p> : null}

      {isPatientAccount ? (
        <section className="panel patient-office-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Connected offices</p>
              <h2>Manage offices</h2>
              <p>Archive offices you no longer use. Archived offices will not appear as active connections.</p>
            </div>
          </div>

          {activeOffices.length > 0 ? (
            <div className="saved-entry-list">
              {activeOffices.map((office) => (
                <div className="saved-entry-card active-office-card" key={office.practiceId}>
                  <div className="saved-section-header active-office-header">
                    <div>
                      <p className="saved-entry-title">{office.practiceName}</p>
                      <p className="saved-entry-subtitle">
                        Active since {formatProfileDate(office.lastVerifiedAt)}
                      </p>
                    </div>
                    <button className="edit-chip" onClick={() => archiveOffice(office.practiceId)} type="button">
                      Archive
                    </button>
                  </div>
                  {office.notes ? <p className="saved-entry-subtitle">{office.notes}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="saved-empty-state">No active offices yet.</p>
          )}
        </section>
      ) : null}
    </section>
  );
}

function getActiveOffices(vault: PatientVault, checkIns: ReturnType<typeof readCheckInsFromStorage>, shareLinks: ShareLinkRecord[]) {
  const officeMap = new Map<
    string,
    { practiceId: string; practiceName: string; lastVerifiedAt: string; notes: string }
  >();

  vault.officeConnections.forEach((entry) => {
    officeMap.set(entry.practiceId, entry);
  });

  checkIns.forEach((entry) => {
    const existing = officeMap.get(entry.practiceId);
    const nextDate =
      existing && new Date(existing.lastVerifiedAt).getTime() > new Date(entry.verifiedAt).getTime()
        ? existing.lastVerifiedAt
        : entry.verifiedAt;

    officeMap.set(entry.practiceId, {
      practiceId: entry.practiceId,
      practiceName: entry.practiceName,
      lastVerifiedAt: nextDate,
      notes: entry.notes || existing?.notes || ""
    });
  });

  shareLinks
    .filter((entry) => entry.status === "active" || entry.status === "used")
    .forEach((entry) => {
      const existing = officeMap.get(entry.practiceId);
      const nextDate =
        existing && new Date(existing.lastVerifiedAt).getTime() > new Date(entry.createdAt).getTime()
          ? existing.lastVerifiedAt
          : entry.createdAt;

      officeMap.set(entry.practiceId, {
        practiceId: entry.practiceId,
        practiceName: entry.practiceName,
        lastVerifiedAt: nextDate,
        notes: existing?.notes || ""
      });
    });

  return Array.from(officeMap.values()).sort(
    (a, b) => new Date(b.lastVerifiedAt).getTime() - new Date(a.lastVerifiedAt).getTime()
  );
}

function formatProfileDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function SavedProfileValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="saved-value-card">
      <p className="saved-value-label">{label}</p>
      <p className="saved-value-text">{value || "Not added"}</p>
    </div>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read the selected image."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });
}

function readImageSize(dataUrl: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("Unable to load the selected image."));
    image.src = dataUrl;
  });
}

function getCropPreviewStyle(
  naturalSize: { width: number; height: number },
  zoom: number,
  offset: { x: number; y: number }
) {
  const previewSize = 248;
  const scale = getCropScale(naturalSize, zoom, previewSize);

  return {
    height: `${naturalSize.height * scale}px`,
    left: `calc(50% + ${offset.x}px)`,
    top: `calc(50% + ${offset.y}px)`,
    transform: "translate(-50%, -50%)",
    width: `${naturalSize.width * scale}px`
  };
}

function getCropScale(naturalSize: { width: number; height: number }, zoom: number, outputSize: number) {
  return Math.max(outputSize / naturalSize.width, outputSize / naturalSize.height) * zoom;
}

function clampCropOffset(
  offset: { x: number; y: number },
  naturalSize: { width: number; height: number },
  zoom: number
) {
  const previewSize = 248;
  const scale = getCropScale(naturalSize, zoom, previewSize);
  const maxX = Math.max(0, (naturalSize.width * scale - previewSize) / 2);
  const maxY = Math.max(0, (naturalSize.height * scale - previewSize) / 2);

  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y))
  };
}

async function cropAvatarImage({
  dataUrl,
  naturalSize,
  offset,
  zoom
}: {
  dataUrl: string;
  naturalSize: { width: number; height: number };
  offset: { x: number; y: number };
  zoom: number;
}) {
  const outputSize = 512;
  const previewSize = 248;
  const image = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to prepare profile picture.");
  }

  const outputOffset = {
    x: (offset.x / previewSize) * outputSize,
    y: (offset.y / previewSize) * outputSize
  };
  const scale = getCropScale(naturalSize, zoom, outputSize);

  context.clearRect(0, 0, outputSize, outputSize);
  context.save();
  context.translate(outputSize / 2 + outputOffset.x, outputSize / 2 + outputOffset.y);
  context.drawImage(
    image,
    (-naturalSize.width * scale) / 2,
    (-naturalSize.height * scale) / 2,
    naturalSize.width * scale,
    naturalSize.height * scale
  );
  context.restore();

  return canvas.toDataURL("image/jpeg", 0.9);
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to crop the selected image."));
    image.src = dataUrl;
  });
}
