import type { TeacherOutcome } from "@/contracts/teacher";

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

export function formatTeacherDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}

export function getTeacherOutcomeLabel(outcome: TeacherOutcome | null): string {
  switch (outcome) {
    case "masteredWithoutRemediation":
      return "Hoàn thành ngay từ phần chẩn đoán";
    case "masteredAfterRemediation":
      return "Hoàn thành sau khi củng cố";
    case "needsTeacherSupport":
      return "Cần giáo viên hỗ trợ thêm";
    default:
      return "Chưa có kết quả";
  }
}

export function getTeacherAssignmentStatusLabel(status: string): string {
  switch (status) {
    case "not_started":
      return "Chưa bắt đầu";
    case "in_progress":
      return "Đang thực hiện";
    case "remediation":
      return "Đang củng cố";
    case "transfer_ready":
      return "Đang kiểm tra lại";
    case "completed":
      return "Đã hoàn thành";
    default:
      return status;
  }
}

export function getTeacherSessionStateLabel(state: string | null): string {
  switch (state) {
    case "diagnosing":
      return "Đang chẩn đoán";
    case "gap_confirmed":
      return "Đã xác định phần cần củng cố";
    case "in_remediation":
      return "Đang củng cố";
    case "transfer_ready":
      return "Đang kiểm tra lại";
    case "completed":
      return "Đã hoàn thành";
    case null:
      return "Chưa có phiên học";
    default:
      return state;
  }
}

export function getTeacherReasonLabel(reasonCode: string): string {
  switch (reasonCode) {
    case "session_started":
      return "Bắt đầu chẩn đoán";
    case "root_cause_confirmed":
      return "Xác định phần kiến thức cần củng cố";
    case "remediation_started":
      return "Bắt đầu củng cố";
    case "remediation_completed":
      return "Hoàn thành lượt củng cố";
    case "transfer_started":
      return "Bắt đầu kiểm tra lại";
    case "transfer_passed":
      return "Đạt phần kiểm tra lại";
    case "transfer_failed_retry":
      return "Cần củng cố thêm một lượt";
    case "transfer_failed_completed":
      return "Cần giáo viên hỗ trợ thêm";
    case "session_completed":
      return "Hoàn thành phiên học";
    default:
      return reasonCode;
  }
}
