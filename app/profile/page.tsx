import { AppShell } from "@/components/app-shell";
import { ProfileView } from "@/components/profile-view";

export default function ProfilePage() {
  return (
    <AppShell
      description="Edit the signed-in office user's name, title, contact details, bio, and profile photo."
      pageLabel="Profile"
      title="Manage the logged-in office profile"
    >
      <ProfileView />
    </AppShell>
  );
}
