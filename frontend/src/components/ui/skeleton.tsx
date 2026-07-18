import { cn } from "@/lib/utils/cn";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-md bg-[var(--skeleton-bg)] animate-pulse",
        "motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
