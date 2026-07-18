import { render } from "@testing-library/react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { AppErrorBoundary } from "@/app/error-boundary/app-error-boundary";
import { AppErrorFallback } from "@/components/feedback/app-error-fallback";
import { mockAuthAccounts } from "@/fixtures/auth";
import { authSessionStorage } from "@/features/auth/hooks/auth-session-storage";
import { healthRepository } from "@/repositories/health-repository";
import { renderApp } from "@/test/render-app";

describe("frontend foundation", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the app", async () => {
    renderApp();
    expect(await screen.findByRole("heading", { name: "Dang nhap vao Mina AI" })).toBeInTheDocument();
  });

  it("renders a student route after restoring a student session", async () => {
    authSessionStorage.setAccessToken(mockAuthAccounts[0].session.accessToken);
    renderApp(["/student"]);
    expect(await screen.findByRole("heading", { name: "Chào em, Nguyễn Hà Linh." })).toBeInTheDocument();
  });

  it("renders a teacher route after restoring a teacher session", async () => {
    authSessionStorage.setAccessToken(mockAuthAccounts[1].session.accessToken);
    renderApp(["/teacher"]);
    expect(
      (await screen.findAllByRole("heading", { name: "Tong quan giao vien" })).length,
    ).toBeGreaterThan(0);
  });

  it("routes unknown paths to /404", async () => {
    renderApp(["/khong-ton-tai"]);
    expect(await screen.findByRole("heading", { name: "Khong tim thay trang" })).toBeInTheDocument();
  });

  it("redirects unauthenticated users from protected routes to /login", async () => {
    renderApp(["/student"]);
    expect(await screen.findByRole("heading", { name: "Dang nhap vao Mina AI" })).toBeInTheDocument();
  });

  it("returns mock health data via repository", async () => {
    const response = await healthRepository.get();
    expect(response).toEqual({ status: "ok", service: "frontend-mock" });
  });

  it("shows Vietnamese error fallback", async () => {
    const Thrower = () => {
      throw new Error("boom");
    };

    render(
      <AppErrorBoundary>
        <Thrower />
      </AppErrorBoundary>,
    );

    expect(await screen.findByRole("heading", { name: "Đã xảy ra lỗi" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });

  it("renders standalone app error fallback in Vietnamese", () => {
    render(<AppErrorFallback onRetry={() => undefined} />);
    expect(
      screen.getByText("Mina AI chưa thể hiển thị nội dung này. Bạn có thể thử lại."),
    ).toBeInTheDocument();
  });

  it("has no critical accessibility violations on login route", async () => {
    const { container } = renderApp(["/login"]);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Dang nhap vao Mina AI" })).toBeInTheDocument(),
    );
    const results = await axe(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });
    expect(results.violations).toHaveLength(0);
  });

  it("navigates through authenticated shell links", async () => {
    const user = userEvent.setup();
    authSessionStorage.setAccessToken(mockAuthAccounts[1].session.accessToken);
    renderApp(["/teacher"]);

    const classLinks = await screen.findAllByRole("link", { name: "Lớp học" });
    await user.click(classLinks[0]);
    expect(await screen.findByRole("heading", { name: "Lop hoc" })).toBeInTheDocument();
  });
});
