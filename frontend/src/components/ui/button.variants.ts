import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "motion-standard inline-flex touch-target items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-base)] border text-sm font-semibold disabled:cursor-not-allowed disabled:bg-[var(--button-disabled-bg)] disabled:text-[var(--button-disabled-fg)] disabled:border-[var(--button-disabled-border)] disabled:shadow-none",
  {
    variants: {
      variant: {
        primary:
          "border-[var(--button-primary-border)] bg-[var(--button-primary-bg)] text-[var(--button-primary-fg)] hover:bg-[var(--button-primary-bg-hover)] active:bg-[var(--button-primary-bg-active)]",
        secondary:
          "border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] text-[var(--button-secondary-fg)] hover:bg-[var(--button-secondary-bg-hover)] active:bg-[var(--button-secondary-bg-active)]",
        outline:
          "border-[var(--button-outline-border)] bg-[var(--button-outline-bg)] text-[var(--button-outline-fg)] hover:bg-[var(--button-outline-bg-hover)]",
        ghost:
          "border-transparent bg-transparent text-[var(--button-ghost-fg)] hover:bg-[var(--button-ghost-bg-hover)]",
        destructive:
          "border-[var(--button-destructive-border)] bg-[var(--button-destructive-bg)] text-[var(--button-destructive-fg)] hover:bg-[var(--button-destructive-bg-hover)]",
      },
      size: {
        sm: "min-h-[var(--size-button-default)] px-3 text-sm",
        default: "min-h-[var(--size-button-default)] px-4 text-sm",
        lg: "min-h-[var(--size-button-large)] px-5 text-base",
        icon: "size-[var(--size-button-default)] p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);
