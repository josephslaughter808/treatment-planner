import { AppShell } from "@/components/app-shell";
import { ProviderNewPatientView } from "@/components/provider-new-patient-view";

export default function NewPatientPage() {
  return (
    <AppShell
      audience="provider"
      description="Scan a patient QR code or enter their ClearPath access code to begin medical history check-in."
      hidePageBanner
      pageLabel="New patient"
      title="QR and access-code intake"
    >
      <ProviderNewPatientView />
    </AppShell>
  );
}
