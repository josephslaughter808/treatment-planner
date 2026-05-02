import { AppShell } from "@/components/app-shell";
import { TeamDirectoryView } from "@/components/team-directory-view";

export default function TeamPage() {
  return (
    <AppShell
      audience="provider"
      description="Review the current practice team, provider roster, office roles, and shared profile photos from one place."
      pageLabel="Team directory"
      title="View office users across the practice"
    >
      <TeamDirectoryView />
    </AppShell>
  );
}
