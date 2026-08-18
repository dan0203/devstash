import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ProUpgradePromptProps {
  typeName: string;
}

export function ProUpgradePrompt({ typeName }: ProUpgradePromptProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-input py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="size-6 text-primary" />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="font-medium">{typeName} is a Pro feature</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Upgrade to DevStash Pro to store and organize {typeName.toLowerCase()} alongside the
          rest of your knowledge base.
        </p>
      </div>
      <Button render={<Link href="/settings" />} nativeButton={false}>
        Upgrade to Pro
      </Button>
    </div>
  );
}