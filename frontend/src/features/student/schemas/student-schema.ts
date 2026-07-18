import { z } from "zod";

export const assignmentStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "remediation",
  "transfer_ready",
  "completed",
]);

export const assignmentSummarySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  subject: z.literal("math"),
  grade: z.number().int().min(1),
  status: assignmentStatusSchema,
  progress: z.object({
    completed: z.number().int().min(0),
    total: z.number().int().min(0),
  }),
  estimatedMinutes: z.number().int().min(1).optional(),
  assignedAt: z.string().optional(),
  dueAt: z.string().optional(),
  diagnosticAvailable: z.boolean(),
  nextRoute: z.string().nullable().optional(),
});

export const studentHomeResponseSchema = z.object({
  student: z.object({
    id: z.string().min(1),
    displayName: z.string().min(1),
    classroomName: z.string().nullable().optional(),
    schoolName: z.string().nullable().optional(),
  }),
  currentAssignment: assignmentSummarySchema.optional(),
  recentAssignments: z.array(assignmentSummarySchema),
});

export const studentAssignmentsResponseSchema = z.object({
  items: z.array(assignmentSummarySchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
});

export const startDiagnosticSessionResponseSchema = z.object({
  sessionId: z.string().min(1),
  state: z.enum([
    "diagnosing",
    "gap_confirmed",
    "in_remediation",
    "transfer_ready",
    "completed",
  ]),
  route: z.string().min(1),
  resumed: z.boolean(),
});
