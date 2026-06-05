import { AppShell } from "@/components/app-shell";
import { FamilyView } from "@/components/family-view";

export default function FamilyPage() {
  return (
    <AppShell
      audience="patient"
      description="Manage children, spouse or partner access, and medical-history authorizations."
      pageLabel="Family access"
      title="Family profiles and permissions"
    >
      <FamilyView />
    </AppShell>
  );
}
