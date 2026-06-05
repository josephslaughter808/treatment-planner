import { AppShell } from "@/components/app-shell";
import { PatientShareView } from "@/components/patient-share-view";

export default function SharePage() {
  return (
    <AppShell
      audience="patient"
      description="Show a QR check-in pass so an office can request your medical history and insurance updates."
      pageLabel="Patient share"
      title="Share medical history"
    >
      <PatientShareView />
    </AppShell>
  );
}
