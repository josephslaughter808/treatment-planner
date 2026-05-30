"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/components/auth-provider";

export function SignupView() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const result = await signUp({
      name,
      email,
      password,
      practiceId: "clearpath-default",
      role: "patient",
      title: "Patient",
      phone,
      bio: accessCode.trim() ? `Pilot access code: ${accessCode.trim()}` : ""
    });

    setMessage(result.message);
    if (result.ok) {
      router.push(result.redirectTo || "/vault");
    }
    setIsSubmitting(false);
  }

  return (
    <section className="grid login-layout patient-signup-layout">
      <form className="panel" onSubmit={handleSubmit}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Patient account</p>
          <h2>Set up your health profile</h2>
        </div>
      </div>

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
            Phone
            <input
              autoComplete="tel"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="(555) 000-0000"
              value={phone}
            />
          </label>
        </div>

        <label>
            Access code from your office
            <input
              autoCapitalize="characters"
              onChange={(event) => setAccessCode(event.target.value)}
              placeholder="Optional"
              value={accessCode}
            />
            <span className="field-help">If your office gave you a code, keep it here so they can match your profile quickly.</span>
        </label>

        <div className="form-footer">
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating account..." : "Create patient account"}
          </button>
          <p>After this, you will update medical history, medications, allergies, emergency contact, and insurance.</p>
        </div>

        {message ? <p className="info-text">{message}</p> : null}
      </form>

      <section className="panel patient-signup-guide">
        <p className="eyebrow">What happens next</p>
        <h2>A few minutes now saves time at check-in.</h2>
        <div className="dialogue-list">
          <div className="dialogue-card">
            <h4>1. Create your account</h4>
            <p>Use the same email address your office used for your invite.</p>
          </div>
          <div className="dialogue-card">
            <h4>2. Update your health profile</h4>
            <p>Add medical conditions, medications, allergies, emergency contact, and insurance.</p>
          </div>
          <div className="dialogue-card">
            <h4>3. Save before your visit</h4>
            <p>Your office can review the saved profile before or during check-in.</p>
          </div>
        </div>
      </section>
    </section>
  );
}
