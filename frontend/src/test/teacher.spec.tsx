import { HttpResponse, delay, http } from "msw";
import { screen, waitFor, within } from "@testing-library/react";
import { axe } from "vitest-axe";
import { setMockActiveSessionForUserId } from "@/fixtures/auth";
import { server } from "@/mocks/server";
import { renderApp } from "@/test/render-app";

describe("teacher evidence and analytics MVP", () => {
  beforeEach(() => {
    setMockActiveSessionForUserId("teacher-001");
  });

  it("renders teacher classes on the dashboard", async () => {
    renderApp(["/teacher"]);

    expect(
      await screen.findByRole("heading", { name: /Lớp giáo viên phụ trách|Lop giao vien phu trach/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Lớp 6A1|Lop 6A1/i)).toBeInTheDocument();
  });

  it("renders class detail with assignments and roster", async () => {
    renderApp(["/teacher/classes/class-6a1"]);

    expect(await screen.findByRole("heading", { name: /Lớp 6A1|Lop 6A1/i })).toBeInTheDocument();
    expect(screen.getByText(/Ôn tập phân số|On tap phan so/i)).toBeInTheDocument();
    expect(screen.getByText(/^DIEM$/i)).toBeInTheDocument();
  });

  it("renders assignment overview counts and root cause groups", async () => {
    renderApp(["/teacher/assignments/assignment-fractions-001"]);

    expect(await screen.findByRole("heading", { name: /Ôn tập phân số|On tap phan so/i })).toBeInTheDocument();
    expect(screen.getByText(/Cần hỗ trợ|Can ho tro/i)).toBeInTheDocument();

    const rootCauseSection = screen.getByRole("heading", { name: /Nhóm root cause|Nhom root cause/i });
    const rootCauseCard = rootCauseSection.closest("section");
    expect(rootCauseCard).not.toBeNull();
    expect(
      within(rootCauseCard as HTMLElement).getByText(/Tìm bội chung nhỏ nhất|Tim boi chung nho nhat/i),
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Xem evidence/i })).toBeInTheDocument();
  });

  it("passes assignment student pagination query through to the API", async () => {
    server.use(
      http.get("*/api/v1/teacher/assignments/:assignmentId/students", ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("page")).toBe("1");
        expect(url.searchParams.get("pageSize")).toBe("20");
        return HttpResponse.json({
          items: [
            {
              student: { id: "student-001", displayName: "DIEM" },
              sessionId: "diagnostic-fractions-001",
              assignmentStatus: "completed",
              sessionState: "completed",
              outcome: "masteredAfterRemediation",
              rootCauseSkillName: "Tìm bội chung nhỏ nhất",
              diagnosticAttempts: 8,
              remediationAttempts: 2,
              transferAttempts: 2,
              updatedAt: "2026-07-18T08:30:00Z",
            },
          ],
          page: 1,
          pageSize: 20,
          total: 1,
        });
      }),
    );

    renderApp(["/teacher/assignments/assignment-fractions-001"]);

    expect(await screen.findByText(/^DIEM$/i)).toBeInTheDocument();
  });

  it("renders learning session evidence and attempt timeline", async () => {
    renderApp(["/teacher/sessions/diagnostic-fractions-001"]);

    expect(await screen.findByRole("heading", { name: /^DIEM$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Timeline/i })).toBeInTheDocument();
    expect(screen.getByText(/BCNN của 6 và 8 là số nào/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Đúng|Chưa đúng/i).length).toBeGreaterThan(0);
  });

  it("shows not found when a teacher requests a classroom outside scope", async () => {
    renderApp(["/teacher/classes/class-unknown"]);

    expect(await screen.findByText(/Không tìm thấy lớp học|Khong tim thay lop hoc/i)).toBeInTheDocument();
  });

  it("returns to login when the teacher session expires", async () => {
    server.use(
      http.get("*/api/v1/auth/me", () =>
        HttpResponse.json(
          {
            code: "SESSION_EXPIRED",
            message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          },
          { status: 401 },
        ),
      ),
      http.get("*/api/v1/teacher/classes", () =>
        HttpResponse.json(
          {
            code: "SESSION_EXPIRED",
            message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          },
          { status: 401 },
        ),
      ),
    );

    renderApp(["/teacher"]);

    expect(
      await screen.findByRole("heading", { name: /Đăng nhập vào Mina AI|Dang nhap vao Mina AI/i }),
    ).toBeInTheDocument();
  });

  it("shows a loading state on teacher dashboard", async () => {
    server.use(
      http.get("*/api/v1/teacher/classes", async () => {
        await delay(60);
        return HttpResponse.json({
          items: [
            {
              id: "class-6a1",
              code: "6A1",
              name: "Lớp 6A1",
              grade: 6,
              academicYear: "2026-2027",
              schoolName: "Trường THCS Mina",
              studentCount: 1,
            },
          ],
        });
      }),
    );

    renderApp(["/teacher"]);

    expect(
      await screen.findByText(/Đang tải danh sách lớp học|Dang tai danh sach lop hoc/i),
    ).toBeInTheDocument();
  });

  it("blocks students from teacher routes", async () => {
    setMockActiveSessionForUserId("student-001");
    renderApp(["/teacher"]);

    expect(
      await screen.findByRole("heading", { name: /Không có quyền truy cập|Khong co quyen truy cap/i }),
    ).toBeInTheDocument();
  });

  it("has no serious accessibility violations on the teacher assignment page", async () => {
    const { container } = renderApp(["/teacher/assignments/assignment-fractions-001"]);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Ôn tập phân số|On tap phan so/i }),
      ).toBeInTheDocument(),
    );

    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false } },
    });

    expect(results.violations).toHaveLength(0);
  });
});
