"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AvatarBadge } from "@/components/avatar-badge";
import { useAuth } from "@/components/auth-provider";
import { type AccountProfile, getAccountsForPractice } from "@/lib/account-directory";
import { practicesById } from "@/lib/clinical-catalog";

export function TeamDirectoryView() {
  const { currentUser, accounts, authMode } = useAuth();
  const [serverTeam, setServerTeam] = useState<AccountProfile[] | null>(null);

  useEffect(() => {
    if (!currentUser || authMode !== "supabase") {
      return;
    }
    const practiceId = currentUser.practiceId;

    let active = true;

    async function loadTeam() {
      const response = await fetch(`/api/team?practiceId=${encodeURIComponent(practiceId)}`);
      const data = (await response.json()) as { profiles?: AccountProfile[]; error?: string };
      if (!active || !response.ok) {
        return;
      }

      setServerTeam(data.profiles || []);
    }

    void loadTeam();
    return () => {
      active = false;
    };
  }, [authMode, currentUser]);

  const team = useMemo(
    () =>
      currentUser
        ? authMode === "supabase" && serverTeam && serverTeam.length > 0
          ? serverTeam
          : getAccountsForPractice(currentUser.practiceId, accounts)
        : [],
    [accounts, authMode, currentUser, serverTeam]
  );

  if (!currentUser) {
    return (
      <section className="panel empty-state">
        <p className="mini-label">Office directory</p>
        <h3>Log in to view your practice team</h3>
        <p>The directory follows the signed-in practice so front desk users and providers can stay in the right office context.</p>
        <Link className="primary-link" href="/login">
          Go to login
        </Link>
      </section>
    );
  }

  const practice = practicesById[currentUser.practiceId];
  const providerCount = team.filter((member) => member.role === "provider").length;

  return (
    <section className="grid team-layout">
      <article className="panel">
        <p className="eyebrow">Practice summary</p>
        <h2>{practice?.name}</h2>
        <p>{practice?.description}</p>
        <div className="stats-grid">
          <div className="stat-card">
            <strong>{team.length}</strong>
            <span>Office accounts</span>
          </div>
          <div className="stat-card">
            <strong>{providerCount}</strong>
            <span>Providers</span>
          </div>
          <div className="stat-card">
            <strong>{practice?.defaultPackageSource === "custom" ? "Custom" : "Library"}</strong>
            <span>Default package mode</span>
          </div>
        </div>
      </article>

      <article className="panel">
        <p className="eyebrow">Team profiles</p>
        <div className="team-grid">
          {team.map((member) => (
            <div className="team-card" key={member.id}>
              <AvatarBadge
                accentColor={member.avatarColor}
                imageUrl={member.avatarDataUrl}
                name={member.name}
                size="md"
              />
              <div>
                <h3>{member.name}</h3>
                <p>{member.title}</p>
                <p className="catalog-note">{member.role}</p>
                <p className="catalog-note">{member.email}</p>
                <p className="catalog-note">{member.phone}</p>
                <p>{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
