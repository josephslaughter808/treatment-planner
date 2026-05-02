import { AppShell } from "@/components/app-shell";
import { PatientVaultView } from "@/components/patient-vault-view";

export default function VaultPage() {
  return (
    <AppShell
      audience="patient"
      description="Store a reusable patient medical history, medications, allergies, insurance details, and a wallet-style intake identity."
      pageLabel="Patient vault"
      title="Build a reusable medical history profile"
    >
      <PatientVaultView />
    </AppShell>
  );
}
