import React from "react";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-radar-bg disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

    const sizeStyles = {
      sm: "text-xs px-2.5 py-1.5 gap-1.5 h-8",
      md: "text-sm px-4 py-2 gap-2 h-10",
      lg: "text-base px-5 py-2.5 gap-2.5 h-12",
    };

    const variantStyles = {
      primary:
        "bg-radar-teal text-slate-950 font-semibold hover:bg-[#66ebd0] focus:ring-radar-teal shadow-noc-glow hover:shadow-[0_0_20px_rgba(77,224,193,0.3)]",
      secondary:
        "bg-radar-surface hover:bg-radar-elevated text-slate-200 border border-radar-border focus:ring-slate-500",
      outline:
        "bg-transparent hover:bg-radar-surface text-radar-teal border border-radar-teal/40 hover:border-radar-teal focus:ring-radar-teal",
      danger:
        "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 focus:ring-rose-500",
      ghost:
        "bg-transparent hover:bg-radar-surface text-slate-300 hover:text-white focus:ring-slate-500",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
