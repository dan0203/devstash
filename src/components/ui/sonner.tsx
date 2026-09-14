"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-400" />,
        info: <InfoIcon className="size-4 text-blue-400" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-400" />,
        error: <OctagonXIcon className="size-4 text-red-400" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "rounded-xl border shadow-lg",
          success: "!border-l-[3px] !border-l-emerald-400 !bg-emerald-500/50",
          error: "!border-l-[3px] !border-l-red-400 !bg-red-500/50",
          info: "!border-l-[3px] !border-l-blue-400 !bg-blue-500/50",
          warning: "!border-l-[3px] !border-l-amber-400 !bg-amber-500/50",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
