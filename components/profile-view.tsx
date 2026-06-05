"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
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
  const [isSaving, setIsSaving] = useState(false);
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
      setAvatarDataUrl(undefined);
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    setAvatarDataUrl(dataUrl);
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
        <button className="secondary-button profile-logout-button" onClick={handleSignOut} type="button">
          Log out
        </button>
      </article>

      <form className="panel form-card" onSubmit={handleSubmit}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Profile settings</p>
            <h2>{isPatientAccount ? "Update your account profile" : "Update your office profile"}</h2>
          </div>
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
          <span>This photo appears in your app header and profile views.</span>
        </label>

        <label>
          Bio
          <textarea onChange={(event) => setBio(event.target.value)} rows={5} value={bio} />
        </label>

        <div className="form-footer">
          <button className="primary-button" disabled={isSaving} type="submit">
            {isSaving ? "Saving profile..." : "Save profile"}
          </button>
          <p>Changes save to the signed-in ClearPath profile used by this pilot.</p>
        </div>

        {message ? <p className="info-text">{message}</p> : null}
      </form>

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
