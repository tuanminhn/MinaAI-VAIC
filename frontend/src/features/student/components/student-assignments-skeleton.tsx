import { Skeleton } from "@/components/ui/skeleton";

export function StudentAssignmentsSkeleton(): JSX.Element {
  return (
    <div aria-live="polite" aria-busy="true" className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-6"
          >
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-64 max-w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-10 w-36" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
