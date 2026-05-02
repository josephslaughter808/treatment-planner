import { AppShell } from "@/components/app-shell";
import { PatientPackageView } from "@/components/patient-package-view";

export default function PatientPage() {
  return (
    <AppShell
      audience="patient"
      description="Review active diagnoses and open the related condition and treatment information."
      hidePageBanner
      pageLabel="My care"
      title="My care"
    >
      <PatientPackageView />
    </AppShell>
  );
}
