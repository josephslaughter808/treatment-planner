"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import clearPathLogo from "@/ClearPath-Care-logo.png";
import { AvatarBadge } from "@/components/avatar-badge";
import { useAuth } from "@/components/auth-provider";

const navItems = [
  { href: "/", label: "Cases" },
  { href: "/vault", label: "Vault" },
  { href: "/check-in", label: "Check-In" },
  { href: "/emergency", label: "Emergency" },
  { href: "/team", label: "Team" },
  { href: "/settings", label: "Settings" },
  { href: "/profile", label: "Profile" },
  { href: "/patient", label: "Patient View" }
];

type AppShellProps = {
  pageLabel: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function AppShell({ pageLabel, title, description, children }: AppShellProps) {
  const pathname = usePathname();
  const { currentUser, isReady, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
  }

  return (
    <main className="shell shell-with-nav">
      <header className="topbar panel">
        <div className="topbar-brand">
          <Link className="brand-lockup brand-link" href="/">
            <Image alt="ClearPath Care logo" className="brand-logo" priority src={clearPathLogo} />
            <div>
              <p className="eyebrow">Provider workspace</p>
              <p className="brand-name">ClearPath Care</p>
            </div>
          </Link>
          <nav className="topnav" aria-label="Primary navigation">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  className={`topnav-link ${active ? "active" : ""}`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="topbar-user">
          {currentUser ? (
            <>
              <AvatarBadge
                accentColor={currentUser.avatarColor}
                imageUrl={currentUser.avatarDataUrl}
                name={currentUser.name}
                size="sm"
              />
              <div className="user-copy">
                <strong>{currentUser.name}</strong>
                <span>
                  {currentUser.title} • {currentUser.role}
                </span>
              </div>
              <button className="ghost-button" onClick={handleSignOut} type="button">
                Sign out
              </button>
            </>
          ) : isReady ? (
            <div className="auth-actions">
              <Link className="secondary-link" href="/login">
                Log in
              </Link>
              <Link className="primary-link" href="/signup">
                Create account
              </Link>
            </div>
          ) : null}
        </div>
      </header>

      <section className="panel page-banner">
        <p className="eyebrow">{pageLabel}</p>
        <h1 className="page-title">{title}</h1>
        <p className="lede">{description}</p>
        {!currentUser ? (
          <p className="catalog-note">
            This prototype uses local demo auth until Supabase auth is connected. Sign in to test
            provider, front desk, and admin flows.
          </p>
        ) : null}
      </section>

      {children}
    </main>
  );
}
