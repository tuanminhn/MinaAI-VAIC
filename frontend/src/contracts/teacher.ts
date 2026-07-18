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

export type TeacherCreateAssignmentRequest = {
  title: string; description?: string; targetSkillCode: string;
  estimatedMinutes: number; dueAt?: string | null; publish: boolean;
};

export type TeacherCreateAssignmentResponse = {
  id: string; title: string; status: string; studentCount: number;
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

export type TeacherSupportGroupsResponse = {
  items: Array<{ skillId: string; skillName: string; studentCount: number; needsSupportCount: number; classroomNames: string[] }>;
};

export type TeacherInterventionsResponse = {
  items: Array<{
    studentId: string; studentName: string; classroomName: string;
    assignmentId: string; assignmentTitle: string; sessionId: string;
    rootCauseSkillName: string | null; priority: "high" | "medium" | "low";
    priorityScore: number; reason: string; updatedAt: string;
  }>;
};

export type TeacherStudentProfileResponse = {
  id: string; displayName: string; classroomName: string; schoolName: string;
  masteries: Array<{
    skillId: string; skillName: string; status: string; masteryScore: number;
    confidence: number; evidenceCount: number; lastEvaluatedAt: string | null;
  }>;
  recentSessions: Array<{
    sessionId: string; assignmentId: string; assignmentTitle: string; state: string;
    outcome: TeacherOutcome | null; rootCauseSkillName: string | null; updatedAt: string;
  }>;
};
