import type { DiagnosticProgress as DiagnosticProgressData } from "@/contracts/diagnostic";
import {
  getDiagnosticProgressText,
  hasEstimatedDiagnosticTotal,
} from "@/features/diagnostic/helpers/diagnostic-progress";

type DiagnosticProgressProps = {
  progress: DiagnosticProgressData;
};

export function DiagnosticProgress({ progress }: DiagnosticProgressProps): JSX.Element {
  const progressText = getDiagnosticProgressText(progress);

  if (!hasEstimatedDiagnosticTotal(progress)) {
    return (
      <div className="space-y-1">
        <p className="text-sm font-medium text-[var(--text-primary)]">Tiến độ</p>
        <p className="text-sm text-[var(--text-secondary)]">{progressText}</p>
      </div>
    );
  }

  const total = progress.estimatedTotal ?? 1;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[var(--text-primary)]">Tiến độ</p>
        <p className="text-sm text-[var(--text-secondary)]">{progressText}</p>
      </div>
      <div
        role="progressbar"
        aria-label="Tiến độ bài chẩn đoán"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={progress.answered}
        aria-valuetext={progressText}
        className="h-3 overflow-hidden rounded-[var(--radius-pill)] bg-[var(--surface-muted)]"
      >
        <div
          className="motion-standard h-full rounded-[var(--radius-pill)] bg-[var(--primary)]"
          style={{
            width: `${Math.min(
              100,
              Math.round((progress.answered / total) * 100),
            )}%`,
          }}
        />
      </div>
    </div>
  );
}
