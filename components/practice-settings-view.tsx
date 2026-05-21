"use client";

import Image from "next/image";
import clearPathLogo from "@/ClearPath-Care-logo.png";
import { useAuth } from "@/components/auth-provider";
import { practiceCatalog } from "@/lib/clinical-catalog";
import { softwareCatalog } from "@/lib/software-sync";

export function PracticeSettingsView() {
  const { currentUser } = useAuth();
  const practice = practiceCatalog.find(
    (entry) => entry.id === (currentUser?.practiceId ?? practiceCatalog[0]?.id ?? "")
  );

  return (
    <>
      <section className="panel patient-hero">
        <div className="brand-lockup">
          <Image alt="ClearPath Care logo" className="brand-logo" priority src={clearPathLogo} />
          <div>
            <p className="eyebrow">Practice settings</p>
            <p className="brand-name">ClearPath Care</p>
          </div>
        </div>
        <h1 className="patient-title">Medical check-in setup</h1>
        <p className="lede">
          Use settings for office identity, connector planning, and the first launch workflow: medical history and insurance updates.
        </p>
        {practice ? <p className="catalog-note">Signed in practice: {practice.name}</p> : null}
      </section>

      <section className="panel">
        <div className="dialogue-list">
          <article className="dialogue-card">
            <h4>Office identity</h4>
            <p>{practice?.name || "Practice not selected"}</p>
            <p>{practice?.description || "Office profile description not entered yet."}</p>
          </article>
          <article className="dialogue-card">
            <h4>Launch focus</h4>
            <p>
              Medical history, medication, allergy, and insurance confirmation.
            </p>
            <p>{practice?.brandNote || "No practice brand note set yet."}</p>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Software links</p>
            <h2>Link dental software</h2>
          </div>
        </div>

        <p className="lede">
          ClearPath should hand off tapped medical-history updates to the dental software, not store that history inside the provider workspace. This is where the office will manage those software connections.
        </p>

        <div className="dialogue-list">
          {softwareCatalog.map((software) => (
            <article className="dialogue-card" key={software.id}>
              <h4>{software.label}</h4>
              <p>{software.note}</p>
              <p className="catalog-note">Status: connector planning</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
