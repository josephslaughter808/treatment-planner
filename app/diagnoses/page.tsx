import { AppShell } from "@/components/app-shell";
import { PageLibraryView } from "@/components/page-library-view";

export default function DiagnosesPage() {
  return (
    <AppShell
      audience="provider"
      description="View and edit patient-facing diagnosis pages, diagnosis explanations, media, and design details for your office."
      pageLabel="Diagnosis library"
      title="Manage diagnosis pages"
    >
      <PageLibraryView mode="diagnosis" />
    </AppShell>
  );
}
