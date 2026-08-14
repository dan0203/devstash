import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/profile");
  }

  const { name, email, image } = session.user;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <UserAvatar name={name ?? email ?? "User"} image={image} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-medium">{name ?? "Unnamed user"}</p>
            <p className="truncate text-sm text-muted-foreground">{email}</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
