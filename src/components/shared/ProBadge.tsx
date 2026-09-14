import { cn } from "@/lib/utils";

interface ProBadgeProps {
  className?: string;
  iconOnly?: boolean;
}

export function ProBadge({ className, iconOnly = false }: ProBadgeProps) {
  return (
    <span
      title="Pro"
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-blue-500 font-semibold text-white shadow-sm",
        iconOnly ? "size-4 text-[9px]" : "px-1.5 py-0.5 text-[10px] tracking-wide uppercase",
        className,
      )}
    >
      {iconOnly ? "P" : "Pro"}
    </span>
  );
}
