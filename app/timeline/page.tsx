import { AppShell } from "@/components/app-shell";
import { TimelineView } from "@/components/timeline-view";

export default function TimelinePage() {
  return (
    <AppShell
      audience="patient"
      description="See the running history of your medical history, diagnoses, and treatment decisions."
      pageLabel="Timeline"
      title="Track my care decisions over time"
    >
      <TimelineView />
    </AppShell>
  );
}
