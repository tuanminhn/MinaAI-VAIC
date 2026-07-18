import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "vitest-axe";
import { AppErrorBoundary } from "@/app/error-boundary/app-error-boundary";
import { AppErrorFallback } from "@/components/feedback/app-error-fallback";
import { setMockActiveSessionForUserId } from "@/fixtures/auth";
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

  it("renders the app loading shell", async () => {
    renderApp();
    expect(
      await screen.findByText(/Dang khoi phuc phien dang nhap Mina AI|Đang khôi phục phiên đăng nhập Mina AI/i),
    ).toBeInTheDocument();
  });

  it("renders a student route after restoring a student session", async () => {
    setMockActiveSessionForUserId("student-001");
    renderApp(["/student"]);
    expect(
      await screen.findByRole("heading", { name: /Chào em|Chao em/i }),
    ).toBeInTheDocument();
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

    expect(await screen.findByRole("heading", { name: /Đã xảy ra lỗi/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Thử lại|Thu lai/i })).toBeInTheDocument();
  });

  it("renders standalone app error fallback in Vietnamese", () => {
    render(<AppErrorFallback onRetry={() => undefined} />);
    expect(screen.getByText(/Mina AI/i)).toBeInTheDocument();
  });

  it("has no critical accessibility violations on login route", async () => {
    const { container } = renderApp(["/login"]);
    await waitFor(() =>
      expect(
        screen.getByText(/Đăng nhập vào Mina AI|Dang nhap vao Mina AI/i),
      ).toBeInTheDocument(),
    );
    const results = await axe(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });
    expect(results.violations).toHaveLength(0);
  });
});
