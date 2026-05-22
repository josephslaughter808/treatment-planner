"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import clearPathLogo from "@/ClearPath-Care-logo.png";
import { AvatarBadge } from "@/components/avatar-badge";
import { useAuth } from "@/components/auth-provider";
import { isPatientRole, isProviderWorkspaceRole, type UserRole } from "@/lib/account-directory";

const providerNavItems = [
  { href: "/", label: "Check-in" },
  { href: "/team", label: "Team" },
  { href: "/settings", label: "Settings" }
];

const patientNavItems = [
  { href: "/vault", label: "Health Profile" },
  { href: "/profile", label: "Account" }
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
    return null;
  }

  if (
    currentUser &&
    ((audience === "provider" && !isProviderWorkspaceRole(currentUser.role)) ||
      (audience === "patient" && !isPatientRole(currentUser.role)))
  ) {
    return null;
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
              Office accounts are approved and provisioned by ClearPath. Patient access stays limited to patient pages only.
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
            <Image alt="ClearPath Care logo" className="brand-logo topbar-logo" height={56} priority src="/clearpath-silhouette-logo.svg" width={56} />
            <div>
              <p className="eyebrow">{eyebrow}</p>
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
            const active = pathname === item.href;
            return (
              <Link className={`mobile-tab ${active ? "active" : ""}`} href={item.href} key={item.href}>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </main>
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
