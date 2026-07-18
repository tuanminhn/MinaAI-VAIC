import { HttpResponse, http } from "msw";
import type { AuthSession } from "@/contracts/auth";
import { findMockSessionByToken } from "@/fixtures/auth";
import {
  getDiagnosticSessionFixture,
  submitDiagnosticFixtureAttempt,
} from "@/fixtures/diagnostic";

function getBearerToken(headerValue: string | null): string | null {
  if (!headerValue) {
    return null;
  }

  const [scheme, token] = headerValue.split(" ");
  return scheme === "Bearer" && token ? token : null;
}

function getStudentSessionFromRequest(request: Request): AuthSession | null {
  const accessToken = getBearerToken(request.headers.get("authorization"));

  if (!accessToken) {
    return null;
  }

  const session = findMockSessionByToken(accessToken);

  if (!session || session.user.role !== "student") {
    return null;
  }

  return session;
}

function createUnauthorizedResponse() {
  return HttpResponse.json(
    {
      code: "session_expired",
      message: "Phiên đăng nhập đã hết hạn.",
    },
    { status: 401 },
  );
}

export const diagnosticHandlers = [
  http.get("/api/v1/diagnostic-sessions/:sessionId", ({ params, request }) => {
    const url = new URL(request.url);
    const scenario = url.searchParams.get("scenario");

    if (!getStudentSessionFromRequest(request)) {
      return createUnauthorizedResponse();
    }

    if (scenario === "server-unavailable") {
      return HttpResponse.json(
        {
          code: "server_unavailable",
          message: "Máy chủ Mina trong trường hiện chưa sẵn sàng.",
        },
        { status: 503 },
      );
    }

    if (scenario === "not-found") {
      return HttpResponse.json(
        {
          code: "diagnostic_session_not_found",
          message: "Không tìm thấy phiên làm bài này.",
        },
        { status: 404 },
      );
    }

    const session = getDiagnosticSessionFixture(String(params.sessionId));

    if (!session) {
      return HttpResponse.json(
        {
          code: "diagnostic_session_not_found",
          message: "Không tìm thấy phiên làm bài này.",
        },
        { status: 404 },
      );
    }

    return HttpResponse.json(session);
  }),

  http.post("/api/v1/diagnostic-sessions/:sessionId/attempts", async ({ params, request }) => {
    const url = new URL(request.url);
    const scenario = url.searchParams.get("scenario");

    if (!getStudentSessionFromRequest(request)) {
      return createUnauthorizedResponse();
    }

    if (scenario === "server-unavailable") {
      return HttpResponse.json(
        {
          code: "server_unavailable",
          message: "Máy chủ Mina trong trường hiện chưa sẵn sàng.",
        },
        { status: 503 },
      );
    }

    if (scenario === "conflict") {
      return HttpResponse.json(
        {
          code: "attempt_conflict",
          message: "Câu trả lời này đang được xử lý. Hãy thử lại.",
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
          code: "diagnostic_attempt_invalid",
          message: "Câu trả lời này không còn phù hợp với phiên hiện tại.",
        },
        { status: 409 },
      );
    }

    return HttpResponse.json(response);
  }),
];
