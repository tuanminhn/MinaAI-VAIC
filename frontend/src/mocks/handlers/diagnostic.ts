import { HttpResponse, http } from "msw";
import { getMockActiveSession } from "@/fixtures/auth";
import {
  getDiagnosticSessionFixture,
  submitDiagnosticFixtureAttempt,
} from "@/fixtures/diagnostic";

function getStudentSession() {
  const session = getMockActiveSession();
  if (!session || session.user.role !== "student") {
    return null;
  }
  return session;
}

function createUnauthorizedResponse() {
  return HttpResponse.json(
    {
      code: "SESSION_EXPIRED",
      message: "Phien dang nhap da het han.",
    },
    { status: 401 },
  );
}

export const diagnosticHandlers = [
  http.get("*/api/v1/diagnostic-sessions/:sessionId", ({ params, request }) => {
    const url = new URL(request.url);
    const scenario = url.searchParams.get("scenario");

    if (!getStudentSession()) {
      return createUnauthorizedResponse();
    }

    if (scenario === "server-unavailable") {
      return HttpResponse.json(
        {
          code: "SERVER_UNAVAILABLE",
          message: "May chu Mina trong truong hien chua san sang.",
        },
        { status: 503 },
      );
    }

    if (scenario === "not-found") {
      return HttpResponse.json(
        {
          code: "DIAGNOSTIC_SESSION_NOT_FOUND",
          message: "Khong tim thay phien lam bai nay.",
        },
        { status: 404 },
      );
    }

    const session = getDiagnosticSessionFixture(String(params.sessionId));
    if (!session) {
      return HttpResponse.json(
        {
          code: "DIAGNOSTIC_SESSION_NOT_FOUND",
          message: "Khong tim thay phien lam bai nay.",
        },
        { status: 404 },
      );
    }

    return HttpResponse.json(session);
  }),

  http.post(
    "*/api/v1/diagnostic-sessions/:sessionId/attempts",
    async ({ params, request }) => {
    const url = new URL(request.url);
    const scenario = url.searchParams.get("scenario");

    if (!getStudentSession()) {
      return createUnauthorizedResponse();
    }

    if (scenario === "server-unavailable") {
      return HttpResponse.json(
        {
          code: "SERVER_UNAVAILABLE",
          message: "May chu Mina trong truong hien chua san sang.",
        },
        { status: 503 },
      );
    }

    if (scenario === "conflict") {
      return HttpResponse.json(
        {
          code: "ATTEMPT_CONFLICT",
          message: "Cau tra loi nay dang duoc xu ly. Hay thu lai.",
        },
        { status: 409 },
      );
    }

    const body = (await request.json()) as {
      questionId?: string;
      selectedOptionId?: string;
    };

    const response = submitDiagnosticFixtureAttempt(String(params.sessionId), {
      questionId: body.questionId ?? "",
      selectedOptionId: body.selectedOptionId ?? "",
    });

    if (!response) {
      return HttpResponse.json(
        {
          code: "DIAGNOSTIC_ATTEMPT_INVALID",
          message: "Cau tra loi nay khong con phu hop voi phien hien tai.",
        },
        { status: 409 },
      );
    }

    return HttpResponse.json(response);
    },
  ),
];
