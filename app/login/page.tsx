import { AppShell } from "@/components/app-shell";
import { LoginView } from "@/components/login-view";

export default function LoginPage() {
  return (
    <AppShell
      description="Sign in as a provider, front desk coordinator, or office admin to manage cases, patient packages, and practice defaults."
      pageLabel="Authentication"
      title="Log in to ClearPath Care"
    >
      <LoginView />
    </AppShell>
  );
}
