import { HttpResponse, http } from "msw";
import { getMockActiveSession } from "@/fixtures/auth";
import {
  getMockTeacherAssignmentOverviewResponse,
  getMockTeacherAssignmentStudentsResponse,
  getMockTeacherClassesResponse,
  getMockTeacherClassAssignmentsResponse,
  getMockTeacherClassDetailResponse,
  getMockTeacherLearningSessionEvidenceResponse,
  getMockTeacherStudentsResponse,
} from "@/fixtures/teacher";

function getTeacherSession() {
  const session = getMockActiveSession();
  if (!session || session.user.role !== "teacher") {
    return null;
  }
  return session;
}

function createUnauthorizedResponse() {
  return HttpResponse.json(
    {
      code: "SESSION_EXPIRED",
      message: "Phiên đăng nhập đã hết hạn.",
    },
    { status: 401 },
  );
}

export const teacherHandlers = [
  http.get("*/api/v1/teacher/classes", () => {
    if (!getTeacherSession()) {
      return createUnauthorizedResponse();
    }
    return HttpResponse.json(getMockTeacherClassesResponse());
  }),

  http.get("*/api/v1/teacher/classes/:classId", ({ params }) => {
    if (!getTeacherSession()) {
      return createUnauthorizedResponse();
    }
    if (String(params.classId) !== "class-6a1") {
      return HttpResponse.json(
        {
          code: "CLASSROOM_NOT_FOUND",
          message: "Không tìm thấy lớp học.",
        },
        { status: 404 },
      );
    }
    return HttpResponse.json(getMockTeacherClassDetailResponse());
  }),

  http.get("*/api/v1/teacher/classes/:classId/students", ({ params }) => {
    if (!getTeacherSession()) {
      return createUnauthorizedResponse();
    }
    if (String(params.classId) !== "class-6a1") {
      return HttpResponse.json(
        {
          code: "CLASSROOM_NOT_FOUND",
          message: "Không tìm thấy lớp học.",
        },
        { status: 404 },
      );
    }
    return HttpResponse.json(getMockTeacherStudentsResponse());
  }),

  http.get("*/api/v1/teacher/classes/:classId/assignments", ({ params }) => {
    if (!getTeacherSession()) {
      return createUnauthorizedResponse();
    }
    if (String(params.classId) !== "class-6a1") {
      return HttpResponse.json(
        {
          code: "CLASSROOM_NOT_FOUND",
          message: "Không tìm thấy lớp học.",
        },
        { status: 404 },
      );
    }
    return HttpResponse.json(getMockTeacherClassAssignmentsResponse());
  }),

  http.get("*/api/v1/teacher/assignments/:assignmentId/overview", ({ params }) => {
    if (!getTeacherSession()) {
      return createUnauthorizedResponse();
    }
    if (String(params.assignmentId) !== "assignment-fractions-001") {
      return HttpResponse.json(
        {
          code: "ASSIGNMENT_NOT_FOUND",
          message: "Không tìm thấy bài được giao.",
        },
        { status: 404 },
      );
    }
    return HttpResponse.json(getMockTeacherAssignmentOverviewResponse());
  }),

  http.get("*/api/v1/teacher/assignments/:assignmentId/students", ({ params, request }) => {
    if (!getTeacherSession()) {
      return createUnauthorizedResponse();
    }
    if (String(params.assignmentId) !== "assignment-fractions-001") {
      return HttpResponse.json(
        {
          code: "ASSIGNMENT_NOT_FOUND",
          message: "Không tìm thấy bài được giao.",
        },
        { status: 404 },
      );
    }

    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "20");
    return HttpResponse.json(getMockTeacherAssignmentStudentsResponse(page, pageSize));
  }),

  http.get("*/api/v1/teacher/learning-sessions/:sessionId", ({ params }) => {
    if (!getTeacherSession()) {
      return createUnauthorizedResponse();
    }
    if (String(params.sessionId) !== "diagnostic-fractions-001") {
      return HttpResponse.json(
        {
          code: "DIAGNOSTIC_SESSION_NOT_FOUND",
          message: "Không tìm thấy phiên học tập.",
        },
        { status: 404 },
      );
    }
    return HttpResponse.json(getMockTeacherLearningSessionEvidenceResponse());
  }),
];
