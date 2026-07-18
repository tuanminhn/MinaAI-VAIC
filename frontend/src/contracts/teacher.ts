export type TeacherOutcome =
  | "masteredWithoutRemediation"
  | "masteredAfterRemediation"
  | "needsTeacherSupport";

export type TeacherClassSummary = {
  id: string;
  code: string;
  name: string;
  grade: number;
  academicYear: string;
  schoolName: string;
  studentCount: number;
};

export type TeacherClassesResponse = {
  items: TeacherClassSummary[];
};

export type TeacherClassDetailResponse = {
  id: string;
  code: string;
  name: string;
  grade: number;
  academicYear: string;
  school: {
    id: string;
    name: string;
  };
};

export type TeacherStudentsResponse = {
  items: Array<{
    id: string;
    displayName: string;
    isActive: boolean;
  }>;
};

export type TeacherClassAssignmentsResponse = {
  items: Array<{
    id: string;
    title: string;
    status: "draft" | "published" | "archived";
    studentCount: number;
    assignedAt: string;
    dueAt: string | null;
  }>;
};

export type TeacherAssignmentOverviewResponse = {
  assignment: {
    id: string;
    title: string;
    classroomName: string;
  };
  counts: {
    notStarted: number;
    diagnosing: number;
    inRemediation: number;
    completed: number;
    needsSupport: number;
  };
  rootCauseGroups: Array<{
    skillName: string;
    studentCount: number;
  }>;
};

export type TeacherAssignmentStudentsQuery = {
  page?: number;
  pageSize?: number;
};

export type TeacherAssignmentStudentsResponse = {
  items: Array<{
    student: {
      id: string;
      displayName: string;
    };
    sessionId: string | null;
    assignmentStatus: string;
    sessionState: string | null;
    outcome: TeacherOutcome | null;
    rootCauseSkillName: string | null;
    diagnosticAttempts: number;
    remediationAttempts: number;
    transferAttempts: number;
    updatedAt: string;
  }>;
  page: number;
  pageSize: number;
  total: number;
};

export type TeacherLearningSessionEvidenceResponse = {
  student: {
    id: string;
    displayName: string;
  };
  assignment: {
    id: string;
    title: string;
  };
  state: string;
  outcome: TeacherOutcome | null;
  rootCause: {
    name: string;
  } | null;
  timeline: Array<{
    fromState: string | null;
    toState: string;
    reasonCode: string;
    skillName: string | null;
    createdAt: string;
  }>;
  attempts: Array<{
    phase: "diagnostic" | "remediation" | "transfer";
    questionPrompt: string;
    selectedOptionLabel: string;
    isCorrect: boolean;
    skillName: string;
    answeredAt: string;
  }>;
};
