import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex min-h-[28px] items-center rounded-[var(--radius-pill)] border px-2.5 py-1 text-sm font-medium",
  {
    variants: {
      variant: {
        neutral:
          "border-transparent bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)]",
        info: "border-transparent bg-[var(--badge-info-bg)] text-[var(--badge-info-fg)]",
        success:
          "border-transparent bg-[var(--badge-success-bg)] text-[var(--badge-success-fg)]",
        warning:
          "border-transparent bg-[var(--badge-warning-bg)] text-[var(--badge-warning-fg)]",
        error: "border-transparent bg-[var(--badge-error-bg)] text-[var(--badge-error-fg)]",
        skill: "border-transparent bg-[var(--badge-skill-bg)] text-[var(--badge-skill-fg)]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps): JSX.Element {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
