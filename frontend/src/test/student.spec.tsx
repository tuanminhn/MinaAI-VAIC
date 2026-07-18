import { HttpResponse, delay, http } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { setMockActiveSessionForUserId } from "@/fixtures/auth";
import {
  getMockEmptyStudentAssignmentsResponse,
  getMockEmptyStudentHomeResponse,
  getMockStudentAssignmentsResponse,
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
        return HttpResponse.json({
          student: {
            id: "student-001",
            displayName: "Nguyen Ha Linh",
            classroomName: "6A1",
          },
          currentAssignment: getMockStudentAssignmentsResponse({ page: 1, pageSize: 10 }).items[0],
          recentAssignments: getMockStudentAssignmentsResponse({ page: 1, pageSize: 10 }).items.slice(
            0,
            2,
          ),
        });
      }),
    );

    renderApp(["/student"]);

    expect(await screen.findByText(/Dang tai noi dung|Dang tai/i)).toBeInTheDocument();
  });

  it("renders the current assignment on student home", async () => {
    renderApp(["/student"]);
    expect(await screen.findByText(/Nguyen Ha Linh/i)).toBeInTheDocument();
  });

  it("renders an empty state when the student has no assignments", async () => {
    server.use(
      http.get("*/api/v1/student/home", () => HttpResponse.json(getMockEmptyStudentHomeResponse())),
    );

    renderApp(["/student"]);

    expect(await screen.findByText(/Hien em chua co bai moi/i)).toBeInTheDocument();
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

        return HttpResponse.json({
          student: {
            id: "student-001",
            displayName: "Nguyen Ha Linh",
            classroomName: "6A1",
          },
          currentAssignment: getMockStudentAssignmentsResponse({ page: 1, pageSize: 10 }).items[0],
          recentAssignments: getMockStudentAssignmentsResponse({ page: 1, pageSize: 10 }).items.slice(
            0,
            2,
          ),
        });
      }),
    );

    const user = userEvent.setup();
    renderApp(["/student"]);

    expect(await screen.findByRole("button", { name: /Thu lai/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Thu lai/i }));
    expect(await screen.findByText(/Nguyen Ha Linh/i)).toBeInTheDocument();
  });

  it("renders the assignments list", async () => {
    renderApp(["/student/assignments"]);
    expect(await screen.findByRole("heading", { name: /Bai duoc giao/i })).toBeInTheDocument();
  });

  it("renders an empty assignments state", async () => {
    server.use(
      http.get("*/api/v1/student/assignments", () =>
        HttpResponse.json(getMockEmptyStudentAssignmentsResponse()),
      ),
    );

    renderApp(["/student/assignments"]);
    expect(await screen.findByText(/Hien em chua co bai moi/i)).toBeInTheDocument();
  });

  it("supports keyboard activation on student home", async () => {
    const user = userEvent.setup();
    renderApp(["/student"]);

    const [cta] = await screen.findAllByRole("link", {
      name: /Tiep tuc|Bat dau|Xem ket qua/i,
    });
    cta.focus();
    await user.keyboard("{Enter}");

    expect(await screen.findByRole("radio", { name: "2/4" })).toBeInTheDocument();
  });

  it("has no serious accessibility violations on student home", async () => {
    const { container } = renderApp(["/student"]);
    await waitFor(() => expect(screen.getByText(/Nguyen Ha Linh/i)).toBeInTheDocument());
    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toHaveLength(0);
  });

  it("has no serious accessibility violations on assignments page", async () => {
    const { container } = renderApp(["/student/assignments"]);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /Bai duoc giao/i })).toBeInTheDocument(),
    );
    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toHaveLength(0);
  });

  it("prevents teacher sessions from opening student routes", async () => {
    setMockActiveSessionForUserId("teacher-001");
    renderApp(["/student"]);
    expect(await screen.findByRole("heading", { name: /Khong co quyen truy cap/i })).toBeInTheDocument();
  });
});
