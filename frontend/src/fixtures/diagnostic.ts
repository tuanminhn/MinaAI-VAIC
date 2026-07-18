import type {
  DiagnosticResultResponse,
  DiagnosticSessionResponse,
  RemediationResponse,
  SubmitDiagnosticAttemptRequest,
  SubmitDiagnosticAttemptResponse,
  SubmitRemediationAttemptRequest,
  SubmitRemediationAttemptResponse,
  SubmitTransferAttemptRequest,
  SubmitTransferAttemptResponse,
  TransferResponse,
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
        route: "/student/remediation/diagnostic-fractions-001",
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

export function getRemediationFixture(sessionId: string): RemediationResponse | null {
  if (sessionId !== "diagnostic-fractions-001") {
    return null;
  }

  return {
    sessionId,
    assignmentTitle: "Ôn tập phân số",
    state: "in_remediation",
    cycleNumber: 1,
    unit: {
      title: "Nhân cả tử và mẫu",
      summary: "Khi đổi mẫu số, em cần nhân tử số và mẫu số với cùng một số.",
      explanation:
        "Nhân cả tử và mẫu với cùng một số khác 0 sẽ tạo ra một phân số bằng phân số ban đầu.",
      workedExample: "2/3 = 8/12 vì 2 x 4 = 8 và 3 x 4 = 12.",
      practiceInstruction: "Tìm số cần nhân rồi áp dụng cho cả tử và mẫu.",
    },
    progress: {
      answered: 0,
      total: 2,
    },
    currentQuestion: {
      id: "remediation-question-001",
      prompt: "Phân số nào bằng 2/3 và có mẫu số 12?",
      selectionMode: "single",
      options: [
        { id: "rem-option-a", label: "4/12" },
        { id: "rem-option-b", label: "6/12" },
        { id: "rem-option-c", label: "8/12" },
      ],
    },
  };
}

export function submitRemediationFixtureAttempt(
  sessionId: string,
  input: SubmitRemediationAttemptRequest,
): SubmitRemediationAttemptResponse | null {
  if (sessionId !== "diagnostic-fractions-001" || input.questionId !== "remediation-question-001") {
    return null;
  }

  return {
    attemptId: "remediation-attempt-001",
    correct: input.selectedOptionId === "rem-option-c",
    feedback: {
      title: "Đã ghi nhận câu trả lời",
      message: "Mình tiếp tục thêm một bước ngắn nữa nhé.",
      tone: input.selectedOptionId === "rem-option-c" ? "encouraging" : "neutral",
    },
    nextAction: {
      type: "navigate",
      route: "/student/transfer/diagnostic-fractions-001",
      label: "Bắt đầu kiểm tra lại",
    },
  };
}

export function getTransferFixture(sessionId: string): TransferResponse | null {
  if (sessionId !== "diagnostic-fractions-001") {
    return null;
  }

  return {
    sessionId,
    assignmentTitle: "Ôn tập phân số",
    state: "transfer_ready",
    cycleNumber: 1,
    progress: {
      answered: 0,
      total: 2,
    },
    currentQuestion: {
      id: "transfer-question-001",
      prompt: "Tìm x: x - 1/4 = 1/2",
      selectionMode: "single",
      options: [
        { id: "transfer-option-a", label: "1/4" },
        { id: "transfer-option-b", label: "2/4" },
        { id: "transfer-option-c", label: "3/4" },
      ],
    },
  };
}

export function submitTransferFixtureAttempt(
  sessionId: string,
  input: SubmitTransferAttemptRequest,
): SubmitTransferAttemptResponse | null {
  if (sessionId !== "diagnostic-fractions-001" || input.questionId !== "transfer-question-001") {
    return null;
  }

  return {
    attemptId: "transfer-attempt-001",
    correct: input.selectedOptionId === "transfer-option-c",
    feedback: {
      title: "Em đã hoàn thành bài học",
      message: "Em đã củng cố kiến thức nền và hoàn thành phần kiểm tra lại.",
      tone: "encouraging",
    },
    nextAction: {
      type: "completed",
      route: "/student/result/diagnostic-fractions-001",
      label: "Xem kết quả",
    },
  };
}

export function getResultFixture(sessionId: string): DiagnosticResultResponse | null {
  if (sessionId !== "diagnostic-fractions-001" && sessionId !== "result-ratios-001") {
    return null;
  }

  return {
    sessionId,
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
  };
}
