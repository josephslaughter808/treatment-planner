"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { readTimelineFromStorage, type TimelineEvent } from "@/lib/patient-vault";

export function PatientPackageView() {
  const { currentUser } = useAuth();
  const timeline = readTimelineFromStorage();

  const activeDiagnoses = currentUser?.email
    ? timeline.filter(
        (event): event is Extract<TimelineEvent, { type: "diagnosis" }> =>
          event.type === "diagnosis" &&
          event.patientEmail.toLowerCase() === currentUser.email.toLowerCase()
      )
    : [];

  if (!activeDiagnoses.length) {
    return (
      <section className="panel patient-care-empty">
        <div className="patient-care-hero patient-care-hero-empty">
          <p className="eyebrow">My care</p>
          <h2>No active diagnosis</h2>
          <p className="lede">
            Your care page will appear here whenever your office sends a diagnosis and treatment explanation for you to review.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="patient-care-space">
      <section className="panel patient-care-hero">
        <p className="eyebrow">My care</p>
        <h2>Your treatment should feel easier to understand than it does right now.</h2>
        <p className="lede">
          Review your diagnosis, understand what your provider found, and open the treatment explanation whenever you&apos;re ready.
        </p>
        <div className="patient-care-pill-row">
          <span>What this means</span>
          <span>What happens next</span>
          <span>How recovery feels</span>
        </div>
      </section>

      <div className="diagnosis-card-list patient-diagnosis-card-list">
        {activeDiagnoses.map((event) => (
          <Link className="diagnosis-card patient-diagnosis-card" href={`/patient/diagnosis/${event.id}`} key={event.id}>
            <div>
              <h3>{event.diagnosisLabel}</h3>
              <p className="diagnosis-subtitle">{event.commonName}</p>
              <p className="diagnosis-descriptor">{event.descriptor}</p>
            </div>
            <span className="patient-diagnosis-link">Open care page</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
