import { HttpResponse, delay, http } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { setMockActiveSessionForUserId } from "@/fixtures/auth";
import { server } from "@/mocks/server";
import { renderApp } from "@/test/render-app";

describe("student remediation, transfer and result flow", () => {
  beforeEach(() => {
    setMockActiveSessionForUserId("student-001");
  });

  it("renders remediation content", async () => {
    renderApp(["/student/remediation/diagnostic-fractions-001"]);

    expect(await screen.findByRole("heading", { name: /Nhân cả tử và mẫu|Nhan ca tu va mau/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Tìm số cần nhân rồi áp dụng cho cả tử và mẫu|Tim so can nhan roi ap dung cho ca tu va mau/i),
    ).toBeInTheDocument();
  });

  it("reuses the same clientAttemptId when remediation submit is retried", async () => {
    const attemptBodies: Array<{ clientAttemptId?: string }> = [];

    server.use(
      http.post("*/api/v1/diagnostic-sessions/:sessionId/remediation/attempts", async ({ request }) => {
        const body = (await request.json()) as {
          questionId?: string;
          selectedOptionId?: string;
          clientAttemptId?: string;
        };

        attemptBodies.push({ clientAttemptId: body.clientAttemptId });

        if (attemptBodies.length === 1) {
          return HttpResponse.error();
        }

        return HttpResponse.json({
          attemptId: "remediation-attempt-001",
          correct: true,
          feedback: {
            title: "Đã ghi nhận câu trả lời",
            message: "Mình tiếp tục thêm một bước ngắn nữa nhé.",
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
    renderApp(["/student/remediation/diagnostic-fractions-001"]);

    await user.click(await screen.findByLabelText("8/12"));
    await user.click(screen.getByRole("button", { name: /Nộp câu trả lời|Nop cau tra loi/i }));
    expect(
      await screen.findByText(/Bài luyện tập của em chưa được gửi|Chưa gửi được câu trả lời/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Nộp câu trả lời|Nop cau tra loi/i }));

    expect(await screen.findByText(/Đã ghi nhận câu trả lời|Da ghi nhan cau tra loi/i)).toBeInTheDocument();
    expect(attemptBodies).toHaveLength(2);
    expect(attemptBodies[0].clientAttemptId).toBeTruthy();
    expect(attemptBodies[0].clientAttemptId).toBe(attemptBodies[1].clientAttemptId);
  });

  it("loads transfer and navigates to result after completion", async () => {
    const user = userEvent.setup();
    renderApp(["/student/transfer/diagnostic-fractions-001"]);

    await user.click(await screen.findByLabelText("3/4"));
    await user.click(screen.getByRole("button", { name: /Nộp câu trả lời|Nop cau tra loi/i }));
    await user.click(await screen.findByRole("link", { name: /Xem kết quả|Xem ket qua/i }));

    expect(await screen.findByText(/Số vòng củng cố|So vong cung co/i)).toBeInTheDocument();
    expect(screen.getByText(/Hoàn thành sau khi củng cố|Hoan thanh sau khi cung co/i)).toBeInTheDocument();
  });

  it("shows result evidence", async () => {
    renderApp(["/student/result/diagnostic-fractions-001"]);

    expect(await screen.findByText(/Hoàn thành sau khi củng cố|Hoan thanh sau khi cung co/i)).toBeInTheDocument();
    expect(screen.getByText(/Câu diagnostic/i)).toBeInTheDocument();
    expect(screen.getByText(/Câu củng cố|Cau cung co/i)).toBeInTheDocument();
    expect(screen.getByText(/Câu kiểm tra lại|Cau kiem tra lai/i)).toBeInTheDocument();
    expect(screen.getByText(/Số vòng củng cố|So vong cung co/i)).toBeInTheDocument();
  });

  it("handles an expired remediation session by returning to login", async () => {
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
      http.post("*/api/v1/diagnostic-sessions/:sessionId/remediation-runs", () =>
        HttpResponse.json(
          {
            code: "SESSION_EXPIRED",
            message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          },
          { status: 401 },
        ),
      ),
    );

    renderApp(["/student/remediation/diagnostic-fractions-001"]);

    expect(
      await screen.findByRole("heading", { name: /Đăng nhập vào Mina AI|Dang nhap vao Mina AI/i }),
    ).toBeInTheDocument();
  });

  it("shows a loading state while the result is loading", async () => {
    server.use(
      http.get("*/api/v1/diagnostic-sessions/:sessionId/result", async ({ params }) => {
        await delay(60);
        return HttpResponse.json({
          sessionId: String(params.sessionId),
          assignment: {
            id: "assignment-fractions-001",
            title: "Ôn tập phân số",
          },
          outcome: "mastered_after_remediation",
          summary: {
            title: "Em đã hoàn thành bài học",
            message: "Em đã củng cố kiến thức nền và hoàn thành phần kiểm tra lại.",
          },
          learningEvidence: {
            diagnosticQuestionsAnswered: 8,
            remediationQuestionsAnswered: 2,
            transferQuestionsAnswered: 2,
            remediationCycles: 1,
          },
          rootCause: {
            name: "Tìm bội chung nhỏ nhất",
          },
          completedAt: "2026-07-18T08:00:00Z",
        });
      }),
    );

    renderApp(["/student/result/diagnostic-fractions-001"]);

    expect(await screen.findByText(/Đang tải kết quả bài học|Dang tai ket qua bai hoc/i)).toBeInTheDocument();
  });

  it("has no serious accessibility violations on the result page", async () => {
    const { container } = renderApp(["/student/result/diagnostic-fractions-001"]);

    await waitFor(() =>
      expect(screen.getByText(/Em đã hoàn thành bài học|Em da hoan thanh bai hoc/i)).toBeInTheDocument(),
    );

    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false } },
    });

    expect(results.violations).toHaveLength(0);
  });
});
