import type {
  AssignmentSummary,
  StudentAssignmentsQuery,
  StudentAssignmentsResponse,
  StudentHomeResponse,
} from "@/contracts/student";

const studentAssignmentsFixture: AssignmentSummary[] = [
  {
    id: "diagnostic-fractions-001",
    title: "Chẩn đoán phân số tuần này",
    description: "Trả lời các câu hỏi ngắn để Mina AI xác định phần kiến thức em cần ôn lại.",
    subject: "math",
    grade: 6,
    status: "in_progress",
    progress: {
      completed: 4,
      total: 10,
    },
    estimatedMinutes: 15,
    assignedAt: "2026-07-15",
    dueAt: "2026-07-19",
    nextRoute: "/student/diagnostic/diagnostic-fractions-001",
  },
  {
    id: "assignment-geometry-001",
    title: "Khởi động hình học cơ bản",
    description: "Đọc yêu cầu và bắt đầu bài chẩn đoán ngắn về đoạn thẳng, góc và hình tam giác.",
    subject: "math",
    grade: 6,
    status: "not_started",
    progress: {
      completed: 0,
      total: 8,
    },
    estimatedMinutes: 10,
    assignedAt: "2026-07-16",
    dueAt: "2026-07-22",
    nextRoute: "/student/diagnostic/adaptive-unknown-001",
  },
  {
    id: "remediation-integers-001",
    title: "Ôn lại số nguyên",
    description: "Xem ví dụ mẫu và làm vài câu luyện tập ngắn trước khi kiểm tra lại.",
    subject: "math",
    grade: 6,
    status: "remediation",
    progress: {
      completed: 2,
      total: 5,
    },
    estimatedMinutes: 12,
    assignedAt: "2026-07-14",
    dueAt: "2026-07-20",
    nextRoute: "/student/remediation/remediation-integers-001",
  },
  {
    id: "transfer-decimals-001",
    title: "Kiểm tra lại số thập phân",
    description: "Em đã hoàn thành phần ôn tập. Bây giờ hãy làm bài kiểm tra lại ngắn.",
    subject: "math",
    grade: 7,
    status: "transfer_ready",
    progress: {
      completed: 5,
      total: 5,
    },
    estimatedMinutes: 10,
    assignedAt: "2026-07-13",
    dueAt: "2026-07-18",
    nextRoute: "/student/transfer/transfer-decimals-001",
  },
  {
    id: "result-ratios-001",
    title: "Kết quả tỉ số và phần trăm",
    description: "Xem lại phần em đã làm tốt và phần cần luyện thêm trong bài vừa hoàn thành.",
    subject: "math",
    grade: 7,
    status: "completed",
    progress: {
      completed: 8,
      total: 8,
    },
    estimatedMinutes: 8,
    assignedAt: "2026-07-10",
    dueAt: "2026-07-17",
    nextRoute: "/student/result/result-ratios-001",
  },
];

export function getMockStudentHomeResponse(): StudentHomeResponse {
  return {
    student: {
      id: "student-001",
      displayName: "Nguyễn Hà Linh",
      classroomName: "6A1",
    },
    currentAssignment: studentAssignmentsFixture[0],
    recentAssignments: studentAssignmentsFixture.slice(1, 3),
  };
}

export function getMockEmptyStudentHomeResponse(): StudentHomeResponse {
  return {
    student: {
      id: "student-001",
      displayName: "Nguyễn Hà Linh",
      classroomName: "6A1",
    },
    recentAssignments: [],
  };
}

export function getMockStudentAssignmentsResponse(
  query: StudentAssignmentsQuery = {},
): StudentAssignmentsResponse {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 10;
  const filteredItems = query.status
    ? studentAssignmentsFixture.filter((assignment) => assignment.status === query.status)
    : studentAssignmentsFixture;
  const start = (page - 1) * pageSize;
  const items = filteredItems.slice(start, start + pageSize);

  return {
    items,
    page,
    pageSize,
    totalItems: filteredItems.length,
  };
}

export function getMockEmptyStudentAssignmentsResponse(): StudentAssignmentsResponse {
  return {
    items: [],
    page: 1,
    pageSize: 10,
    totalItems: 0,
  };
}
