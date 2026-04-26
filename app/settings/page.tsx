import { AppShell } from "@/components/app-shell";
import { PracticeSettingsView } from "@/components/practice-settings-view";

export default function SettingsPage() {
  return (
    <AppShell
      description="Manage office-level diagnosis defaults, reusable media, and consent framing away from the patient-by-patient workflow."
      pageLabel="Practice settings"
      title="Set the office defaults once"
    >
      <PracticeSettingsView />
    </AppShell>
  );
}
