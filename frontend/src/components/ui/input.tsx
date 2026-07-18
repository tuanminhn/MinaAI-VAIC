import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const inputVariants = cva(
  "motion-standard touch-target flex w-full rounded-[var(--radius-base)] border bg-[var(--input-bg)] px-3 text-sm text-[var(--input-fg)] placeholder:text-[var(--input-placeholder)] disabled:cursor-not-allowed disabled:bg-[var(--input-bg-disabled)] disabled:text-[var(--text-disabled)]",
  {
    variants: {
      invalid: {
        true: "border-[var(--input-border-invalid)]",
        false: "border-[var(--input-border)] hover:border-[var(--input-border-hover)]",
      },
    },
    defaultVariants: {
      invalid: false,
    },
  },
);

export interface InputProps extends React.ComponentProps<"input"> {
  invalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, invalid, ...props }, ref) => {
    return (
      <input
        aria-invalid={invalid || props["aria-invalid"] === true || props["aria-invalid"] === "true"}
        ref={ref}
        type={type}
        className={cn(
          inputVariants({ invalid }),
          "min-h-[var(--size-input)] py-2",
          invalid && "focus-visible:border-[var(--input-border-invalid)]",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

type InputMessageProps = React.ComponentProps<"p"> & {
  id?: string;
};

export function InputMessage({ className, ...props }: InputMessageProps): JSX.Element {
  return (
    <p
      className={cn("text-sm text-[var(--input-message)]", className)}
      role="alert"
      {...props}
    />
  );
}

export function InputDescription({
  className,
  ...props
}: React.ComponentProps<"p">): JSX.Element {
  return <p className={cn("text-sm text-[var(--input-description)]", className)} {...props} />;
}

export { Input };
