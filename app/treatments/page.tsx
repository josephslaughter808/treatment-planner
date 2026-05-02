import { AppShell } from "@/components/app-shell";
import { PageLibraryView } from "@/components/page-library-view";

export default function TreatmentsPage() {
  return (
    <AppShell
      audience="provider"
      description="View and edit patient-facing treatment pages, treatment explanations, media, and design details for your office."
      pageLabel="Treatment library"
      title="Manage treatment pages"
    >
      <PageLibraryView mode="treatment" />
    </AppShell>
  );
}
