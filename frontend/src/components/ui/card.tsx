import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const cardVariants = cva(
  "rounded-[var(--radius-card)] border text-[var(--text-primary)] shadow-[var(--shadow-xs)]",
  {
    variants: {
      variant: {
        default: "bg-[var(--card-default-bg)] border-[var(--card-default-border)]",
        muted: "bg-[var(--card-muted-bg)] border-[var(--card-muted-border)]",
        tinted: "bg-[var(--card-tinted-bg)] border-[var(--card-tinted-border)]",
        interactive:
          "bg-[var(--card-default-bg)] border-[var(--card-interactive-border)] hover:border-[var(--card-interactive-border-hover)] hover:shadow-[var(--shadow-sm)]",
        "student-focus":
          "bg-[var(--card-student-bg)] border-[var(--card-student-border)] shadow-[var(--shadow-xs)]",
        "teacher-compact":
          "bg-[var(--card-teacher-bg)] border-[var(--card-teacher-border)] shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface CardProps
  extends React.ComponentProps<"section">,
    VariantProps<typeof cardVariants> {}

function Card({ className, variant, ...props }: CardProps) {
  return (
    <section
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("text-xl font-semibold tracking-tight", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-[var(--text-secondary)]", className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center gap-2 px-6 pb-6", className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
