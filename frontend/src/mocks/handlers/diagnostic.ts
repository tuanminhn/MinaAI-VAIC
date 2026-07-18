import { HttpResponse, http } from "msw";
import { getMockActiveSession } from "@/fixtures/auth";
import {
  getDiagnosticSessionFixture,
  getRemediationFixture,
  getResultFixture,
  getTransferFixture,
  submitDiagnosticFixtureAttempt,
  submitRemediationFixtureAttempt,
  submitTransferFixtureAttempt,
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

function createServerUnavailableResponse() {
  return HttpResponse.json(
    {
      code: "SERVER_UNAVAILABLE",
      message: "May chu Mina trong truong hien chua san sang.",
    },
    { status: 503 },
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
      return createServerUnavailableResponse();
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

  http.post("*/api/v1/diagnostic-sessions/:sessionId/attempts", async ({ params, request }) => {
    const url = new URL(request.url);
    const scenario = url.searchParams.get("scenario");

    if (!getStudentSession()) {
      return createUnauthorizedResponse();
    }

    if (scenario === "server-unavailable") {
      return createServerUnavailableResponse();
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
      clientAttemptId?: string;
    };

    const response = submitDiagnosticFixtureAttempt(String(params.sessionId), {
      questionId: body.questionId ?? "",
      selectedOptionId: body.selectedOptionId ?? "",
      clientAttemptId: body.clientAttemptId ?? "",
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
  }),

  http.post("*/api/v1/diagnostic-sessions/:sessionId/remediation-runs", ({ params }) => {
    if (!getStudentSession()) {
      return createUnauthorizedResponse();
    }

    return HttpResponse.json({
      sessionId: String(params.sessionId),
      runId: "remediation-run-001",
      cycleNumber: 1,
      state: "in_remediation",
      route: `/student/remediation/${String(params.sessionId)}`,
      resumed: false,
    });
  }),

  http.get("*/api/v1/diagnostic-sessions/:sessionId/remediation", ({ params, request }) => {
    const url = new URL(request.url);
    const scenario = url.searchParams.get("scenario");

    if (!getStudentSession()) {
      return createUnauthorizedResponse();
    }

    if (scenario === "server-unavailable") {
      return createServerUnavailableResponse();
    }

    const response = getRemediationFixture(String(params.sessionId));
    if (!response) {
      return HttpResponse.json(
        {
          code: "DIAGNOSTIC_SESSION_NOT_FOUND",
          message: "Khong tim thay phien hoc nay.",
        },
        { status: 404 },
      );
    }

    return HttpResponse.json(response);
  }),

  http.post(
    "*/api/v1/diagnostic-sessions/:sessionId/remediation/attempts",
    async ({ params, request }) => {
      if (!getStudentSession()) {
        return createUnauthorizedResponse();
      }

      const body = (await request.json()) as {
        questionId?: string;
        selectedOptionId?: string;
        clientAttemptId?: string;
      };

      const response = submitRemediationFixtureAttempt(String(params.sessionId), {
        questionId: body.questionId ?? "",
        selectedOptionId: body.selectedOptionId ?? "",
        clientAttemptId: body.clientAttemptId ?? "",
      });

      if (!response) {
        return HttpResponse.json(
          {
            code: "QUESTION_NOT_CURRENT",
            message: "Cau hoi nay khong con la cau hoi hien tai.",
          },
          { status: 409 },
        );
      }

      return HttpResponse.json(response);
    },
  ),

  http.post("*/api/v1/diagnostic-sessions/:sessionId/transfer-checks", ({ params }) => {
    if (!getStudentSession()) {
      return createUnauthorizedResponse();
    }

    return HttpResponse.json({
      sessionId: String(params.sessionId),
      transferCheckId: "transfer-check-001",
      cycleNumber: 1,
      state: "transfer_ready",
      route: `/student/transfer/${String(params.sessionId)}`,
      resumed: false,
    });
  }),

  http.get("*/api/v1/diagnostic-sessions/:sessionId/transfer", ({ params, request }) => {
    const url = new URL(request.url);
    const scenario = url.searchParams.get("scenario");

    if (!getStudentSession()) {
      return createUnauthorizedResponse();
    }

    if (scenario === "server-unavailable") {
      return createServerUnavailableResponse();
    }

    const response = getTransferFixture(String(params.sessionId));
    if (!response) {
      return HttpResponse.json(
        {
          code: "DIAGNOSTIC_SESSION_NOT_FOUND",
          message: "Khong tim thay phien hoc nay.",
        },
        { status: 404 },
      );
    }

    return HttpResponse.json(response);
  }),

  http.post("*/api/v1/diagnostic-sessions/:sessionId/transfer/attempts", async ({ params, request }) => {
    if (!getStudentSession()) {
      return createUnauthorizedResponse();
    }

    const body = (await request.json()) as {
      questionId?: string;
      selectedOptionId?: string;
      clientAttemptId?: string;
    };

    const response = submitTransferFixtureAttempt(String(params.sessionId), {
      questionId: body.questionId ?? "",
      selectedOptionId: body.selectedOptionId ?? "",
      clientAttemptId: body.clientAttemptId ?? "",
    });

    if (!response) {
      return HttpResponse.json(
        {
          code: "QUESTION_NOT_CURRENT",
          message: "Cau hoi nay khong con la cau hoi hien tai.",
        },
        { status: 409 },
      );
    }

    return HttpResponse.json(response);
  }),

  http.get("*/api/v1/diagnostic-sessions/:sessionId/result", ({ params, request }) => {
    const url = new URL(request.url);
    const scenario = url.searchParams.get("scenario");

    if (!getStudentSession()) {
      return createUnauthorizedResponse();
    }

    if (scenario === "server-unavailable") {
      return createServerUnavailableResponse();
    }

    const response = getResultFixture(String(params.sessionId));
    if (!response) {
      return HttpResponse.json(
        {
          code: "DIAGNOSTIC_SESSION_NOT_FOUND",
          message: "Khong tim thay phien hoc nay.",
        },
        { status: 404 },
      );
    }

    return HttpResponse.json(response);
  }),
];
