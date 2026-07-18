import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button.variants";
import { cn } from "@/lib/utils/cn";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      loadingLabel = "Đang tải",
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        aria-busy={isLoading || undefined}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        <LoaderCircle
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 motion-reduce:animate-none",
            isLoading ? "animate-spin opacity-100" : "opacity-0",
          )}
        />
        <span>{isLoading ? loadingLabel : children}</span>
      </Comp>
    );
  },
);

Button.displayName = "Button";

export { Button };
