import { HttpResponse, delay, http } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { setMockActiveSessionForUserId } from "@/fixtures/auth";
import { server } from "@/mocks/server";
import { renderApp } from "@/test/render-app";

describe("minimal diagnostic player contract", () => {
  beforeEach(() => {
    setMockActiveSessionForUserId("student-001");
  });

  it("shows a loading state while the diagnostic session is loading", async () => {
    server.use(
      http.get("/api/v1/diagnostic-sessions/:sessionId", async ({ params }) => {
        await delay(60);
        return HttpResponse.json({
          id: String(params.sessionId),
          assignmentId: "assignment-fractions-001",
          assignmentTitle: "Chan doan phan so tuan nay",
          state: "diagnosing",
          progress: {
            answered: 1,
            estimatedTotal: 4,
          },
          currentQuestion: {
            id: "question-fractions-002",
            prompt: "Trong cac phan so sau, phan so nao bang 1/2?",
            selectionMode: "single",
            options: [
              { id: "option-a", label: "2/4" },
              { id: "option-b", label: "3/4" },
            ],
          },
        });
      }),
    );

    renderApp(["/student/diagnostic/diagnostic-fractions-001"]);
    expect(
      await screen.findByText(/Đang tải nội dung|Dang tai noi dung|Đang tải|Dang tai/i),
    ).toBeInTheDocument();
  });

  it("renders the diagnostic question", async () => {
    renderApp(["/student/diagnostic/diagnostic-fractions-001"]);
    expect(await screen.findByRole("radio", { name: "2/4" })).toBeInTheDocument();
  });

  it("supports keyboard interaction on radio options", async () => {
    const user = userEvent.setup();
    renderApp(["/student/diagnostic/diagnostic-fractions-001"]);

    const firstRadio = await screen.findByRole("radio", { name: "2/4" });
    firstRadio.focus();
    await user.keyboard(" ");

    expect(firstRadio).toBeChecked();
  });

  it("does not submit when no option is selected", async () => {
    renderApp(["/student/diagnostic/diagnostic-fractions-001"]);
    expect(await screen.findByRole("button", { name: /Nộp|Nop/i })).toBeDisabled();
  });

  it("sends a stable clientAttemptId for retry and reuses it before success", async () => {
    const attemptBodies: Array<{ clientAttemptId?: string }> = [];

    server.use(
      http.post("*/api/v1/diagnostic-sessions/:sessionId/attempts", async ({ request }) => {
        const body = (await request.json()) as {
          questionId: string;
          selectedOptionId: string;
          clientAttemptId?: string;
        };
        attemptBodies.push({ clientAttemptId: body.clientAttemptId });

        if (attemptBodies.length === 1) {
          return HttpResponse.error();
        }

        return HttpResponse.json({
          attemptId: "attempt-stable-id",
          correct: true,
          feedback: {
            title: "Da ghi nhan cau tra loi",
            message: "Em da hoan thanh buoc nay.",
            tone: "encouraging",
          },
          nextAction: {
            type: "next_question",
            label: "Cau tiep theo",
          },
        });
      }),
    );

    const user = userEvent.setup();
    renderApp(["/student/diagnostic/diagnostic-fractions-001"]);

    await user.click(await screen.findByLabelText("2/4"));
    await user.click(screen.getByRole("button", { name: /Nộp|Nop/i }));
    expect(
      await screen.findByText(
        /Chưa thể kết nối đến máy chủ Mina trong trường|Chua the ket noi den may chu Mina trong truong/i,
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Nộp|Nop/i }));

    expect(await screen.findByText(/Da ghi nhan cau tra loi/i)).toBeInTheDocument();
    expect(attemptBodies).toHaveLength(2);
    expect(attemptBodies[0].clientAttemptId).toBeTruthy();
    expect(attemptBodies[0].clientAttemptId).toBe(attemptBodies[1].clientAttemptId);
  });

  it("navigates to remediation when the API returns navigate", async () => {
    const user = userEvent.setup();
    renderApp(["/student/diagnostic/diagnostic-fractions-001"]);

    await user.click(await screen.findByLabelText("3/4"));
    await user.click(screen.getByRole("button", { name: /Nộp|Nop/i }));
    await user.click(await screen.findByRole("link", { name: /Bắt đầu|Bat dau/i }));

    expect(await screen.findByText(/Củng cố kiến thức|Cung co kien thuc/i)).toBeInTheDocument();
  });

  it("shows an invalid session state with a way back", async () => {
    renderApp(["/student/diagnostic/missing-session"]);
    expect(await screen.findByRole("button", { name: /Quay về|Quay ve/i })).toBeInTheDocument();
  });

  it("shows an exit confirmation dialog after interaction", async () => {
    const user = userEvent.setup();
    renderApp(["/student/diagnostic/diagnostic-fractions-001"]);

    await user.click(await screen.findByLabelText("2/4"));
    await user.click(screen.getByRole("link", { name: /Thoát|Thoat/i }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("has no serious accessibility violations on the diagnostic page", async () => {
    const { container } = renderApp(["/student/diagnostic/diagnostic-fractions-001"]);
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: "2/4" })).toBeInTheDocument(),
    );

    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false } },
    });

    expect(results.violations).toHaveLength(0);
  });
});
