import { HttpResponse, http } from "msw";
import type { StudentAssignmentsQuery } from "@/contracts/student";
import { getMockActiveSession } from "@/fixtures/auth";
import {
  getMockEmptyStudentAssignmentsResponse,
  getMockEmptyStudentHomeResponse,
  getMockStudentAssignmentsResponse,
  getMockStudentHomeResponse,
} from "@/fixtures/student";

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
  http.get("*/api/v1/student/home", ({ request }) => {
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

    if (scenario === "empty") {
      return HttpResponse.json(getMockEmptyStudentHomeResponse());
    }

    return HttpResponse.json(getMockStudentHomeResponse());
  }),

  http.get("*/api/v1/student/assignments", ({ request }) => {
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

    if (scenario === "empty") {
      return HttpResponse.json(getMockEmptyStudentAssignmentsResponse());
    }

    return HttpResponse.json(getMockStudentAssignmentsResponse(parseAssignmentsQuery(request)));
  }),
];
