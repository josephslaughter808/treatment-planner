import { AppShell } from "@/components/app-shell";
import { PatientDiagnosisDetailView } from "@/components/patient-diagnosis-detail-view";

export default async function PatientDiagnosisDetailPage({
  params
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return (
    <AppShell
      audience="patient"
      hidePageBanner
      description="Review the condition details and treatment options connected to this diagnosis."
      pageLabel="Diagnosis"
      title="Diagnosis details"
    >
      <PatientDiagnosisDetailView eventId={eventId} />
    </AppShell>
  );
}
