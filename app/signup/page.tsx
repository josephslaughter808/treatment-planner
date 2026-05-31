import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { SignupView } from "@/components/signup-view";

export default function SignupPage() {
  return (
    <AppShell
      audience="public"
      description="Create your patient account, then update the medical history and insurance details your office needs before your visit."
      pageLabel="Patient setup"
      title="Create your ClearPath patient account"
    >
      <Suspense fallback={<section className="panel">Loading account setup...</section>}>
        <SignupView />
      </Suspense>
    </AppShell>
  );
}
