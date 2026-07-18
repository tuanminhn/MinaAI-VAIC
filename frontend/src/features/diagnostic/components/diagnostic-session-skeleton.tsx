import { Skeleton } from "@/components/ui/skeleton";

export function DiagnosticSessionSkeleton(): JSX.Element {
  return (
    <div
      aria-live="polite"
      aria-busy="true"
      aria-label="Đang tải câu hỏi chẩn đoán"
      className="space-y-6"
    >
      <div className="space-y-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-8 w-80 max-w-full" />
        <Skeleton className="h-3 w-full" />
      </div>
      <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-full max-w-2xl" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-12 w-44" />
        </div>
      </div>
    </div>
  );
}
