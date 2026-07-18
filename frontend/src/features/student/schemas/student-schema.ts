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
  nextRoute: z.string().optional(),
});

export const studentHomeResponseSchema = z.object({
  student: z.object({
    id: z.string().min(1),
    displayName: z.string().min(1),
    classroomName: z.string().optional(),
  }),
  currentAssignment: assignmentSummarySchema.optional(),
  recentAssignments: z.array(assignmentSummarySchema),
});

export const studentAssignmentsResponseSchema = z.object({
  items: z.array(assignmentSummarySchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  totalItems: z.number().int().min(0),
});
