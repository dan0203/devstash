"use client";

import { useRouter } from "next/navigation";
import { Crown, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AiActionTriggerProps {
  isPro: boolean;
  loading: boolean;
  onClick: () => void;
  label: string;
  loadingLabel: string;
  ariaLabel: string;
  /** Called before navigating to /upgrade — e.g. to close the dialog/drawer this trigger lives in. */
  onUpgradeClick?: () => void;
}

export function AiActionTrigger({
  isPro,
  loading,
  onClick,
  label,
  loadingLabel,
  ariaLabel,
  onUpgradeClick,
}: AiActionTriggerProps) {
  const router = useRouter();

  if (!isPro) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`${label} (requires Pro)`}
              className="h-auto cursor-pointer gap-1.5 px-2 py-1 text-xs text-neutral-400 hover:bg-white/10 hover:text-neutral-100"
              onClick={() => {
                onUpgradeClick?.();
                router.push("/upgrade");
              }}
            />
          }
        >
          <Crown className="size-3.5 text-amber-400" />
          {label}
        </TooltipTrigger>
        <TooltipContent>Upgrade to Pro to use AI features</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={ariaLabel}
      className="h-auto cursor-pointer gap-1.5 px-2 py-1 text-xs text-neutral-400 hover:bg-white/10 hover:text-neutral-100"
      onClick={onClick}
      disabled={loading}
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
      {loading ? loadingLabel : label}
    </Button>
  );
}