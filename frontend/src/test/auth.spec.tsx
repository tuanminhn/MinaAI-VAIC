import { HttpResponse, http } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { mockAuthAccounts } from "@/fixtures/auth";
import { authSessionStorage } from "@/features/auth/hooks/auth-session-storage";
import { server } from "@/mocks/server";
import { renderApp } from "@/test/render-app";

describe("basic authentication UI and role-aware app shell", () => {
  it("renders the login page", async () => {
    renderApp(["/login"]);
    expect(await screen.findByRole("heading", { name: "Dang nhap vao Mina AI" })).toBeInTheDocument();
  });

  it("validates required form fields", async () => {
    const user = userEvent.setup();
    renderApp(["/login"]);

    await user.click(await screen.findByRole("button", { name: "Dang nhap" }));

    expect(await screen.findByText("Vui long nhap ten dang nhap.")).toBeInTheDocument();
    expect(await screen.findByText("Vui long nhap mat khau.")).toBeInTheDocument();
  });

  it("submits the form with Enter", async () => {
    const user = userEvent.setup();
    renderApp(["/login"]);

    await user.type(await screen.findByLabelText("Ten dang nhap"), mockAuthAccounts[0].credentials.username);
    await user.type(screen.getByLabelText("Mat khau"), `${mockAuthAccounts[0].credentials.password}{Enter}`);

    expect(await screen.findByRole("heading", { name: "Chào em, Nguyễn Hà Linh." })).toBeInTheDocument();
  });

  it("redirects student login to /student", async () => {
    const user = userEvent.setup();
    renderApp(["/login"]);

    await user.type(await screen.findByLabelText("Ten dang nhap"), mockAuthAccounts[0].credentials.username);
    await user.type(screen.getByLabelText("Mat khau"), mockAuthAccounts[0].credentials.password);
    await user.click(screen.getByRole("button", { name: "Dang nhap" }));

    expect(await screen.findByRole("heading", { name: "Chào em, Nguyễn Hà Linh." })).toBeInTheDocument();
  });

  it("redirects teacher login to /teacher", async () => {
    const user = userEvent.setup();
    renderApp(["/login"]);

    await user.type(await screen.findByLabelText("Ten dang nhap"), mockAuthAccounts[1].credentials.username);
    await user.type(screen.getByLabelText("Mat khau"), mockAuthAccounts[1].credentials.password);
    await user.click(screen.getByRole("button", { name: "Dang nhap" }));

    expect(await screen.findByRole("heading", { name: "Tong quan giao vien" })).toBeInTheDocument();
  });

  it("shows an invalid credential error and keeps the username", async () => {
    const user = userEvent.setup();
    renderApp(["/login"]);

    const usernameInput = await screen.findByLabelText("Ten dang nhap");
    const passwordInput = screen.getByLabelText("Mat khau");

    await user.type(usernameInput, "sai.tai.khoan");
    await user.type(passwordInput, "khong-dung");
    await user.click(screen.getByRole("button", { name: "Dang nhap" }));

    expect(await screen.findByText("Ten dang nhap hoac mat khau khong dung.")).toBeInTheDocument();
    expect(usernameInput).toHaveValue("sai.tai.khoan");
    expect(passwordInput).toHaveValue("");
  });

  it("shows a LAN-aware network error message", async () => {
    server.use(
      http.post("/api/v1/auth/login", () => {
        return HttpResponse.error();
      }),
    );

    const user = userEvent.setup();
    renderApp(["/login"]);

    await user.type(await screen.findByLabelText("Ten dang nhap"), mockAuthAccounts[0].credentials.username);
    await user.type(screen.getByLabelText("Mat khau"), mockAuthAccounts[0].credentials.password);
    await user.click(screen.getByRole("button", { name: "Dang nhap" }));

    expect(
      await screen.findByText(/Khong the ket noi den may chu Mina trong truong/i),
    ).toBeInTheDocument();
  });

  it("restores a stored session on refresh", async () => {
    authSessionStorage.setAccessToken(mockAuthAccounts[0].session.accessToken);
    renderApp(["/student/assignments"]);
    expect(await screen.findByRole("heading", { name: "Bài được giao" })).toBeInTheDocument();
  });

  it("logs out and returns to login", async () => {
    const user = userEvent.setup();
    authSessionStorage.setAccessToken(mockAuthAccounts[0].session.accessToken);
    renderApp(["/student"]);

    const logoutButtons = await screen.findAllByRole("button", { name: "Đăng xuất" });
    await user.click(logoutButtons[0]);

    expect(await screen.findByRole("heading", { name: "Dang nhap vao Mina AI" })).toBeInTheDocument();
    expect(authSessionStorage.getAccessToken()).toBeNull();
  });

  it("blocks a student from teacher routes", async () => {
    authSessionStorage.setAccessToken(mockAuthAccounts[0].session.accessToken);
    renderApp(["/teacher"]);
    expect(await screen.findByRole("heading", { name: "Khong co quyen truy cap" })).toBeInTheDocument();
  });

  it("blocks a teacher from student routes", async () => {
    authSessionStorage.setAccessToken(mockAuthAccounts[1].session.accessToken);
    renderApp(["/student"]);
    expect(await screen.findByRole("heading", { name: "Khong co quyen truy cap" })).toBeInTheDocument();
  });

  it("redirects authenticated users away from /login", async () => {
    authSessionStorage.setAccessToken(mockAuthAccounts[1].session.accessToken);
    renderApp(["/login"]);
    expect(await screen.findByRole("heading", { name: "Tong quan giao vien" })).toBeInTheDocument();
  });

  it("shows a notice when a stored session has expired", async () => {
    server.use(
      http.get("/api/v1/auth/me", () =>
        HttpResponse.json(
          {
            code: "session_expired",
            message: "Phien dang nhap da het han.",
          },
          { status: 401 },
        ),
      ),
    );

    authSessionStorage.setAccessToken(mockAuthAccounts[0].session.accessToken);
    renderApp(["/student"]);

    expect(await screen.findByRole("heading", { name: "Dang nhap vao Mina AI" })).toBeInTheDocument();
    expect(await screen.findByText("Vui long dang nhap lai de tiep tuc su dung Mina AI.")).toBeInTheDocument();
  });

  it("has no serious accessibility violations on the login page", async () => {
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

  it("has no serious accessibility violations on the student shell", async () => {
    authSessionStorage.setAccessToken(mockAuthAccounts[0].session.accessToken);
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

  it("has no serious accessibility violations on the teacher shell", async () => {
    authSessionStorage.setAccessToken(mockAuthAccounts[1].session.accessToken);
    const { container } = renderApp(["/teacher"]);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Tong quan giao vien" })).toBeInTheDocument(),
    );
    const results = await axe(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });
    expect(results.violations).toHaveLength(0);
  });
});
