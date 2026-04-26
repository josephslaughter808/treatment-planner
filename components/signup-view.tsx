"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { practiceCatalog } from "@/lib/clinical-catalog";
import { roles, type UserRole } from "@/lib/account-directory";

export function SignupView() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [practiceId, setPracticeId] = useState(practiceCatalog[0]?.id ?? "");
  const [role, setRole] = useState<UserRole>("front-desk");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);

    const result = await signUp({
      name,
      email,
      password,
      practiceId,
      role,
      title,
      phone,
      bio,
      avatarDataUrl
    });

    setMessage(result.message);
    if (result.ok) {
      router.push("/profile");
    }
    setIsSubmitting(false);
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Create office account</p>
          <h2>Set up a provider, front desk, or admin login</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid two-up">
          <label>
            Full name
            <input onChange={(event) => setName(event.target.value)} value={name} />
          </label>
          <label>
            Email
            <input onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
          </label>
        </div>

        <div className="grid two-up">
          <label>
            Password
            <input
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>
          <label>
            Practice
            <select onChange={(event) => setPracticeId(event.target.value)} value={practiceId}>
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
            Role
            <select onChange={(event) => setRole(event.target.value as UserRole)} value={role}>
              {roles.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Title
            <input
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Treatment coordinator"
              value={title}
            />
          </label>
        </div>

        <div className="grid two-up">
          <label>
            Phone
            <input
              onChange={(event) => setPhone(event.target.value)}
              placeholder="(555) 000-0000"
              value={phone}
            />
          </label>
          <label className="upload-field">
            Profile picture
            <input
              accept="image/*"
              onChange={(event) => handleAvatarChange(event.target.files?.[0] ?? null)}
              type="file"
            />
            <span>Upload a headshot or team photo for the office directory and profile card.</span>
          </label>
        </div>

        <label>
          Bio
          <textarea
            onChange={(event) => setBio(event.target.value)}
            placeholder="Short role description for the office directory."
            rows={4}
            value={bio}
          />
        </label>

        <div className="form-footer">
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
          <p>This prototype stores office accounts locally in the browser until Supabase auth is wired in.</p>
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
