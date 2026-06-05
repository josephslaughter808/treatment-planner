"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import clearPathLogo from "@/ClearPath-Care-logo.png";
import { AvatarBadge } from "@/components/avatar-badge";
import { useAuth } from "@/components/auth-provider";
import { isPatientRole, isProviderWorkspaceRole, type UserRole } from "@/lib/account-directory";

type NavIconName = "patients" | "health" | "family" | "documents" | "share" | "scan" | "account";

type NavItem = {
  href: string;
  label: string;
  mobileLabel?: string;
  icon: NavIconName;
  activePaths?: string[];
};

const providerNavItems: NavItem[] = [
  { href: "/", label: "Check-in", icon: "patients", activePaths: ["/", "/check-in"] },
  { href: "/new-patient", label: "New Patient", icon: "scan" }
];

const patientNavItems: NavItem[] = [
  { href: "/vault", label: "Health Profile", mobileLabel: "Health", icon: "health" },
  { href: "/family", label: "Family", icon: "family" },
  { href: "/documents", label: "Documents", mobileLabel: "Docs", icon: "documents" },
  { href: "/share", label: "Share", icon: "share" },
  { href: "/profile", label: "Account", icon: "account" }
];

type AppShellProps = {
  pageLabel: string;
  title: string;
  description: string;
  children: ReactNode;
  audience?: "provider" | "patient" | "public" | "shared";
  hidePageBanner?: boolean;
};

export function AppShell({
  pageLabel,
  title,
  description,
  children,
  audience = "provider",
  hidePageBanner = false
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isReady } = useAuth();
  const [isDesktopViewport, setIsDesktopViewport] = useState(true);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (audience === "public") {
      return;
    }

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    if (audience === "provider" && !isProviderWorkspaceRole(currentUser.role)) {
      router.replace("/patient");
      return;
    }

    if (audience === "patient" && !isPatientRole(currentUser.role)) {
      router.replace("/");
    }
  }, [audience, currentUser, isReady, router]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncViewport = () => {
      setIsDesktopViewport(window.innerWidth >= 1080);
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  if (!isReady && audience !== "public") {
    return <main className="shell loading-shell"><section className="panel">Loading ClearPath Care...</section></main>;
  }

  if (audience !== "public" && !currentUser) {
    return (
      <main className="shell auth-required-shell">
        <section className="panel auth-required-card">
          <p className="eyebrow">Sign in required</p>
          <h1>Open your ClearPath account first.</h1>
          <p>
            This page needs an active patient or provider session. Sign in again and ClearPath will take you
            back into the correct workspace.
          </p>
          <Link className="primary-button" href="/login">
            Go to sign in
          </Link>
        </section>
      </main>
    );
  }

  if (
    currentUser &&
    ((audience === "provider" && !isProviderWorkspaceRole(currentUser.role)) ||
      (audience === "patient" && !isPatientRole(currentUser.role)))
  ) {
    return (
      <main className="shell auth-required-shell">
        <section className="panel auth-required-card">
          <p className="eyebrow">Wrong workspace</p>
          <h1>This account does not have access here.</h1>
          <p>
            You are signed in, but this page belongs to a different workspace. Use the button below to return
            to the correct side of ClearPath.
          </p>
          <Link className="primary-button" href={isPatientRole(currentUser.role) ? "/patient" : "/"}>
            Go to my workspace
          </Link>
        </section>
      </main>
    );
  }

  const resolvedAudience = resolveAudience(audience, currentUser?.role);
  const desktopOnlyProvider = resolvedAudience === "provider" && audience !== "public";
  const navItems = resolvedAudience === "patient" ? patientNavItems : providerNavItems;
  const eyebrow = resolvedAudience === "patient" ? "Patient app" : "Provider workspace";
  const shellClassName = [
    "shell",
    "shell-with-nav",
    resolvedAudience === "patient" ? "patient-app-shell" : "provider-app-shell",
    audience === "public" ? "public-app-shell" : ""
  ]
    .filter(Boolean)
    .join(" ");

  if (audience === "public") {
    return (
      <main className={shellClassName}>
        <section className="public-auth-header">
          <Link className="brand-lockup brand-link" href="/login">
            <Image alt="ClearPath Care logo" className="brand-logo" priority src={clearPathLogo} />
            <div>
              <p className="eyebrow">{pageLabel}</p>
              <p className="brand-name">ClearPath Care</p>
            </div>
          </Link>
          <div className="public-auth-copy">
            <h1 className="page-title">{title}</h1>
            <p className="lede">{description}</p>
            <p className="catalog-note">
              {pathname === "/signup"
                ? "Use the same email address your office used for your invite so your profile can be matched correctly."
                : "Office accounts are approved and provisioned by ClearPath. Patient access stays limited to patient pages only."}
            </p>
          </div>
        </section>

        {children}
      </main>
    );
  }

  if (desktopOnlyProvider && !isDesktopViewport) {
    return (
      <main className={shellClassName}>
        <section className="panel provider-desktop-locked">
          <p className="eyebrow">Provider workspace</p>
          <h1 className="page-title">Desktop access required</h1>
          <p className="lede">
            The provider program is designed for desktop check-in work only. Please open ClearPath Care on a desktop or laptop to review medical history and insurance updates.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className={shellClassName}>
      <header className="topbar">
        <div className="topbar-brand">
          <Link className="brand-lockup brand-link" href={resolvedAudience === "patient" ? "/patient" : "/"}>
            <Image alt="ClearPath Care logo" className="brand-logo topbar-logo" priority src={clearPathLogo} />
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <p className="brand-name">ClearPath Care</p>
            </div>
          </Link>
          <nav className="topnav" aria-label="Primary navigation">
            {navItems.map((item) => {
              const active = isNavItemActive(pathname, item);
              return (
                <Link
                  className={`topnav-link ${active ? "active" : ""}`}
                  href={item.href}
                  key={item.href}
                >
                  <NavIcon name={item.icon} />
                  <span className="nav-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="topbar-user">
          {currentUser ? (
            <>
              <div className="user-copy">
                <Link className="user-profile-link" href="/profile">
                  {currentUser.name}
                </Link>
                <span>
                  {currentUser.title} • {currentUser.role}
                </span>
              </div>
              <AvatarBadge
                accentColor={currentUser.avatarColor}
                imageUrl={currentUser.avatarDataUrl}
                name={currentUser.name}
                size="sm"
              />
            </>
          ) : (
            <div className="auth-actions">
              <Link className="secondary-link" href="/login">
                Log in
              </Link>
            </div>
          )}
        </div>
      </header>

      <section className="app-utility-bar" aria-label="Workspace tools">
        {resolvedAudience === "provider" ? (
          <div className="provider-utility-copy">
            <span>{pageLabel}</span>
            <strong>{title}</strong>
          </div>
        ) : null}
        <div className="utility-actions">
          <span className="sync-status">Sync: Live</span>
          <Link className="primary-button" href={resolvedAudience === "patient" ? "/vault" : "/"}>
            {resolvedAudience === "patient" ? "Update profile" : "Open check-in"}
          </Link>
        </div>
      </section>

      {!hidePageBanner ? (
        <section className="page-banner">
          <p className="eyebrow">{pageLabel}</p>
          <h1 className="page-title">{title}</h1>
          <p className="lede">{description}</p>
        </section>
      ) : null}

      <section className="shell-content">{children}</section>

      {resolvedAudience === "patient" ? (
        <nav className="mobile-tabbar" aria-label="Mobile navigation">
          {navItems.map((item) => {
            const active = isNavItemActive(pathname, item);
            return (
              <Link className={`mobile-tab ${active ? "active" : ""}`} href={item.href} key={item.href}>
                <NavIcon name={item.icon} />
                <span>{item.mobileLabel ?? item.label}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </main>
  );
}

function isNavItemActive(pathname: string, item: NavItem) {
  const activePaths = item.activePaths ?? [item.href];
  return activePaths.some((path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)));
}

function NavIcon({ name }: { name: NavIconName }) {
  if (name === "patients") {
    return (
      <svg aria-hidden="true" className="nav-icon" fill="none" viewBox="0 0 24 24">
        <path d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M2.5 21a5.5 5.5 0 0 1 11 0" />
        <path d="M17 10a3 3 0 1 0 0-6" />
        <path d="M15.5 15.5A4.5 4.5 0 0 1 21.5 21" />
      </svg>
    );
  }

  if (name === "health") {
    return (
      <svg aria-hidden="true" className="nav-icon" fill="none" viewBox="0 0 24 24">
        <path d="M12 21s-8-4.7-8-11a4.8 4.8 0 0 1 8-3.6A4.8 4.8 0 0 1 20 10c0 6.3-8 11-8 11Z" />
        <path d="M8 12h2.5l1.2-3 2.1 6 1.2-3H17" />
      </svg>
    );
  }

  if (name === "family") {
    return (
      <svg aria-hidden="true" className="nav-icon" fill="none" viewBox="0 0 24 24">
        <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M15.5 10a3 3 0 1 0 0-6" />
        <path d="M3 21a6 6 0 0 1 12 0" />
        <path d="M14.5 15.5A5 5 0 0 1 21 21" />
      </svg>
    );
  }

  if (name === "documents") {
    return (
      <svg aria-hidden="true" className="nav-icon" fill="none" viewBox="0 0 24 24">
        <path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M14 3v5h5" />
        <path d="M8 13h8" />
        <path d="M8 17h6" />
      </svg>
    );
  }

  if (name === "share") {
    return (
      <svg aria-hidden="true" className="nav-icon" fill="none" viewBox="0 0 24 24">
        <path d="M6 6h4v4H6z" />
        <path d="M14 6h4v4h-4z" />
        <path d="M6 14h4v4H6z" />
        <path d="M14 14h1.5" />
        <path d="M18 14v4" />
        <path d="M14 18h4" />
      </svg>
    );
  }

  if (name === "scan") {
    return (
      <svg aria-hidden="true" className="nav-icon" fill="none" viewBox="0 0 24 24">
        <path d="M4 8V5a1 1 0 0 1 1-1h3" />
        <path d="M16 4h3a1 1 0 0 1 1 1v3" />
        <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
        <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
        <path d="M8 8h8v8H8z" />
        <path d="M11 11h2v2h-2z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="nav-icon" fill="none" viewBox="0 0 24 24">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function resolveAudience(
  audience: AppShellProps["audience"],
  role: UserRole | undefined
): "provider" | "patient" {
  if (audience === "patient") {
    return "patient";
  }

  if (audience === "shared") {
    return role && isPatientRole(role) ? "patient" : "provider";
  }

  return "provider";
}
