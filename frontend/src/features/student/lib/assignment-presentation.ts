import type { AssignmentStatus } from "@/contracts/student";

type AssignmentPresentation = {
  statusLabel: string;
  badgeVariant: "neutral" | "info" | "success" | "warning" | "skill";
  actionLabel: string;
};

const assignmentPresentationMap: Record<AssignmentStatus, AssignmentPresentation> = {
  not_started: {
    statusLabel: "Chưa bắt đầu",
    badgeVariant: "neutral",
    actionLabel: "Bắt đầu",
  },
  in_progress: {
    statusLabel: "Đang thực hiện",
    badgeVariant: "info",
    actionLabel: "Tiếp tục",
  },
  remediation: {
    statusLabel: "Đang củng cố kiến thức",
    badgeVariant: "warning",
    actionLabel: "Tiếp tục học",
  },
  transfer_ready: {
    statusLabel: "Sẵn sàng kiểm tra lại",
    badgeVariant: "skill",
    actionLabel: "Làm bài kiểm tra lại",
  },
  completed: {
    statusLabel: "Đã hoàn thành",
    badgeVariant: "success",
    actionLabel: "Xem kết quả",
  },
};

export function getAssignmentPresentation(status: AssignmentStatus): AssignmentPresentation {
  return assignmentPresentationMap[status];
}
