"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { demoAccounts, isPatientRole } from "@/lib/account-directory";

export function LoginView() {
  const router = useRouter();
  const { authMode, signIn } = useAuth();
  const isAuthConfigured = authMode !== "unconfigured";
  const [email, setEmail] = useState(authMode === "local" ? (demoAccounts[0]?.email ?? "") : "");
  const [password, setPassword] = useState(authMode === "local" ? "clearpath123" : "");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuthConfigured) {
      setMessage("Production auth is not configured yet. Add Supabase environment variables before pilot use.");
      return;
    }

    setIsSubmitting(true);
    const result = await signIn({ email, password });
    setMessage(result.message);

    if (result.ok) {
      router.push(result.redirectTo || "/");
    }

    setIsSubmitting(false);
  }

  function selectDemoAccount(nextEmail: string) {
    setEmail(nextEmail);
    setPassword("clearpath123");
  }

  return (
    <section className="grid login-layout">
      <form className="panel" onSubmit={handleSubmit}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Secure access</p>
            <h2>Sign in to ClearPath Care</h2>
          </div>
        </div>

        <label>
          Email
          <input
            disabled={!isAuthConfigured}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
          />
        </label>

        <label>
          Password
          <input
            disabled={!isAuthConfigured}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
        </label>

        <div className="form-footer">
          <button className="primary-button" disabled={isSubmitting || !isAuthConfigured} type="submit">
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
          <p>
            {isAuthConfigured
              ? "Provider and patient logins land in different app experiences automatically."
              : "Supabase must be connected before this production pilot can accept logins."}
          </p>
        </div>

        {message ? <p className="info-text">{message}</p> : null}

        <p className="catalog-note">
          Pilot access is provisioned by ClearPath for the participating office.
        </p>
      </form>

      {authMode === "local" ? (
        <section className="panel">
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
      ) : (
        <section className="panel">
          <p className="eyebrow">Production auth</p>
          <h2>{isAuthConfigured ? "Supabase connected" : "Supabase setup required"}</h2>
          <p>
            {isAuthConfigured
              ? "Use the account provisioned for the pilot office or patient."
              : "Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in Vercel, then redeploy."}
          </p>
        </section>
      )}
    </section>
  );
}
