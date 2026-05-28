import { AppShell } from "@/components/app-shell";
import { LoginView } from "@/components/login-view";

export default function LoginPage() {
  return (
    <AppShell
      audience="public"
      description="Sign in to update patient medical history and insurance or review the office check-in queue."
      pageLabel="Authentication"
      title="Log in to ClearPath Care"
    >
      <LoginView />
    </AppShell>
  );
}
