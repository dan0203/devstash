import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle: string;
  align?: "center" | "left";
  className?: string;
}

export function SectionHeading({ title, subtitle, align = "center", className }: SectionHeadingProps) {
  return (
    <div className={cn("mb-12", align === "center" ? "text-center" : "text-left", className)}>
      <h2 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{title}</h2>
      <p className="mt-2.5 text-muted-foreground">{subtitle}</p>
    </div>
  );
}
