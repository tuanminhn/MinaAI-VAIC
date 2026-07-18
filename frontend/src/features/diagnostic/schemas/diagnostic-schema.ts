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
  estimatedTotal: z.number().int().min(1).optional(),
});

export const diagnosticSessionResponseSchema = z.object({
  id: z.string().min(1),
  assignmentId: z.string().min(1),
  assignmentTitle: z.string().min(1),
  state: diagnosticSessionStateSchema,
  progress: diagnosticProgressSchema,
  currentQuestion: diagnosticQuestionSchema.optional(),
  nextRoute: z.string().min(1).optional(),
});

export const submitDiagnosticAttemptRequestSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionId: z.string().min(1),
});

export const submitDiagnosticAttemptResponseSchema = z.object({
  attemptId: z.string().min(1),
  correct: z.boolean().optional(),
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
