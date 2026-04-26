import { AppShell } from "@/components/app-shell";
import { IntakeExperience } from "@/components/intake-experience";

export default function HomePage() {
  return (
    <AppShell
      description="Build tooth-specific patient education packages by selecting the diagnosis, choosing the treatment paths, and attaching diagnostic imaging."
      pageLabel="Case builder"
      title="Create a provider-guided treatment package"
    >
      <IntakeExperience />
    </AppShell>
  );
}
