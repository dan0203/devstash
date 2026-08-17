import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getUserProfile } from "@/lib/db/user";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChangePasswordDialog } from "@/components/settings/ChangePasswordDialog";
import { DeleteAccountDialog } from "@/components/settings/DeleteAccountDialog";
import { EditorPreferencesSettings } from "@/components/settings/EditorPreferencesSettings";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/settings");
  }

  const user = await getUserProfile(session.user.id);

  if (!user) {
    redirect("/sign-in?callbackUrl=/settings");
  }

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
            <CardTitle className="text-lg">Account actions</CardTitle>
            <CardDescription>Manage your password and account</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {user.hasPassword && <ChangePasswordDialog />}
            <DeleteAccountDialog />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
