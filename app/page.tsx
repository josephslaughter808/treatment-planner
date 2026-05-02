import { AppShell } from "@/components/app-shell";
import { ProviderPatientDatabaseView } from "@/components/provider-patient-database-view";

export default function HomePage() {
  return (
    <AppShell
      audience="provider"
      description="Search the patient database, open a chart, manage office diagnoses, review clearance activity, and keep treatment-page previews directly under the chart."
      hidePageBanner
      pageLabel="Patient database"
      title="Provider patient database"
    >
      <ProviderPatientDatabaseView />
    </AppShell>
  );
}
