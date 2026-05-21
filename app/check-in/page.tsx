import { AppShell } from "@/components/app-shell";
import { IntakeCheckInView } from "@/components/intake-checkin-view";

export default function CheckInPage() {
  return (
    <AppShell
      audience="provider"
      description="Verify a returning patient's medical history, medications, allergies, and insurance before the appointment starts."
      hidePageBanner
      pageLabel="Medical check-in"
      title="Medical check-in"
    >
      <IntakeCheckInView />
    </AppShell>
  );
}
