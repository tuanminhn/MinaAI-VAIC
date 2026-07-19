import type { DiagnosticSessionResponse } from "@/contracts/diagnostic";

export function getDiagnosticSessionRouteLabel(session: DiagnosticSessionResponse): string {
  if (session.state === "in_remediation") {
    return "Bắt đầu củng cố";
  }

  if (session.state === "transfer_ready") {
    return "Bắt đầu kiểm tra lại";
  }

  if (session.state === "completed") {
    return "Xem kết quả";
  }

  return "Tiếp tục";
}
