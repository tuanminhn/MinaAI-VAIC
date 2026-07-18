import type { ApiError } from "@/lib/api/api-error";

export function isDiagnosticSessionExpired(error: ApiError): boolean {
  return error.status === 401 || error.code === "session_expired";
}

export function isDiagnosticSessionMissing(error: ApiError): boolean {
  return error.status === 404 || error.code === "diagnostic_session_not_found";
}

export function getDiagnosticLoadMessage(error: ApiError): {
  title: string;
  description: string;
} {
  if (isDiagnosticSessionMissing(error)) {
    return {
      title: "Không tìm thấy phiên làm bài này.",
      description: "Em có thể quay về danh sách bài được giao để chọn lại bài cần làm.",
    };
  }

  return {
    title: "Chưa thể tải phiên làm bài",
    description: "Chưa thể kết nối đến máy chủ Mina trong trường. Hãy thử lại để mở lại bài đang làm.",
  };
}

export function getDiagnosticSubmitMessage(error: ApiError): {
  title: string;
  description: string;
} {
  if (
    error.status === 409 ||
    error.code === "diagnostic_attempt_invalid" ||
    error.code === "attempt_conflict"
  ) {
    return {
      title: "Câu trả lời chưa được gửi",
      description: "Phiên làm bài đã thay đổi. Em hãy thử gửi lại câu trả lời một lần nữa.",
    };
  }

  return {
    title: "Chưa gửi được câu trả lời",
    description:
      "Chưa thể kết nối đến máy chủ Mina trong trường. Câu trả lời của em chưa được gửi. Hãy thử lại.",
  };
}
