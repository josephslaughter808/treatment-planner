import { AppShell } from "@/components/app-shell";
import { ProfileView } from "@/components/profile-view";

export default function ProfilePage() {
  return (
    <AppShell
      audience="shared"
      description="Edit the signed-in ClearPath profile, contact details, bio, and profile photo."
      hidePageBanner
      pageLabel="Profile"
      title="Manage the signed-in profile"
    >
      <ProfileView />
    </AppShell>
  );
}
