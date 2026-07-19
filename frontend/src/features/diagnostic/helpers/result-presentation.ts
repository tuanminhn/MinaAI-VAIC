import type { DiagnosticOutcome } from "@/contracts/diagnostic";

export function getOutcomeLabel(outcome: DiagnosticOutcome): string {
  switch (outcome) {
    case "mastered_without_remediation":
      return "Hoàn thành ngay từ phần kiểm tra";
    case "mastered_after_remediation":
      return "Hoàn thành sau khi củng cố";
    case "needs_teacher_support":
      return "Cần giáo viên hỗ trợ thêm";
  }
}
