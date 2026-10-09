import React from "react";
import { cn } from "@/lib/utils/cn";

export type BadgeVariant = "teal" | "emerald" | "amber" | "rose" | "cyan" | "muted" | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  pulse?: boolean;
}

export function Badge({
  children,
  variant = "teal",
  pulse = false,
  className,
  ...props
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    teal: "bg-teal-500/10 text-radar-teal border-teal-500/30",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    muted: "bg-slate-800 text-slate-400 border-slate-700",
    outline: "bg-transparent text-slate-300 border-slate-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium border",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
        </span>
      )}
      {children}
    </span>
  );
}
