import { Skeleton } from "@/components/ui/skeleton";

export function StudentHomeSkeleton(): JSX.Element {
  return (
    <div aria-live="polite" aria-busy="true" className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-5 w-40" />
      </div>

      <section className="space-y-4" aria-label="Đang tải bài hiện tại">
        <Skeleton className="h-6 w-40" />
        <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-52" />
            <Skeleton className="h-5 w-full max-w-2xl" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-12 w-40" />
          </div>
        </div>
      </section>

      <section className="space-y-4" aria-label="Đang tải các bài gần đây">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-6"
            >
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
