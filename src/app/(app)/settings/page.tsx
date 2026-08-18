import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";

import { auth } from "@/auth";
import { getUserProfile } from "@/lib/db/user";
import { getBillingInfo } from "@/lib/db/billing";
import { getItemStats } from "@/lib/db/items";
import { getCollectionStats } from "@/lib/db/collections";
import { STRIPE_PRICE_IDS } from "@/lib/stripe";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ChangePasswordDialog } from "@/components/settings/ChangePasswordDialog";
import { DeleteAccountDialog } from "@/components/settings/DeleteAccountDialog";
import { EditorPreferencesSettings } from "@/components/settings/EditorPreferencesSettings";
import { BillingSettings } from "@/components/settings/BillingSettings";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/settings");
  }

  const user = await getUserProfile(session.user.id);

  if (!user) {
    redirect("/sign-in?callbackUrl=/settings");
  }

  const [billingInfo, itemStats, collectionStats] = await Promise.all([
    getBillingInfo(session.user.id),
    getItemStats(session.user.id),
    getCollectionStats(session.user.id),
  ]);
  const planLabel = billingInfo.isPro
    ? billingInfo.stripePriceId === STRIPE_PRICE_IDS.yearly
      ? "Pro (yearly)"
      : "Pro (monthly)"
    : "Free";

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Editor preferences</CardTitle>
            <CardDescription>Customize how the code editor looks and behaves</CardDescription>
          </CardHeader>
          <CardContent>
            <EditorPreferencesSettings />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="size-5" />
              Billing
            </CardTitle>
            <CardDescription>Manage your plan and subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <BillingSettings
              billingInfo={billingInfo}
              planLabel={planLabel}
              itemCount={itemStats.total}
              collectionCount={collectionStats.total}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account actions</CardTitle>
            <CardDescription>Manage your password and account</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {user.hasPassword && (
              <div className="flex items-center justify-between rounded-lg border border-input px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <Label>Change password</Label>
                  <span className="text-xs text-muted-foreground">
                    Update the password used to sign in
                  </span>
                </div>
                <ChangePasswordDialog />
              </div>
            )}
            <div className="flex items-center justify-between rounded-lg border border-input px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <Label>Delete account</Label>
                <span className="text-xs text-muted-foreground">
                  Permanently delete your account and all of your data
                </span>
              </div>
              <DeleteAccountDialog />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
