import { HttpResponse, http } from "msw";
import { findMockAccountByCredentials, findMockSessionByToken } from "@/fixtures/auth";

function getBearerToken(headerValue: string | null): string | null {
  if (!headerValue) {
    return null;
  }

  const [scheme, token] = headerValue.split(" ");
  return scheme === "Bearer" && token ? token : null;
}

export const authHandlers = [
  http.post("/api/v1/auth/login", async ({ request }) => {
    const url = new URL(request.url);
    const scenario = url.searchParams.get("scenario");

    if (scenario === "server-unavailable") {
      return HttpResponse.json(
        {
          code: "server_unavailable",
          message: "May chu Mina trong truong hien chua san sang.",
        },
        { status: 503 },
      );
    }

    const body = (await request.json()) as { username?: string; password?: string };
    const account = findMockAccountByCredentials({
      username: body.username ?? "",
      password: body.password ?? "",
    });

    if (!account) {
      return HttpResponse.json(
        {
          code: "invalid_credentials",
          message: "Ten dang nhap hoac mat khau khong dung.",
        },
        { status: 401 },
      );
    }

    return HttpResponse.json(account.session);
  }),

  http.get("/api/v1/auth/me", ({ request }) => {
    const url = new URL(request.url);
    const scenario = url.searchParams.get("scenario");

    if (scenario === "session-expired") {
      return HttpResponse.json(
        {
          code: "session_expired",
          message: "Phien dang nhap da het han.",
        },
        { status: 401 },
      );
    }

    if (scenario === "server-unavailable") {
      return HttpResponse.json(
        {
          code: "server_unavailable",
          message: "May chu Mina trong truong hien chua san sang.",
        },
        { status: 503 },
      );
    }

    const accessToken = getBearerToken(request.headers.get("authorization"));

    if (!accessToken) {
      return HttpResponse.json(
        {
          code: "session_expired",
          message: "Phien dang nhap da het han.",
        },
        { status: 401 },
      );
    }

    const session = findMockSessionByToken(accessToken);

    if (!session) {
      return HttpResponse.json(
        {
          code: "session_expired",
          message: "Phien dang nhap da het han.",
        },
        { status: 401 },
      );
    }

    return HttpResponse.json(session.user);
  }),

  http.post("/api/v1/auth/logout", ({ request }) => {
    const accessToken = getBearerToken(request.headers.get("authorization"));

    if (!accessToken) {
      return HttpResponse.json(
        {
          code: "session_expired",
          message: "Phien dang nhap da het han.",
        },
        { status: 401 },
      );
    }

    return new HttpResponse(null, { status: 204 });
  }),
];
