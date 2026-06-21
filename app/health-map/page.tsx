import { AppShell } from "@/components/app-shell";
import { PatientBodyView } from "@/components/patient-body-view";

export default function HealthMapPage() {
  return (
    <AppShell
      audience="patient"
      description="Explore current and past conditions by body region, source, treatment, and date."
      pageLabel="Health overview"
      title="My health map"
    >
      <PatientBodyView />
    </AppShell>
  );
}
