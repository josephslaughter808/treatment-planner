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
      <section className="panel empty-state">
        <h3>No active diagnosis</h3>
        <p>You&apos;re doing well.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Active diagnosis</p>
          <h2>My care</h2>
        </div>
      </div>

      <div className="diagnosis-card-list">
        {activeDiagnoses.map((event) => (
          <Link className="diagnosis-card" href={`/patient/diagnosis/${event.id}`} key={event.id}>
            <div>
              <h3>{event.diagnosisLabel}</h3>
              <p className="diagnosis-subtitle">{event.commonName}</p>
              <p className="diagnosis-descriptor">{event.descriptor}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
