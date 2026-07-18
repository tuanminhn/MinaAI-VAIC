import { describe, expect, it } from "vitest";
import {
  diagnosticSessionResponseSchema,
  remediationResponseSchema,
  submitDiagnosticAttemptResponseSchema,
  transferResponseSchema,
} from "@/features/diagnostic/schemas/diagnostic-schema";
import {
  studentHomeResponseSchema,
} from "@/features/student/schemas/student-schema";

const question = {
  id: "question-1",
  prompt: "1/2 + 1/2 bằng bao nhiêu?",
  selectionMode: "single" as const,
  options: [{ id: "option-1", label: "1" }],
};

const nullableProgress = {
  answered: 0,
  estimatedTotal: null,
  total: null,
};

describe("API nullability contracts", () => {
  it("normalizes nullable student assignment metadata", () => {
    const parsed = studentHomeResponseSchema.parse({
      student: {
        id: "student-1",
        displayName: "Học sinh Mina",
        classroomName: null,
        schoolName: null,
      },
      currentAssignment: {
        id: "assignment-1",
        title: "Ôn tập phân số",
        description: null,
        subject: "math",
        grade: 6,
        status: "not_started",
        progress: { completed: 0, total: 0 },
        estimatedMinutes: null,
        assignedAt: null,
        dueAt: null,
        diagnosticAvailable: true,
        nextRoute: null,
      },
      recentAssignments: [],
    });

    expect(parsed.currentAssignment?.dueAt).toBeUndefined();
  });

  it("normalizes nullable diagnostic state", () => {
    const parsed = diagnosticSessionResponseSchema.parse({
      id: "session-1",
      assignmentId: "assignment-1",
      assignmentTitle: "Ôn tập phân số",
      state: "diagnosing",
      progress: nullableProgress,
      currentQuestion: question,
      nextRoute: null,
    });

    expect(parsed.progress.total).toBeUndefined();
    expect(parsed.nextRoute).toBeUndefined();
  });

  it("accepts nullable empty states across remediation and transfer", () => {
    const remediation = remediationResponseSchema.parse({
      sessionId: "session-1",
      assignmentTitle: "Ôn tập phân số",
      state: "in_remediation",
      cycleNumber: 1,
      unit: {
        title: "Phân số",
        summary: "Ôn kiến thức nền",
        explanation: "Giải thích",
        workedExample: "Ví dụ",
        practiceInstruction: "Chọn đáp án",
      },
      progress: nullableProgress,
      currentQuestion: null,
      nextRoute: null,
    });
    const transfer = transferResponseSchema.parse({
      sessionId: "session-1",
      assignmentTitle: "Ôn tập phân số",
      state: "transfer_ready",
      cycleNumber: 1,
      progress: nullableProgress,
      currentQuestion: null,
      nextRoute: null,
    });

    expect(remediation.currentQuestion).toBeUndefined();
    expect(transfer.currentQuestion).toBeUndefined();
  });

  it("normalizes a nullable correctness value", () => {
    const parsed = submitDiagnosticAttemptResponseSchema.parse({
      attemptId: "attempt-1",
      correct: null,
      feedback: {
        title: "Đã ghi nhận",
        message: "Tiếp tục câu tiếp theo.",
        tone: "neutral",
      },
      nextAction: { type: "next_question", label: "Tiếp tục" },
    });

    expect(parsed.correct).toBeUndefined();
  });
});
