"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import clearPathLogo from "@/ClearPath-Care-logo.png";
import { useAuth } from "@/components/auth-provider";
import { demoAccounts, isPatientRole } from "@/lib/account-directory";

export function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authMode, signIn } = useAuth();
  const isAuthConfigured = authMode !== "unconfigured";
  const [email, setEmail] = useState(searchParams.get("email") || (authMode === "local" ? (demoAccounts[0]?.email ?? "") : ""));
  const [password, setPassword] = useState(authMode === "local" ? "clearpath123" : "");
  const [message, setMessage] = useState<string | null>(() => getLoginErrorMessage(searchParams.get("error")));
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitLogin() {
    if (!isAuthConfigured) {
      setMessage("Account access is not configured yet. Add Supabase environment variables before pilot use.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signIn({ email, password });
      setMessage(result.message);

      if (result.ok) {
        router.push(result.redirectTo || "/");
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Login could not finish. Please try again in a moment."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitLogin();
  }

  function selectDemoAccount(nextEmail: string) {
    setEmail(nextEmail);
    setPassword("clearpath123");
  }

  return (
    <section className="clearpath-landing">
      <section className="landing-hero-card">
        <div className="landing-brand-row">
          <Image alt="ClearPath Care logo" className="landing-logo" priority src={clearPathLogo} />
          <div>
            <p className="eyebrow">ClearPath Care</p>
            <strong>One profile. Every visit.</strong>
          </div>
        </div>

        <div className="landing-hero-copy">
          <p className="landing-kicker">For Patients</p>
          <h2>Never fill out another medical history form again.</h2>
          <p>
            Build one guided health profile, keep it current, and share the right information with an office
            when you check in. Medications, allergies, medical history, insurance, emergency contacts, documents,
            and dependents stay organized in one place.
          </p>
        </div>

        <div className="wallet-tap-scene" aria-label="Patient tapping a phone wallet pass at check-in">
          <div className="wallet-phone">
            <div className="phone-speaker" />
            <div className="wallet-pass-card">
              <span>ClearPath Pass</span>
              <strong>Michael S.</strong>
              <small>Medical history ready</small>
            </div>
          </div>
          <div className="tap-terminal">
            <span className="terminal-light" />
            <strong>Tap to share</strong>
            <small>Office check-in</small>
          </div>
          <div className="tap-rings">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="landing-benefit-grid">
          <article>
            <span>01</span>
            <strong>Answer once</strong>
            <p>Use a guided questionnaire instead of starting over at every new office.</p>
          </article>
          <article>
            <span>02</span>
            <strong>Update anytime</strong>
            <p>Change medications, allergies, insurance, documents, and family profiles before appointments.</p>
          </article>
          <article>
            <span>03</span>
            <strong>Share intentionally</strong>
            <p>Use a QR code or wallet-style code so participating offices can review the current version.</p>
          </article>
        </div>
      </section>

      <aside className="landing-access-column">
        <form
          action={authMode === "local" ? "/api/auth/local-sign-in" : "/api/auth/sign-in"}
          className="panel landing-login-card"
          method="post"
          onSubmit={handleSubmit}
        >
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Secure access</p>
              <h2>Open your account</h2>
              <p>Patients can create an account before any visit. Office accounts are verified by ClearPath.</p>
            </div>
          </div>

          <label>
            Email
            <input
              disabled={!isAuthConfigured}
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </label>

          <label>
            Password
            <input
              disabled={!isAuthConfigured}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>

          <div className="form-footer">
            <button
              className="primary-button"
              disabled={isSubmitting || !isAuthConfigured}
              type="submit"
            >
              {isSubmitting ? "Logging in..." : "Log in"}
            </button>
            <Link className="secondary-button" href="/signup">
              Create Patient Access
            </Link>
            <p>
              {isAuthConfigured
                ? "Provider and patient logins land in different app experiences automatically."
                : "Supabase must be connected before this production pilot can accept logins."}
            </p>
          </div>

          {message ? <p className="info-text">{message}</p> : null}

          <p className="catalog-note">
            Patients can create a ClearPath account before any visit. Office accounts are provisioned by ClearPath.
          </p>
        </form>

        <section className="panel provider-access-card">
          <p className="eyebrow">For offices</p>
          <h2>Provider access is verified.</h2>
          <p>
            Offices should not be able to create unrestricted provider accounts from the public website.
            Provider access should be tied to a paid, verified practice subscription before staff can review patient data.
          </p>
          <Link className="secondary-button" href="/login">
            Provider onboarding coming soon
          </Link>
        </section>

        {authMode === "local" ? (
          <section className="panel landing-demo-card">
            <p className="eyebrow">Demo users</p>
            <h2>Tap a test account</h2>
            <div className="dialogue-list">
              {demoAccounts.map((account) => (
                <div className="dialogue-card" key={account.id}>
                  <h4>{account.name}</h4>
                  <p>
                    {account.title}
                    {isPatientRole(account.role) ? " • patient app" : " • provider app"}
                  </p>
                  <p>
                    <strong>Email:</strong> {account.email}
                  </p>
                  <button className="secondary-button" onClick={() => selectDemoAccount(account.email)} type="button">
                    Use this account
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </aside>
    </section>
  );
}

function getLoginErrorMessage(error: string | null) {
  if (error === "invalid-login") {
    return "We could not find a ClearPath account with that email and password.";
  }
  if (error === "profile-unavailable") {
    return "Your login worked, but ClearPath could not load your profile yet.";
  }
  if (error === "auth-unavailable") {
    return "ClearPath account access is temporarily unavailable.";
  }
  return null;
}
