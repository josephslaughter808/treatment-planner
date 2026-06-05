import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { LoginView } from "@/components/login-view";

export default function LoginPage() {
  return (
    <AppShell
      audience="public"
      description="A reusable medical history profile patients can keep current and securely share with participating offices."
      pageLabel="ClearPath Care"
      title="Never fill out another medical history form again."
    >
      <Suspense fallback={<section className="panel">Loading login...</section>}>
        <LoginView />
      </Suspense>
    </AppShell>
  );
}
