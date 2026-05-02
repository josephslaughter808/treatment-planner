import { AppShell } from "@/components/app-shell";
import { PracticeSettingsView } from "@/components/practice-settings-view";

export default function SettingsPage() {
  return (
    <AppShell
      audience="provider"
      description="Manage office defaults, practice-level setup, and dental-software links away from the patient-by-patient workflow."
      pageLabel="Practice settings"
      title="Manage office settings"
    >
      <PracticeSettingsView />
    </AppShell>
  );
}
