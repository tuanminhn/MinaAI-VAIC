import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const alertVariants = cva(
  "relative w-full rounded-[var(--radius-dialog)] border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        info: "border-[var(--alert-info-border)] bg-[var(--alert-info-bg)] text-[var(--alert-info-fg)]",
        success:
          "border-[var(--alert-success-border)] bg-[var(--alert-success-bg)] text-[var(--alert-success-fg)]",
        warning:
          "border-[var(--alert-warning-border)] bg-[var(--alert-warning-bg)] text-[var(--alert-warning-fg)]",
        error: "border-[var(--alert-error-border)] bg-[var(--alert-error-bg)] text-[var(--alert-error-fg)]",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

function AlertTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("mb-1 font-semibold", className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-sm opacity-95", className)} {...props} />;
}

export { Alert, AlertDescription, AlertTitle };
