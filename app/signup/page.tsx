import { AppShell } from "@/components/app-shell";
import { SignupView } from "@/components/signup-view";

export default function SignupPage() {
  return (
    <AppShell
      description="Create a new office account for an admin, provider, or front desk team member and assign it to the right practice."
      pageLabel="Authentication"
      title="Create an office login"
    >
      <SignupView />
    </AppShell>
  );
}
