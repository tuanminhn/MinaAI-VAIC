import { HttpResponse, delay, http } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { mockAuthAccounts } from "@/fixtures/auth";
import {
  getMockEmptyStudentAssignmentsResponse,
  getMockEmptyStudentHomeResponse,
  getMockStudentAssignmentsResponse,
  getMockStudentHomeResponse,
} from "@/fixtures/student";
import { authSessionStorage } from "@/features/auth/hooks/auth-session-storage";
import { server } from "@/mocks/server";
import { renderApp } from "@/test/render-app";

describe("student home and assignments contract", () => {
  beforeEach(() => {
    authSessionStorage.setAccessToken(mockAuthAccounts[0].session.accessToken);
  });

  it("shows a loading state on student home", async () => {
    server.use(
      http.get("/api/v1/student/home", async () => {
        await delay(60);
        return HttpResponse.json(getMockStudentHomeResponse());
      }),
    );

    renderApp(["/student"]);

    expect(await screen.findByLabelText("Đang tải bài hiện tại")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Chào em, Nguyễn Hà Linh." })).toBeInTheDocument();
  });

  it("renders the current assignment on student home", async () => {
    renderApp(["/student"]);

    expect(await screen.findByRole("heading", { name: "Chào em, Nguyễn Hà Linh." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Chẩn đoán phân số tuần này" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tiếp tục Chẩn đoán phân số tuần này" })).toHaveAttribute(
      "href",
      "/student/diagnostic/diagnostic-fractions-001",
    );
  });

  it("renders an empty state when the student has no assignments", async () => {
    server.use(
      http.get("/api/v1/student/home", () => HttpResponse.json(getMockEmptyStudentHomeResponse())),
    );

    renderApp(["/student"]);

    expect(await screen.findByText("Hiện em chưa có bài mới.")).toBeInTheDocument();
    expect(
      screen.getByText("Khi giáo viên giao bài, bài học sẽ xuất hiện tại đây."),
    ).toBeInTheDocument();
  });

  it("shows a LAN-aware error and retries student home", async () => {
    let shouldFail = true;

    server.use(
      http.get("/api/v1/student/home", () => {
        if (shouldFail) {
          shouldFail = false;
          return HttpResponse.json(
            {
              code: "server_unavailable",
              message: "Máy chủ Mina trong trường hiện chưa sẵn sàng.",
            },
            { status: 503 },
          );
        }

        return HttpResponse.json(getMockStudentHomeResponse());
      }),
    );

    const user = userEvent.setup();
    renderApp(["/student"]);

    expect(await screen.findByRole("heading", { name: "Chưa thể tải bài được giao" })).toBeInTheDocument();
    expect(screen.getByText(/máy chủ Mina trong trường/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Thử lại" }));

    expect(await screen.findByRole("heading", { name: "Chào em, Nguyễn Hà Linh." })).toBeInTheDocument();
  });

  it("renders the assignments list", async () => {
    renderApp(["/student/assignments"]);

    expect(await screen.findByRole("heading", { name: "Bài được giao" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Chẩn đoán phân số tuần này" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Khởi động hình học cơ bản" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ôn lại số nguyên" })).toBeInTheDocument();
  });

  it("renders an empty assignments state", async () => {
    server.use(
      http.get("/api/v1/student/assignments", () =>
        HttpResponse.json(getMockEmptyStudentAssignmentsResponse()),
      ),
    );

    renderApp(["/student/assignments"]);

    expect(await screen.findByText("Hiện em chưa có bài mới.")).toBeInTheDocument();
  });

  it("maps assignment statuses to Vietnamese labels", async () => {
    renderApp(["/student/assignments"]);

    expect(await screen.findByText("Chưa bắt đầu")).toBeInTheDocument();
    expect(screen.getByText("Đang thực hiện")).toBeInTheDocument();
    expect(screen.getByText("Đang củng cố kiến thức")).toBeInTheDocument();
    expect(screen.getByText("Sẵn sàng kiểm tra lại")).toBeInTheDocument();
    expect(screen.getByText("Đã hoàn thành")).toBeInTheDocument();
  });

  it("exposes progress semantics for assistive technology", async () => {
    renderApp(["/student"]);

    const progressBars = await screen.findAllByRole("progressbar", { name: "Tiến độ" });
    expect(progressBars[0]).toHaveAttribute("aria-valuenow", "4");
    expect(progressBars[0]).toHaveAttribute("aria-valuemax", "10");
    expect(progressBars[0]).toHaveAttribute("aria-valuetext", "4/10 câu đã hoàn thành");
  });

  it("navigates from assignment CTA to the diagnostic player", async () => {
    const user = userEvent.setup();
    renderApp(["/student"]);

    await user.click(await screen.findByRole("link", { name: "Tiếp tục Chẩn đoán phân số tuần này" }));

    expect(await screen.findByRole("heading", { name: "Chẩn đoán phân số tuần này" })).toBeInTheDocument();
    expect(screen.getByText("Trong các phân số sau, phân số nào bằng 1/2?")).toBeInTheDocument();
  });

  it("keeps student navigation links live", async () => {
    const user = userEvent.setup();
    renderApp(["/student"]);

    await user.click(await screen.findByRole("link", { name: "Xem tất cả bài được giao" }));
    expect(await screen.findByRole("heading", { name: "Bài được giao" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Bắt đầu Khởi động hình học cơ bản" }));
    expect(await screen.findByRole("heading", { name: "Khởi động hình học cơ bản" })).toBeInTheDocument();
  });

  it("supports keyboard activation on student home", async () => {
    const user = userEvent.setup();
    renderApp(["/student"]);

    const cta = await screen.findByRole("link", { name: "Tiếp tục Chẩn đoán phân số tuần này" });
    cta.focus();
    expect(cta).toHaveFocus();

    await user.keyboard("{Enter}");

    expect(await screen.findByText("Trong các phân số sau, phân số nào bằng 1/2?")).toBeInTheDocument();
  });

  it("has no serious accessibility violations on student home", async () => {
    const { container } = renderApp(["/student"]);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Chào em, Nguyễn Hà Linh." })).toBeInTheDocument(),
    );
    const results = await axe(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });
    expect(results.violations).toHaveLength(0);
  });

  it("has no serious accessibility violations on assignments page", async () => {
    const { container } = renderApp(["/student/assignments"]);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Bài được giao" })).toBeInTheDocument(),
    );
    const results = await axe(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });
    expect(results.violations).toHaveLength(0);
  });

  it("prevents teacher sessions from opening student routes", async () => {
    authSessionStorage.setAccessToken(mockAuthAccounts[1].session.accessToken);
    renderApp(["/student"]);

    expect(await screen.findByRole("heading", { name: "Khong co quyen truy cap" })).toBeInTheDocument();
  });

  it("returns contract-shaped assignment data from the fixture path", () => {
    const response = getMockStudentAssignmentsResponse({ page: 1, pageSize: 10 });

    expect(response.items[0]).toMatchObject({
      title: "Chẩn đoán phân số tuần này",
      nextRoute: "/student/diagnostic/diagnostic-fractions-001",
      status: "in_progress",
    });
    expect(response.items[1]).toMatchObject({
      title: "Khởi động hình học cơ bản",
      nextRoute: "/student/diagnostic/adaptive-unknown-001",
      status: "not_started",
    });
  });
});
