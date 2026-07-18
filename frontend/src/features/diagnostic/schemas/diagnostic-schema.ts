import { z } from "zod";

export const diagnosticSessionStateSchema = z.enum([
  "diagnosing",
  "gap_confirmed",
  "in_remediation",
  "transfer_ready",
  "completed",
]);

export const diagnosticOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export const diagnosticQuestionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  options: z.array(diagnosticOptionSchema).min(1),
  selectionMode: z.literal("single"),
});

export const diagnosticProgressSchema = z.object({
  answered: z.number().int().min(0),
  estimatedTotal: z.number().int().min(1).nullish().transform((value) => value ?? undefined),
  total: z.number().int().min(1).nullish().transform((value) => value ?? undefined),
});

export const diagnosticSessionResponseSchema = z.object({
  id: z.string().min(1),
  assignmentId: z.string().min(1),
  assignmentTitle: z.string().min(1),
  state: diagnosticSessionStateSchema,
  progress: diagnosticProgressSchema,
  currentQuestion: diagnosticQuestionSchema.nullish().transform((value) => value ?? undefined),
  nextRoute: z.string().min(1).nullish().transform((value) => value ?? undefined),
});

export const submitDiagnosticAttemptRequestSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionId: z.string().min(1),
  clientAttemptId: z.string().min(1),
});

export const submitDiagnosticAttemptResponseSchema = z.object({
  attemptId: z.string().min(1),
  correct: z.boolean().nullish().transform((value) => value ?? undefined),
  feedback: z.object({
    title: z.string().min(1),
    message: z.string().min(1),
    tone: z.enum(["neutral", "encouraging", "corrective"]),
  }),
  nextAction: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("next_question"),
      label: z.string().min(1),
    }),
    z.object({
      type: z.literal("navigate"),
      route: z.string().min(1),
      label: z.string().min(1),
    }),
    z.object({
      type: z.literal("completed"),
      route: z.string().min(1),
      label: z.string().min(1),
    }),
  ]),
});

export const startRemediationRunResponseSchema = z.object({
  sessionId: z.string().min(1),
  runId: z.string().min(1),
  cycleNumber: z.number().int().min(1).max(2),
  state: diagnosticSessionStateSchema,
  route: z.string().min(1),
  resumed: z.boolean(),
});

export const remediationUnitSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  explanation: z.string().min(1),
  workedExample: z.string().min(1),
  practiceInstruction: z.string().min(1),
});

export const remediationResponseSchema = z.object({
  sessionId: z.string().min(1),
  assignmentTitle: z.string().min(1),
  state: diagnosticSessionStateSchema,
  cycleNumber: z.number().int().min(1).max(2),
  unit: remediationUnitSchema,
  progress: diagnosticProgressSchema,
  currentQuestion: diagnosticQuestionSchema.nullish().transform((value) => value ?? undefined),
  nextRoute: z.string().min(1).nullish().transform((value) => value ?? undefined),
});

export const submitRemediationAttemptResponseSchema = z.object({
  attemptId: z.string().min(1),
  correct: z.boolean().nullish().transform((value) => value ?? undefined),
  feedback: z.object({
    title: z.string().min(1),
    message: z.string().min(1),
    tone: z.enum(["neutral", "encouraging", "corrective"]),
  }),
  nextAction: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("next_question"),
      label: z.string().min(1),
    }),
    z.object({
      type: z.literal("navigate"),
      route: z.string().min(1),
      label: z.string().min(1),
    }),
  ]),
});

export const startTransferCheckResponseSchema = z.object({
  sessionId: z.string().min(1),
  transferCheckId: z.string().min(1),
  cycleNumber: z.number().int().min(1).max(2),
  state: diagnosticSessionStateSchema,
  route: z.string().min(1),
  resumed: z.boolean(),
});

export const transferResponseSchema = z.object({
  sessionId: z.string().min(1),
  assignmentTitle: z.string().min(1),
  state: diagnosticSessionStateSchema,
  cycleNumber: z.number().int().min(1).max(2),
  progress: diagnosticProgressSchema,
  currentQuestion: diagnosticQuestionSchema.nullish().transform((value) => value ?? undefined),
  nextRoute: z.string().min(1).nullish().transform((value) => value ?? undefined),
});

export const submitTransferAttemptResponseSchema = submitDiagnosticAttemptResponseSchema;

export const diagnosticResultResponseSchema = z.object({
  sessionId: z.string().min(1),
  assignment: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
  }),
  outcome: z.enum([
    "mastered_without_remediation",
    "mastered_after_remediation",
    "needs_teacher_support",
  ]),
  summary: z.object({
    title: z.string().min(1),
    message: z.string().min(1),
  }),
  learningEvidence: z.object({
    diagnosticQuestionsAnswered: z.number().int().min(0),
    remediationQuestionsAnswered: z.number().int().min(0),
    transferQuestionsAnswered: z.number().int().min(0),
    remediationCycles: z.number().int().min(0).max(2),
  }),
  rootCause: z
    .object({
      name: z.string().min(1),
    })
    .nullable()
    .optional(),
  completedAt: z.string().min(1).nullable().optional(),
});
