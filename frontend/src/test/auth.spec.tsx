import { HttpResponse, http } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { axe } from "vitest-axe";
import {
  clearMockActiveSession,
  mockAuthAccounts,
  setMockActiveSession,
  setMockActiveSessionForUserId,
} from "@/fixtures/auth";
import { server } from "@/mocks/server";
import { renderApp } from "@/test/render-app";

async function waitForLoginReady() {
  return screen.findByLabelText(/Tên đăng nhập|Ten dang nhap/i);
}

describe("basic authentication UI and role-aware app shell", () => {
  it("renders the login page", async () => {
    renderApp(["/login"]);

    expect(await waitForLoginReady()).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Đăng nhập vào Mina AI|Dang nhap vao Mina AI/i }),
    ).toBeInTheDocument();
  });

  it("validates required form fields", async () => {
    const user = userEvent.setup();
    renderApp(["/login"]);

    await waitForLoginReady();
    await user.click(screen.getByRole("button", { name: /^Đăng nhập$|^Dang nhap$/i }));

    expect(
      await screen.findByText(/Vui lòng nhập tên đăng nhập|Vui long nhap ten dang nhap/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Vui lòng nhập mật khẩu|Vui long nhap mat khau/i)).toBeInTheDocument();
  });

  it("submits the form with Enter and redirects student", async () => {
    const user = userEvent.setup();
    renderApp(["/login"]);

    const usernameInput = await waitForLoginReady();
    await user.type(usernameInput, mockAuthAccounts[0].credentials.username);
    await user.type(
      screen.getByLabelText(/^Mật khẩu$|^Mat khau$/i),
      `${mockAuthAccounts[0].credentials.password}{Enter}`,
    );

    expect(await screen.findByText(/Nguyen Ha Linh/i)).toBeInTheDocument();
  });

  it("redirects teacher login to /teacher", async () => {
    const user = userEvent.setup();
    renderApp(["/login"]);

    const usernameInput = await waitForLoginReady();
    await user.type(usernameInput, mockAuthAccounts[1].credentials.username);
    await user.type(
      screen.getByLabelText(/^Mật khẩu$|^Mat khau$/i),
      mockAuthAccounts[1].credentials.password,
    );
    await user.click(screen.getByRole("button", { name: /^Đăng nhập$|^Dang nhap$/i }));

    expect(
      await screen.findByRole("heading", { name: /Lớp giáo viên phụ trách|Lop giao vien phu trach/i }),
    ).toBeInTheDocument();
  });

  it("shows an invalid credential error and keeps the username", async () => {
    const user = userEvent.setup();
    renderApp(["/login"]);

    const usernameInput = await waitForLoginReady();
    const passwordInput = screen.getByLabelText(/^Mật khẩu$|^Mat khau$/i);

    await user.type(usernameInput, "sai.tai.khoan");
    await user.type(passwordInput, "khong-dung");
    await user.click(screen.getByRole("button", { name: /^Đăng nhập$|^Dang nhap$/i }));

    expect(
      await screen.findByText(/Đăng nhập chưa thành công|Dang nhap chua thanh cong/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Tên đăng nhập hoặc mật khẩu không đúng|Ten dang nhap hoac mat khau khong dung/i),
    ).toBeInTheDocument();
    expect(usernameInput).toHaveValue("sai.tai.khoan");
    expect(passwordInput).toHaveValue("");
  });

  it("shows a LAN-aware network error message", async () => {
    server.use(http.post("*/api/v1/auth/login", () => HttpResponse.error()));

    const user = userEvent.setup();
    renderApp(["/login"]);

    const usernameInput = await waitForLoginReady();
    await user.type(usernameInput, mockAuthAccounts[0].credentials.username);
    await user.type(
      screen.getByLabelText(/^Mật khẩu$|^Mat khau$/i),
      mockAuthAccounts[0].credentials.password,
    );
    await user.click(screen.getByRole("button", { name: /^Đăng nhập$|^Dang nhap$/i }));

    expect(
      await screen.findByText(/Không thể kết nối máy chủ Mina|Khong the ket noi may chu Mina/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Không thể kết nối đến máy chủ Mina trong trường|Khong the ket noi den may chu Mina trong truong/i,
      ),
    ).toBeInTheDocument();
  });

  it("accepts nullable optional auth fields from backend and still redirects", async () => {
    clearMockActiveSession();

    const session = {
      user: {
        id: "student-002",
        displayName: "Pham Gia Han",
        role: "student" as const,
        schoolName: null,
        classroomName: null,
      },
    };

    server.use(
      http.post("*/api/v1/auth/login", () => {
        setMockActiveSession(session);
        return HttpResponse.json(session);
      }),
    );

    const user = userEvent.setup();
    renderApp(["/login"]);

    const usernameInput = await waitForLoginReady();
    await user.type(usernameInput, mockAuthAccounts[0].credentials.username);
    await user.type(
      screen.getByLabelText(/^Mật khẩu$|^Mat khau$/i),
      mockAuthAccounts[0].credentials.password,
    );
    await user.click(screen.getByRole("button", { name: /^Đăng nhập$|^Dang nhap$/i }));

    expect(await screen.findByText(/Pham Gia Han/i)).toBeInTheDocument();
  });

  it("maps invalid auth payloads to a safe UI error and logs AUTH_RESPONSE_INVALID", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    server.use(
      http.post("*/api/v1/auth/login", () =>
        HttpResponse.json({
          user: {
            id: "student-003",
            displayName: "Le Minh Trang",
            schoolName: null,
            classroomName: null,
          },
        }),
      ),
    );

    const user = userEvent.setup();
    renderApp(["/login"]);

    try {
      const usernameInput = await waitForLoginReady();
      await user.type(usernameInput, mockAuthAccounts[0].credentials.username);
      await user.type(
        screen.getByLabelText(/^Mật khẩu$|^Mat khau$/i),
        mockAuthAccounts[0].credentials.password,
      );
      await user.click(screen.getByRole("button", { name: /^Đăng nhập$|^Dang nhap$/i }));

      expect(await screen.findByText(/Không thể đăng nhập|Khong the dang nhap/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /Hệ thống Mina tạm thời chưa thể xử lý yêu cầu đăng nhập. Hãy thử lại.|He thong Mina tam thoi chua the xu ly yeu cau dang nhap. Hay thu lai./i,
        ),
      ).toBeInTheDocument();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "login: AUTH_RESPONSE_INVALID",
        expect.any(Object),
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("restores a server-side session on refresh", async () => {
    setMockActiveSessionForUserId("student-001");
    renderApp(["/student/assignments"]);

    expect(await screen.findByText(/Nguyen Ha Linh/i)).toBeInTheDocument();
  });

  it("logs out and returns to login", async () => {
    const user = userEvent.setup();
    setMockActiveSessionForUserId("student-001");
    renderApp(["/student"]);

    const [logoutButton] = await screen.findAllByRole("button", {
      name: /Đăng xuất|Dang xuat/i,
    });
    await user.click(logoutButton);

    expect(await waitForLoginReady()).toBeInTheDocument();
  });

  it("blocks role-mismatched routes", async () => {
    setMockActiveSessionForUserId("student-001");
    renderApp(["/teacher"]);

    expect(
      await screen.findByText(/Không có quyền truy cập|Khong co quyen truy cap/i),
    ).toBeInTheDocument();
  });

  it("redirects authenticated users away from /login", async () => {
    setMockActiveSessionForUserId("teacher-001");
    renderApp(["/login"]);

    expect(
      await screen.findByRole("heading", { name: /Lớp giáo viên phụ trách|Lop giao vien phu trach/i }),
    ).toBeInTheDocument();
  });

  it("has no serious accessibility violations on the login page", async () => {
    const { container } = renderApp(["/login"]);
    await waitForLoginReady();

    const results = await axe(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });

    expect(results.violations).toHaveLength(0);
  });

  it("has no serious accessibility violations on the student shell", async () => {
    setMockActiveSessionForUserId("student-001");
    const { container } = renderApp(["/student"]);

    await waitFor(() => expect(screen.getByText(/Nguyen Ha Linh/i)).toBeInTheDocument());

    const results = await axe(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });

    expect(results.violations).toHaveLength(0);
  });
});
