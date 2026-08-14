import { prisma } from "@/lib/prisma";

export interface UserProfile {
  name: string | null;
  email: string | null;
  image: string | null;
  hasPassword: boolean;
  createdAt: Date;
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, email: true, image: true, password: true, createdAt: true },
  });

  return {
    name: user.name,
    email: user.email,
    image: user.image,
    hasPassword: user.password !== null,
    createdAt: user.createdAt,
  };
}
