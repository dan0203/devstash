import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { UpgradePlanCards } from "@/components/dashboard/UpgradePlanCards";

export default async function UpgradePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/upgrade");
  }
  if (session.user.isPro) {
    redirect("/settings?from=upgrade");
  }

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 py-6 text-center">
        <h1 className="text-2xl font-semibold">Upgrade to Pro</h1>
        <p className="text-muted-foreground">Unlock unlimited items, file uploads, and AI features.</p>
      </div>
      <UpgradePlanCards />
    </main>
  );
}
