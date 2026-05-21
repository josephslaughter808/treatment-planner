import { AppShell } from "@/components/app-shell";
import { PatientVaultView } from "@/components/patient-vault-view";

export default function VaultPage() {
  return (
    <AppShell
      audience="patient"
      description="Update the medical history, medications, allergies, and insurance details your office needs before visits."
      pageLabel="Patient check-in"
      title="Update medical history and insurance"
    >
      <PatientVaultView />
    </AppShell>
  );
}
