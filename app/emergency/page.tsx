import { AppShell } from "@/components/app-shell";
import { EmergencyCardView } from "@/components/emergency-card-view";

export default function EmergencyPage() {
  return (
    <AppShell
      description="Create a patient-approved, emergency-only medical card for allergies, serious conditions, medications, and responder contact details."
      pageLabel="Emergency card"
      title="Configure emergency responder disclosure"
    >
      <EmergencyCardView />
    </AppShell>
  );
}
