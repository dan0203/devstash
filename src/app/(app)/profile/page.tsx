import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getUserProfile } from "@/lib/db/user";
import { getProfileStats } from "@/lib/db/profile";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChangePasswordDialog } from "@/components/profile/ChangePasswordDialog";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/profile");
  }

  const [user, stats] = await Promise.all([
    getUserProfile(session.user.id),
    getProfileStats(session.user.id),
  ]);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <UserAvatar name={user.name ?? user.email ?? "User"} image={user.image} size="lg" />
            <div className="min-w-0">
              <p className="truncate font-medium">{user.name ?? "Unnamed user"}</p>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                Joined{" "}
                {user.createdAt.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Usage</CardTitle>
            <CardDescription>
              {stats.totalItems} item{stats.totalItems === 1 ? "" : "s"} across{" "}
              {stats.totalCollections} collection{stats.totalCollections === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.typeBreakdown.map((type) => (
              <div
                key={type.name}
                className="flex flex-col gap-1 rounded-lg ring-1 ring-foreground/10 p-3"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: type.color }}
                  aria-hidden
                />
                <span className="text-lg font-medium">{type.count}</span>
                <span className="text-xs text-muted-foreground">{type.name}</span>
              </div>
            ))}
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
