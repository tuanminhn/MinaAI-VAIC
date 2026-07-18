import { HttpResponse, http } from "msw";
import type { AuthSession } from "@/contracts/auth";
import type { StudentAssignmentsQuery } from "@/contracts/student";
import { findMockSessionByToken } from "@/fixtures/auth";
import {
  getMockEmptyStudentAssignmentsResponse,
  getMockEmptyStudentHomeResponse,
  getMockStudentAssignmentsResponse,
  getMockStudentHomeResponse,
} from "@/fixtures/student";

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

function parseAssignmentsQuery(request: Request): StudentAssignmentsQuery {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
  const status = url.searchParams.get("status");

  return {
    status: status ? (status as StudentAssignmentsQuery["status"]) : undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10,
  };
}

export const studentHandlers = [
  http.get("/api/v1/student/home", ({ request }) => {
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

    if (scenario === "empty") {
      return HttpResponse.json(getMockEmptyStudentHomeResponse());
    }

    return HttpResponse.json(getMockStudentHomeResponse());
  }),

  http.get("/api/v1/student/assignments", ({ request }) => {
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

    if (scenario === "empty") {
      return HttpResponse.json(getMockEmptyStudentAssignmentsResponse());
    }

    return HttpResponse.json(getMockStudentAssignmentsResponse(parseAssignmentsQuery(request)));
  }),
];
