import { cn } from "@/lib/utils/cn";

type LearningProgressProps = {
  completed: number;
  total: number;
  label?: string;
  className?: string;
};

function clampProgressValue(value: number): number {
  if (value < 0) {
    return 0;
  }

  if (value > 100) {
    return 100;
  }

  return value;
}

export function LearningProgress({
  completed,
  total,
  label = "Tiến độ",
  className,
}: LearningProgressProps): JSX.Element {
  const hasProgressTarget = total > 0;
  const safeCompleted = Math.max(completed, 0);
  const progressValue = hasProgressTarget
    ? clampProgressValue(Math.round((safeCompleted / total) * 100))
    : 0;
  const progressText = hasProgressTarget
    ? `${safeCompleted}/${total} câu đã hoàn thành`
    : "Chưa có tiến độ";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-[var(--text-primary)]">{label}</span>
        <span className="font-medium text-[var(--text-secondary)]">{progressText}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={hasProgressTarget ? total : 0}
        aria-valuenow={hasProgressTarget ? Math.min(safeCompleted, total) : 0}
        aria-valuetext={progressText}
        className="h-3 overflow-hidden rounded-[var(--radius-pill)] bg-[var(--surface-muted)]"
      >
        <div
          className="motion-standard h-full rounded-[var(--radius-pill)] bg-[var(--primary)]"
          style={{ width: `${progressValue}%` }}
        />
      </div>
    </div>
  );
}
