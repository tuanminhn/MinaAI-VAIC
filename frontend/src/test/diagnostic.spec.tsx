import { HttpResponse, delay, http } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { mockAuthAccounts } from "@/fixtures/auth";
import { authSessionStorage } from "@/features/auth/hooks/auth-session-storage";
import { server } from "@/mocks/server";
import { renderApp } from "@/test/render-app";

describe("minimal diagnostic player contract", () => {
  beforeEach(() => {
    authSessionStorage.setAccessToken(mockAuthAccounts[0].session.accessToken);
  });

  it("shows a loading state while the diagnostic session is loading", async () => {
    server.use(
      http.get("/api/v1/diagnostic-sessions/:sessionId", async ({ params }) => {
        await delay(60);
        return HttpResponse.json({
          id: String(params.sessionId),
          assignmentId: "assignment-fractions-001",
          assignmentTitle: "Chẩn đoán phân số tuần này",
          state: "diagnosing",
          progress: {
            answered: 1,
            estimatedTotal: 4,
          },
          currentQuestion: {
            id: "question-fractions-002",
            prompt: "Trong các phân số sau, phân số nào bằng 1/2?",
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

    expect(await screen.findByLabelText("Đang tải câu hỏi chẩn đoán")).toBeInTheDocument();
    expect(await screen.findByText("Trong các phân số sau, phân số nào bằng 1/2?")).toBeInTheDocument();
  });

  it("renders the diagnostic question", async () => {
    renderApp(["/student/diagnostic/diagnostic-fractions-001"]);

    expect(await screen.findByRole("heading", { name: "Chẩn đoán phân số tuần này" })).toBeInTheDocument();
    expect(screen.getByText("Trong các phân số sau, phân số nào bằng 1/2?")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "2/4" })).toBeInTheDocument();
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

    expect(await screen.findByRole("button", { name: "Nộp câu trả lời" })).toBeDisabled();
  });

  it("submits one selected answer", async () => {
    const user = userEvent.setup();
    renderApp(["/student/diagnostic/diagnostic-fractions-001"]);

    await user.click(await screen.findByLabelText("2/4"));
    await user.click(screen.getByRole("button", { name: "Nộp câu trả lời" }));

    expect(await screen.findByText("Em đã xác định đúng cách làm ở bước này.")).toBeInTheDocument();
  });

  it("does not double submit", async () => {
    let submitCount = 0;

    server.use(
      http.post("/api/v1/diagnostic-sessions/:sessionId/attempts", async () => {
        submitCount += 1;
        await delay(80);

        return HttpResponse.json({
          attemptId: "attempt-1",
          correct: true,
          feedback: {
            title: "Em đã làm đúng ở bước này",
            message: "Em đã xác định đúng cách làm ở bước này.",
            tone: "encouraging",
          },
          nextAction: {
            type: "next_question",
            label: "Câu tiếp theo",
          },
        });
      }),
    );

    const user = userEvent.setup();
    renderApp(["/student/diagnostic/diagnostic-fractions-001"]);

    await user.click(await screen.findByLabelText("2/4"));
    const submitButton = screen.getByRole("button", { name: "Nộp câu trả lời" });

    await Promise.all([user.click(submitButton), user.click(submitButton)]);

    expect(await screen.findByText("Em đã xác định đúng cách làm ở bước này.")).toBeInTheDocument();
    expect(submitCount).toBe(1);
  });

  it("shows feedback after submit", async () => {
    const user = userEvent.setup();
    renderApp(["/student/diagnostic/diagnostic-fractions-001"]);

    await user.click(await screen.findByLabelText("3/4"));
    await user.click(screen.getByRole("button", { name: "Nộp câu trả lời" }));

    expect(await screen.findByText("Mình cùng kiểm tra thêm một bước nhé")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bắt đầu củng cố" })).toBeInTheDocument();
  });

  it("loads the next question for next_question responses", async () => {
    const user = userEvent.setup();
    renderApp(["/student/diagnostic/diagnostic-fractions-001"]);

    await user.click(await screen.findByLabelText("2/4"));
    await user.click(screen.getByRole("button", { name: "Nộp câu trả lời" }));
    await user.click(await screen.findByRole("button", { name: "Câu tiếp theo" }));

    expect(
      await screen.findByText(
        "Nếu chia đều 8 chiếc bánh cho 4 bạn, mỗi bạn nhận được bao nhiêu phần của cả khay?",
      ),
    ).toBeInTheDocument();
  });

  it("navigates to remediation when the API returns navigate", async () => {
    const user = userEvent.setup();
    renderApp(["/student/diagnostic/diagnostic-fractions-001"]);

    await user.click(await screen.findByLabelText("3/4"));
    await user.click(screen.getByRole("button", { name: "Nộp câu trả lời" }));
    await user.click(await screen.findByRole("link", { name: "Bắt đầu củng cố" }));

    expect(await screen.findByRole("heading", { name: "Remediation" })).toBeInTheDocument();
  });

  it("navigates to result when the API returns completed", async () => {
    const user = userEvent.setup();
    renderApp(["/student/diagnostic/adaptive-unknown-001"]);

    await user.click(await screen.findByLabelText("Hình tam giác"));
    await user.click(screen.getByRole("button", { name: "Nộp câu trả lời" }));
    await user.click(await screen.findByRole("link", { name: "Xem kết quả" }));

    expect(await screen.findByRole("heading", { name: "Ket qua" })).toBeInTheDocument();
  });

  it("keeps the selection after a LAN error and allows retry", async () => {
    let shouldFail = true;
    server.use(
      http.post("/api/v1/diagnostic-sessions/:sessionId/attempts", () => {
        if (shouldFail) {
          shouldFail = false;
          return HttpResponse.error();
        }

        return HttpResponse.json({
          attemptId: "attempt-retry",
          correct: true,
          feedback: {
            title: "Em đã làm đúng ở bước này",
            message: "Em đã xác định đúng cách làm ở bước này.",
            tone: "encouraging",
          },
          nextAction: {
            type: "next_question",
            label: "Câu tiếp theo",
          },
        });
      }),
    );

    const user = userEvent.setup();
    renderApp(["/student/diagnostic/diagnostic-fractions-001"]);

    const selectedRadio = await screen.findByRole("radio", { name: "2/4" });
    await user.click(selectedRadio);
    await user.click(screen.getByRole("button", { name: "Nộp câu trả lời" }));

    expect(
      await screen.findByText(
        "Chưa thể kết nối đến máy chủ Mina trong trường. Câu trả lời của em chưa được gửi. Hãy thử lại.",
      ),
    ).toBeInTheDocument();
    expect(selectedRadio).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Nộp câu trả lời" }));
    expect(await screen.findByText("Em đã xác định đúng cách làm ở bước này.")).toBeInTheDocument();
  });

  it("shows an invalid session state with a way back", async () => {
    renderApp(["/student/diagnostic/missing-session"]);

    expect(await screen.findByRole("heading", { name: "Không tìm thấy phiên làm bài này." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quay về Bài được giao" })).toBeInTheDocument();
  });

  it("shows an exit confirmation dialog after interaction", async () => {
    const user = userEvent.setup();
    renderApp(["/student/diagnostic/diagnostic-fractions-001"]);

    await user.click(await screen.findByLabelText("2/4"));
    await user.click(screen.getByRole("link", { name: "Thoát bài" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Tiến trình đã lưu trên máy chủ Mina trong trường sẽ không bị mất.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tiếp tục làm bài" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows progress semantics when the estimated total is known", async () => {
    renderApp(["/student/diagnostic/diagnostic-fractions-001"]);

    const progressBar = await screen.findByRole("progressbar", { name: "Tiến độ bài chẩn đoán" });
    expect(progressBar).toHaveAttribute("aria-valuenow", "1");
    expect(progressBar).toHaveAttribute("aria-valuemax", "4");
    expect(progressBar).toHaveAttribute("aria-valuetext", "Đã hoàn thành 1/4 câu");
  });

  it("shows text-only progress when the total is unknown", async () => {
    renderApp(["/student/diagnostic/adaptive-unknown-001"]);

    expect(await screen.findByText("Đã hoàn thành 3 câu")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar", { name: "Tiến độ bài chẩn đoán" })).not.toBeInTheDocument();
  });

  it("redirects to login when the session expires", async () => {
    server.use(
      http.get("/api/v1/diagnostic-sessions/:sessionId", () =>
        HttpResponse.json(
          {
            code: "session_expired",
            message: "Phiên đăng nhập đã hết hạn.",
          },
          { status: 401 },
        ),
      ),
    );

    renderApp(["/student/diagnostic/diagnostic-fractions-001"]);

    expect(await screen.findByRole("heading", { name: "Dang nhap vao Mina AI" })).toBeInTheDocument();
    expect(await screen.findByText("Vui long dang nhap lai de tiep tuc su dung Mina AI.")).toBeInTheDocument();
  });

  it("has no serious accessibility violations on the diagnostic page", async () => {
    const { container } = renderApp(["/student/diagnostic/diagnostic-fractions-001"]);
    await waitFor(() =>
      expect(screen.getByText("Trong các phân số sau, phân số nào bằng 1/2?")).toBeInTheDocument(),
    );

    const results = await axe(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });

    expect(results.violations).toHaveLength(0);
  });
});
