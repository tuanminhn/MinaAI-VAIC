import type { DiagnosticProgress } from "@/contracts/diagnostic";

export function getDiagnosticProgressText(progress: DiagnosticProgress): string {
  if (progress.estimatedTotal) {
    return `Đã hoàn thành ${progress.answered}/${progress.estimatedTotal} câu`;
  }

  return `Đã hoàn thành ${progress.answered} câu`;
}

export function hasEstimatedDiagnosticTotal(progress: DiagnosticProgress): boolean {
  return typeof progress.estimatedTotal === "number" && progress.estimatedTotal > 0;
}
