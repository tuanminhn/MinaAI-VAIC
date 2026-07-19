import type { ApiError } from "@/lib/api/api-error";

export function isLearningSessionExpired(error: ApiError): boolean {
  return error.status === 401 || error.code === "session_expired";
}

export function isLearningSessionMissing(error: ApiError): boolean {
  return error.status === 404 || error.code === "diagnostic_session_not_found";
}

export function getLearningLoadMessage(
  error: ApiError,
  phase: "remediation" | "transfer" | "result",
): {
  title: string;
  description: string;
} {
  if (isLearningSessionMissing(error)) {
    return {
      title: "Không tìm thấy phiên học này.",
      description: "Em có thể quay về danh sách bài được giao để mở lại bài phù hợp.",
    };
  }

  if (phase === "transfer") {
    return {
      title: "Chưa thể tải phần kiểm tra lại",
      description:
        "Chưa thể kết nối đến máy chủ Mina trong trường. Hãy thử lại để tiếp tục phần kiểm tra lại.",
    };
  }

  if (phase === "result") {
    return {
      title: "Chưa thể tải kết quả",
      description:
        "Chưa thể kết nối đến máy chủ Mina trong trường. Hãy thử lại để xem kết quả bài học.",
    };
  }

  return {
    title: "Chưa thể tải phần củng cố",
    description:
      "Chưa thể kết nối đến máy chủ Mina trong trường. Hãy thử lại để mở lại bài củng cố.",
  };
}

export function getLearningSubmitMessage(phase: "remediation" | "transfer", error: ApiError): {
  title: string;
  description: string;
} {
  if (error.status === 409 || error.code === "attempt_conflict") {
    return {
      title: "Câu trả lời chưa được gửi",
      description: "Phiên học đã thay đổi. Em hãy thử gửi lại câu trả lời một lần nữa.",
    };
  }

  if (phase === "transfer") {
    return {
      title: "Chưa gửi được câu trả lời",
      description:
        "Chưa thể kết nối đến máy chủ Mina trong trường. Câu trả lời của em chưa được gửi. Hãy thử lại.",
    };
  }

  return {
    title: "Chưa gửi được câu trả lời",
    description:
      "Chưa thể kết nối đến máy chủ Mina trong trường. Bài luyện tập của em chưa được gửi. Hãy thử lại.",
  };
}
