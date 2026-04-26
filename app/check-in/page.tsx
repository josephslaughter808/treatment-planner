import { AppShell } from "@/components/app-shell";
import { IntakeCheckInView } from "@/components/intake-checkin-view";

export default function CheckInPage() {
  return (
    <AppShell
      description="Simulate the office-side tap or scan workflow that autofills patient history and allows quick confirmation of changes on return visits."
      pageLabel="Office check-in"
      title="Autofill and verify patient intake"
    >
      <IntakeCheckInView />
    </AppShell>
  );
}
