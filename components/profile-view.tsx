"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AvatarBadge } from "@/components/avatar-badge";
import { useAuth } from "@/components/auth-provider";
import { practicesById } from "@/lib/clinical-catalog";

export function ProfileView() {
  const { currentUser, updateProfile } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [name, setName] = useState(currentUser?.name ?? "");
  const [title, setTitle] = useState(currentUser?.title ?? "");
  const [phone, setPhone] = useState(currentUser?.phone ?? "");
  const [bio, setBio] = useState(currentUser?.bio ?? "");
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>(currentUser?.avatarDataUrl);
  const [isSaving, setIsSaving] = useState(false);

  if (!currentUser) {
    return (
      <section className="panel empty-state">
        <p className="mini-label">Profile access</p>
        <h3>Log in to edit a profile</h3>
        <p>This page is for office users. Sign in first so you can manage the profile and photo that appear across the workspace.</p>
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

  return (
    <section className="grid profile-layout">
      <article className="panel profile-card">
        <AvatarBadge
          accentColor={currentUser.avatarColor}
          imageUrl={avatarDataUrl}
          name={name || currentUser.name}
          size="lg"
        />
        <div>
          <p className="mini-label">Live profile card</p>
          <h2>{name || currentUser.name}</h2>
          <p>{title || currentUser.title}</p>
          <p className="catalog-note">{practicesById[currentUser.practiceId]?.name}</p>
          <p className="catalog-note">{currentUser.email}</p>
          <p className="catalog-note">{phone || currentUser.phone}</p>
        </div>
      </article>

      <form className="panel" onSubmit={handleSubmit}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Profile settings</p>
            <h2>Update your office profile</h2>
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
          <span>This photo will be used in the app header, team directory, and office profile views.</span>
        </label>

        <label>
          Bio
          <textarea onChange={(event) => setBio(event.target.value)} rows={5} value={bio} />
        </label>

        <div className="form-footer">
          <button className="primary-button" disabled={isSaving} type="submit">
            {isSaving ? "Saving profile..." : "Save profile"}
          </button>
          <p>These profile edits are local prototype data for now and are ready to move to Supabase later.</p>
        </div>

        {message ? <p className="info-text">{message}</p> : null}
      </form>
    </section>
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
