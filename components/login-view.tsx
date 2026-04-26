"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { demoAccounts } from "@/lib/account-directory";

export function LoginView() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState(demoAccounts[0]?.email ?? "");
  const [password, setPassword] = useState("clearpath123");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await signIn({ email, password });
    setMessage(result.message);

    if (result.ok) {
      router.push("/");
    }

    setIsSubmitting(false);
  }

  return (
    <section className="grid login-layout">
      <form className="panel" onSubmit={handleSubmit}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Office access</p>
            <h2>Sign in to the provider workspace</h2>
          </div>
        </div>

        <label>
          Email
          <input onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
        </label>

        <label>
          Password
          <input
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
        </label>

        <div className="form-footer">
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
          <p>Use a demo account below or create a new office user profile for testing.</p>
        </div>

        {message ? <p className="info-text">{message}</p> : null}

        <p className="catalog-note">
          Need a new office user? <Link href="/signup">Create an account</Link>.
        </p>
      </form>

      <section className="panel">
        <p className="eyebrow">Demo users</p>
        <h2>Ready-to-test office accounts</h2>
        <div className="dialogue-list">
          {demoAccounts.map((account) => (
            <div className="dialogue-card" key={account.id}>
              <h4>{account.name}</h4>
              <p>{account.title}</p>
              <p>
                <strong>Email:</strong> {account.email}
              </p>
              <p>
                <strong>Password:</strong> clearpath123
              </p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
