import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";

export function SectionLabel({ icon: Icon, children }: { icon?: LucideIcon; children: ReactNode }) {
  return (
    <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground">
      {Icon && <Icon className="size-3.5" />}
      {children}
    </h3>
  );
}
