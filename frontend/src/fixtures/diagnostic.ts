import type {
  DiagnosticSessionResponse,
  SubmitDiagnosticAttemptRequest,
  SubmitDiagnosticAttemptResponse,
} from "@/contracts/diagnostic";

type DiagnosticFixtureState = {
  sessions: Record<string, DiagnosticSessionResponse>;
};

const initialDiagnosticSessions = (): Record<string, DiagnosticSessionResponse> => ({
  "diagnostic-fractions-001": {
    id: "diagnostic-fractions-001",
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
        { id: "option-c", label: "4/6" },
        { id: "option-d", label: "5/8" },
      ],
    },
  },
  "adaptive-unknown-001": {
    id: "adaptive-unknown-001",
    assignmentId: "assignment-geometry-001",
    assignmentTitle: "Khởi động hình học cơ bản",
    state: "diagnosing",
    progress: {
      answered: 3,
    },
    currentQuestion: {
      id: "question-geometry-004",
      prompt: "Hình nào dưới đây có đúng ba cạnh?",
      selectionMode: "single",
      options: [
        { id: "option-a", label: "Hình vuông" },
        { id: "option-b", label: "Hình tam giác" },
        { id: "option-c", label: "Hình chữ nhật" },
      ],
    },
  },
  "completed-session-001": {
    id: "completed-session-001",
    assignmentId: "assignment-ratios-001",
    assignmentTitle: "Kiểm tra nhanh tỉ số và phần trăm",
    state: "completed",
    progress: {
      answered: 4,
      estimatedTotal: 4,
    },
    nextRoute: "/student/result/result-ratios-001",
  },
});

let diagnosticFixtureState: DiagnosticFixtureState = {
  sessions: initialDiagnosticSessions(),
};

export function resetDiagnosticFixtureState(): void {
  diagnosticFixtureState = {
    sessions: initialDiagnosticSessions(),
  };
}

export function getDiagnosticSessionFixture(sessionId: string): DiagnosticSessionResponse | null {
  return diagnosticFixtureState.sessions[sessionId] ?? null;
}

export function submitDiagnosticFixtureAttempt(
  sessionId: string,
  input: SubmitDiagnosticAttemptRequest,
): SubmitDiagnosticAttemptResponse | null {
  const session = diagnosticFixtureState.sessions[sessionId];

  if (!session || !session.currentQuestion || input.questionId !== session.currentQuestion.id) {
    return null;
  }

  if (sessionId === "diagnostic-fractions-001" && input.selectedOptionId === "option-a") {
    diagnosticFixtureState.sessions[sessionId] = {
      ...session,
      progress: {
        answered: 2,
        estimatedTotal: 4,
      },
      currentQuestion: {
        id: "question-fractions-003",
        prompt: "Nếu chia đều 8 chiếc bánh cho 4 bạn, mỗi bạn nhận được bao nhiêu phần của cả khay?",
        selectionMode: "single",
        options: [
          { id: "option-next-a", label: "1/4" },
          { id: "option-next-b", label: "1/2" },
          { id: "option-next-c", label: "2/3" },
          { id: "option-next-d", label: "3/4" },
        ],
      },
    };

    return {
      attemptId: "attempt-fractions-002",
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
    };
  }

  if (sessionId === "diagnostic-fractions-001") {
    return {
      attemptId: "attempt-fractions-remediation",
      correct: false,
      feedback: {
        title: "Mình cùng kiểm tra thêm một bước nhé",
        message: "Mina AI sẽ chuyển sang phần củng cố ngắn để em ôn lại cách làm.",
        tone: "corrective",
      },
      nextAction: {
        type: "navigate",
        route: "/student/remediation/remediation-integers-001",
        label: "Bắt đầu củng cố",
      },
    };
  }

  if (sessionId === "adaptive-unknown-001") {
    diagnosticFixtureState.sessions[sessionId] = {
      ...session,
      state: "completed",
      progress: {
        answered: 4,
      },
      currentQuestion: undefined,
      nextRoute: "/student/result/result-ratios-001",
    };

    return {
      attemptId: "attempt-geometry-completed",
      correct: true,
      feedback: {
        title: "Em đã hoàn thành phần chẩn đoán",
        message: "Mina AI đã đủ thông tin để chuyển sang bước tiếp theo.",
        tone: "neutral",
      },
      nextAction: {
        type: "completed",
        route: "/student/result/result-ratios-001",
        label: "Xem kết quả",
      },
    };
  }

  return null;
}
