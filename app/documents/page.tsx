import { AppShell } from "@/components/app-shell";
import { DocumentsView } from "@/components/documents-view";

export default function DocumentsPage() {
  return (
    <AppShell
      audience="patient"
      description="Keep the standard documents offices commonly ask to see during check-in."
      pageLabel="Patient documents"
      title="Documents and ID cards"
    >
      <DocumentsView />
    </AppShell>
  );
}
