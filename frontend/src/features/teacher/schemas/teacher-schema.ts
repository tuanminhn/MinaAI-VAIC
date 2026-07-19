import { z } from "zod";

const teacherOutcomeSchema = z.enum([
  "masteredWithoutRemediation",
  "masteredAfterRemediation",
  "needsTeacherSupport",
]);

export const teacherClassesResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      code: z.string().min(1),
      name: z.string().min(1),
      grade: z.number().int().min(1),
      academicYear: z.string().min(1),
      schoolName: z.string().min(1),
      studentCount: z.number().int().min(0),
    }),
  ),
});

export const teacherClassDetailResponseSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  grade: z.number().int().min(1),
  academicYear: z.string().min(1),
  school: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
  }),
});

export const teacherStudentsResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      displayName: z.string().min(1),
      isActive: z.boolean(),
    }),
  ),
});

export const teacherClassAssignmentsResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      status: z.enum(["draft", "published", "archived"]),
      studentCount: z.number().int().min(0),
      assignedAt: z.string().min(1),
      dueAt: z.string().nullable(),
    }),
  ),
});

export const teacherAssignmentOverviewResponseSchema = z.object({
  assignment: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    classroomName: z.string().min(1),
  }),
  counts: z.object({
    notStarted: z.number().int().min(0),
    diagnosing: z.number().int().min(0),
    inRemediation: z.number().int().min(0),
    completed: z.number().int().min(0),
    needsSupport: z.number().int().min(0),
  }),
  rootCauseGroups: z.array(
    z.object({
      skillName: z.string().min(1),
      studentCount: z.number().int().min(0),
    }),
  ),
});

export const teacherAssignmentStudentsResponseSchema = z.object({
  items: z.array(
    z.object({
      student: z.object({
        id: z.string().min(1),
        displayName: z.string().min(1),
      }),
      sessionId: z.string().nullable(),
      assignmentStatus: z.string().min(1),
      sessionState: z.string().nullable(),
      outcome: teacherOutcomeSchema.nullable(),
      rootCauseSkillName: z.string().nullable(),
      diagnosticAttempts: z.number().int().min(0),
      remediationAttempts: z.number().int().min(0),
      transferAttempts: z.number().int().min(0),
      updatedAt: z.string().min(1),
    }),
  ),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
});

export const teacherLearningSessionEvidenceResponseSchema = z.object({
  student: z.object({
    id: z.string().min(1),
    displayName: z.string().min(1),
  }),
  assignment: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
  }),
  state: z.string().min(1),
  outcome: teacherOutcomeSchema.nullable(),
  rootCause: z
    .object({
      name: z.string().min(1),
    })
    .nullable(),
  timeline: z.array(
    z.object({
      fromState: z.string().nullable(),
      toState: z.string().min(1),
      reasonCode: z.string().min(1),
      skillName: z.string().nullable(),
      createdAt: z.string().min(1),
    }),
  ),
  attempts: z.array(
    z.object({
      phase: z.enum(["diagnostic", "remediation", "transfer"]),
      questionPrompt: z.string().min(1),
      selectedOptionLabel: z.string().min(1),
      isCorrect: z.boolean(),
      skillName: z.string().min(1),
      answeredAt: z.string().min(1),
    }),
  ),
});
