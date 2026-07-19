import { HttpResponse, delay, http } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { setMockActiveSessionForUserId } from "@/fixtures/auth";
import {
  getMockEmptyStudentAssignmentsResponse,
  getMockEmptyStudentHomeResponse,
  getMockStudentAssignmentsResponse,
  getMockStudentHomeResponse,
} from "@/fixtures/student";
import { server } from "@/mocks/server";
import { renderApp } from "@/test/render-app";

describe("student home and assignments contract", () => {
  beforeEach(() => {
    setMockActiveSessionForUserId("student-001");
  });

  it("shows a loading state on student home", async () => {
    server.use(
      http.get("*/api/v1/student/home", async () => {
        await delay(60);
        return HttpResponse.json(getMockStudentHomeResponse());
      }),
    );

    const { container } = renderApp(["/student"]);

    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(await screen.findByText(/Chẩn đoán phân số tuần này/i)).toBeInTheDocument();
  });

  it("renders school, classroom, and the current assignment on student home", async () => {
    renderApp(["/student"]);

    expect(await screen.findByText(/Nguyễn Hà Linh/i)).toBeInTheDocument();
    expect(screen.getByText(/Lớp 6A1/i)).toBeInTheDocument();
    expect(screen.getByText(/Trường THCS Mina/i)).toBeInTheDocument();
    expect(screen.getByText(/Chẩn đoán phân số tuần này/i)).toBeInTheDocument();
  });

  it("renders an empty state when the student has no assignments", async () => {
    server.use(
      http.get("*/api/v1/student/home", () =>
        HttpResponse.json(getMockEmptyStudentHomeResponse()),
      ),
    );

    renderApp(["/student"]);

    expect(await screen.findByText(/Hiện em chưa có bài mới\./i)).toBeInTheDocument();
  });

  it("shows a LAN-aware error and retries student home", async () => {
    let shouldFail = true;

    server.use(
      http.get("*/api/v1/student/home", () => {
        if (shouldFail) {
          shouldFail = false;
          return HttpResponse.json(
            {
              code: "SERVER_UNAVAILABLE",
              message: "May chu Mina trong truong hien chua san sang.",
            },
            { status: 503 },
          );
        }

        return HttpResponse.json(getMockStudentHomeResponse());
      }),
    );

    const user = userEvent.setup();
    renderApp(["/student"]);

    expect(await screen.findByRole("button", { name: /thử lại|thu lai/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /thử lại|thu lai/i }));
    expect(await screen.findByText(/Nguyễn Hà Linh/i)).toBeInTheDocument();
  });

  it("redirects to login when student home returns 401", async () => {
    server.use(
      http.get("*/api/v1/auth/me", () =>
        HttpResponse.json(
          {
            code: "AUTH_REQUIRED",
            message: "Ban can dang nhap de tiep tuc.",
          },
          { status: 401 },
        ),
      ),
      http.get("*/api/v1/student/home", () =>
        HttpResponse.json(
          {
            code: "SESSION_EXPIRED",
            message: "Phien dang nhap da het han.",
          },
          { status: 401 },
        ),
      ),
    );

    renderApp(["/student"]);

    expect(
      await screen.findByRole("heading", { name: /Đăng nhập vào Mina AI|Dang nhap vao Mina AI/i }),
    ).toBeInTheDocument();
  });

  it("renders the assignments list", async () => {
    renderApp(["/student/assignments"]);

    expect(
      await screen.findByRole("heading", { name: /Bài được giao|Bai duoc giao/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Chẩn đoán phân số tuần này/i)).toBeInTheDocument();
  });

  it("renders an empty assignments state", async () => {
    server.use(
      http.get("*/api/v1/student/assignments", () =>
        HttpResponse.json(getMockEmptyStudentAssignmentsResponse()),
      ),
    );

    renderApp(["/student/assignments"]);
    expect(await screen.findByText(/Hiện em chưa có bài mới\./i)).toBeInTheDocument();
  });

  it("shows a prepared-state message when diagnostic is unavailable", async () => {
    server.use(
      http.get("*/api/v1/student/home", () =>
        HttpResponse.json({
          ...getMockStudentHomeResponse(),
          currentAssignment: {
            ...getMockStudentHomeResponse().currentAssignment,
            diagnosticAvailable: false,
            nextRoute: null,
          },
        }),
      ),
    );

    renderApp(["/student"]);

    expect(await screen.findByText(/Bài học đang được chuẩn bị\./i)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Tiếp tục Chẩn đoán phân số tuần này/i }),
    ).not.toBeInTheDocument();
  });

  it("starts a diagnostic session when the assignment is available but has no nextRoute", async () => {
    server.use(
      http.get("*/api/v1/student/home", () =>
        HttpResponse.json({
          ...getMockStudentHomeResponse(),
          currentAssignment: {
            ...getMockStudentHomeResponse().currentAssignment,
            id: "assignment-geometry-001",
            title: "Khởi động hình học cơ bản",
            diagnosticAvailable: true,
            nextRoute: null,
          },
        }),
      ),
    );

    const user = userEvent.setup();
    renderApp(["/student"]);

    await user.click(
      await screen.findByRole("button", { name: /Bắt đầu Khởi động hình học cơ bản|Bat dau/i }),
    );

    expect(
      await screen.findByText(/Khởi động hình học cơ bản|Khoi dong hinh hoc co ban/i),
    ).toBeInTheDocument();
  });

  it("does not double-start the diagnostic session on repeated clicks", async () => {
    let startCalls = 0;

    server.use(
      http.get("*/api/v1/student/home", () =>
        HttpResponse.json({
          ...getMockStudentHomeResponse(),
          currentAssignment: {
            ...getMockStudentHomeResponse().currentAssignment,
            id: "assignment-geometry-001",
            title: "Khởi động hình học cơ bản",
            diagnosticAvailable: true,
            nextRoute: null,
          },
        }),
      ),
      http.post("*/api/v1/student/assignments/:assignmentId/diagnostic-sessions", () => {
        startCalls += 1;
        return HttpResponse.json({
          sessionId: "adaptive-unknown-001",
          state: "diagnosing",
          route: "/student/diagnostic/adaptive-unknown-001",
          resumed: false,
        });
      }),
    );

    const user = userEvent.setup();
    renderApp(["/student"]);

    const button = await screen.findByRole("button", {
      name: /Bắt đầu Khởi động hình học cơ bản|Bat dau/i,
    });
    await Promise.all([user.click(button), user.click(button)]);

    expect(startCalls).toBe(1);
  });

  it("shows a LAN-aware start error and allows retry", async () => {
    let shouldFail = true;

    server.use(
      http.get("*/api/v1/student/home", () =>
        HttpResponse.json({
          ...getMockStudentHomeResponse(),
          currentAssignment: {
            ...getMockStudentHomeResponse().currentAssignment,
            id: "assignment-geometry-001",
            title: "Khởi động hình học cơ bản",
            diagnosticAvailable: true,
            nextRoute: null,
          },
        }),
      ),
      http.post("*/api/v1/student/assignments/:assignmentId/diagnostic-sessions", () => {
        if (shouldFail) {
          shouldFail = false;
          return HttpResponse.error();
        }
        return HttpResponse.json({
          sessionId: "adaptive-unknown-001",
          state: "diagnosing",
          route: "/student/diagnostic/adaptive-unknown-001",
          resumed: false,
        });
      }),
    );

    const user = userEvent.setup();
    renderApp(["/student"]);

    const button = await screen.findByRole("button", {
      name: /Bắt đầu Khởi động hình học cơ bản|Bat dau/i,
    });
    await user.click(button);

    expect(
      await screen.findByText(
        /Chưa thể kết nối đến máy chủ Mina trong trường|Chua the ket noi den may chu Mina trong truong/i,
      ),
    ).toBeInTheDocument();

    await user.click(button);
    expect(
      await screen.findByText(/Khởi động hình học cơ bản|Khoi dong hinh hoc co ban/i),
    ).toBeInTheDocument();
  });

  it("supports keyboard activation when a next route exists", async () => {
    const user = userEvent.setup();
    const { container } = renderApp(["/student/assignments"]);

    await waitFor(() =>
      expect(
        container.querySelector<HTMLAnchorElement>(
          'a[href*="/student/diagnostic/diagnostic-fractions-001"]',
        ),
      ).not.toBeNull(),
    );
    const cta = container.querySelector<HTMLAnchorElement>(
      'a[href*="/student/diagnostic/diagnostic-fractions-001"]',
    );
    expect(cta).toBeDefined();

    cta?.focus();
    await user.keyboard("{Enter}");

    expect(await screen.findByRole("radio", { name: "2/4" })).toBeInTheDocument();
  });

  it("renders assignments pagination contract from API", async () => {
    server.use(
      http.get("*/api/v1/student/assignments", ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("page")).toBe("1");
        expect(url.searchParams.get("pageSize")).toBe("10");
        return HttpResponse.json(getMockStudentAssignmentsResponse({ page: 1, pageSize: 10 }));
      }),
    );

    renderApp(["/student/assignments"]);
    expect(await screen.findByText(/Khởi động hình học cơ bản/i)).toBeInTheDocument();
  });

  it("prevents teacher sessions from opening student routes", async () => {
    setMockActiveSessionForUserId("teacher-001");
    renderApp(["/student"]);

    expect(
      await screen.findByRole("heading", { name: /Không có quyền truy cập|Khong co quyen truy cap/i }),
    ).toBeInTheDocument();
  });

  it("has no serious accessibility violations on student home", async () => {
    const { container } = renderApp(["/student"]);
    await waitFor(() => expect(screen.getByText(/Nguyễn Hà Linh/i)).toBeInTheDocument());

    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toHaveLength(0);
  });

  it("has no serious accessibility violations on assignments page", async () => {
    const { container } = renderApp(["/student/assignments"]);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Bài được giao|Bai duoc giao/i }),
      ).toBeInTheDocument(),
    );

    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toHaveLength(0);
  });
});
