import { HttpResponse, http } from "msw";
import {
  clearMockActiveSession,
  findMockAccountByCredentials,
  getMockActiveSession,
  setMockActiveSession,
} from "@/fixtures/auth";

export const authHandlers = [
  http.post("*/api/v1/auth/login", async ({ request }) => {
    const url = new URL(request.url);
    const scenario = url.searchParams.get("scenario");

    if (scenario === "server-unavailable") {
      return HttpResponse.json(
        {
          code: "SERVER_UNAVAILABLE",
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
          code: "INVALID_CREDENTIALS",
          message: "Ten dang nhap hoac mat khau khong dung.",
        },
        { status: 401 },
      );
    }

    setMockActiveSession(account.session);

    return HttpResponse.json(account.session, {
      headers: {
        "Set-Cookie": "mina_session=mock-cookie; HttpOnly; Path=/; SameSite=Lax",
      },
    });
  }),

  http.get("*/api/v1/auth/me", ({ request }) => {
    const url = new URL(request.url);
    const scenario = url.searchParams.get("scenario");

    if (scenario === "session-expired") {
      clearMockActiveSession();
      return HttpResponse.json(
        {
          code: "SESSION_EXPIRED",
          message: "Phien dang nhap da het han.",
        },
        { status: 401 },
      );
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

    const session = getMockActiveSession();

    if (!session) {
      return HttpResponse.json(
        {
          code: "AUTH_REQUIRED",
          message: "Ban can dang nhap de tiep tuc.",
        },
        { status: 401 },
      );
    }

    return HttpResponse.json(session.user);
  }),

  http.post("*/api/v1/auth/logout", () => {
    clearMockActiveSession();
    return new HttpResponse(null, {
      status: 204,
      headers: {
        "Set-Cookie": "mina_session=\"\"; HttpOnly; Max-Age=0; Path=/; SameSite=Lax",
      },
    });
  }),
];
