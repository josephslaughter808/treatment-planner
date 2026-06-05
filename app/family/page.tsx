import { AppShell } from "@/components/app-shell";
import { FamilyView } from "@/components/family-view";

export default function FamilyPage() {
  return (
    <AppShell
      audience="patient"
      description="Manage dependent profiles, adult care-circle requests, and medical-history permissions."
      pageLabel="Family access"
      title="Family and care permissions"
    >
      <FamilyView />
    </AppShell>
  );
}
