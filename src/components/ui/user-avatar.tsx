import Image from "next/image";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface UserAvatarProps {
  name: string;
  image?: string | null;
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function UserAvatar({ name, image, size = "default", className }: UserAvatarProps) {
  return (
    <Avatar size={size} className={cn("shrink-0", className)}>
      {image && (
        <AvatarImage
          src={image}
          alt={name}
          render={<Image src={image} alt={name} width={40} height={40} />}
        />
      )}
      <AvatarFallback>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
