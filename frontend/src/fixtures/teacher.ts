import type {
  TeacherAssignmentOverviewResponse,
  TeacherAssignmentStudentsResponse,
  TeacherClassAssignmentsResponse,
  TeacherClassDetailResponse,
  TeacherClassesResponse,
  TeacherLearningSessionEvidenceResponse,
  TeacherStudentsResponse,
} from "@/contracts/teacher";

export function getMockTeacherClassesResponse(): TeacherClassesResponse {
  return {
    items: [
      {
        id: "class-6a1",
        code: "6A1",
        name: "Lớp 6A1",
        grade: 6,
        academicYear: "2026-2027",
        schoolName: "Trường THCS Mina",
        studentCount: 1,
      },
    ],
  };
}

export function getMockTeacherClassDetailResponse(): TeacherClassDetailResponse {
  return {
    id: "class-6a1",
    code: "6A1",
    name: "Lớp 6A1",
    grade: 6,
    academicYear: "2026-2027",
    school: {
      id: "school-mina",
      name: "Trường THCS Mina",
    },
  };
}

export function getMockTeacherStudentsResponse(): TeacherStudentsResponse {
  return {
    items: [
      {
        id: "student-001",
        displayName: "DIEM",
        isActive: true,
      },
    ],
  };
}

export function getMockTeacherClassAssignmentsResponse(): TeacherClassAssignmentsResponse {
  return {
    items: [
      {
        id: "assignment-fractions-001",
        title: "Ôn tập phân số",
        status: "published",
        studentCount: 1,
        assignedAt: "2026-07-18T08:00:00Z",
        dueAt: null,
      },
    ],
  };
}

export function getMockTeacherAssignmentOverviewResponse(): TeacherAssignmentOverviewResponse {
  return {
    assignment: {
      id: "assignment-fractions-001",
      title: "Ôn tập phân số",
      classroomName: "Lớp 6A1",
    },
    counts: {
      notStarted: 0,
      diagnosing: 0,
      inRemediation: 0,
      completed: 1,
      needsSupport: 0,
    },
    rootCauseGroups: [
      {
        skillName: "Tìm bội chung nhỏ nhất",
        studentCount: 1,
      },
    ],
  };
}

export function getMockTeacherAssignmentStudentsResponse(
  page = 1,
  pageSize = 20,
): TeacherAssignmentStudentsResponse {
  return {
    items: [
      {
        student: {
          id: "student-001",
          displayName: "DIEM",
        },
        sessionId: "diagnostic-fractions-001",
        assignmentStatus: "completed",
        sessionState: "completed",
        outcome: "masteredAfterRemediation",
        rootCauseSkillName: "Tìm bội chung nhỏ nhất",
        diagnosticAttempts: 8,
        remediationAttempts: 2,
        transferAttempts: 2,
        updatedAt: "2026-07-18T08:30:00Z",
      },
    ],
    page,
    pageSize,
    total: 1,
  };
}

export function getMockTeacherLearningSessionEvidenceResponse(): TeacherLearningSessionEvidenceResponse {
  return {
    student: {
      id: "student-001",
      displayName: "DIEM",
    },
    assignment: {
      id: "assignment-fractions-001",
      title: "Ôn tập phân số",
    },
    state: "completed",
    outcome: "masteredAfterRemediation",
    rootCause: {
      name: "Tìm bội chung nhỏ nhất",
    },
    timeline: [
      {
        fromState: null,
        toState: "diagnosing",
        reasonCode: "session_started",
        skillName: null,
        createdAt: "2026-07-18T08:00:00Z",
      },
      {
        fromState: "diagnosing",
        toState: "gap_confirmed",
        reasonCode: "root_cause_confirmed",
        skillName: "Tìm bội chung nhỏ nhất",
        createdAt: "2026-07-18T08:12:00Z",
      },
      {
        fromState: "transfer_ready",
        toState: "completed",
        reasonCode: "session_completed",
        skillName: null,
        createdAt: "2026-07-18T08:30:00Z",
      },
    ],
    attempts: [
      {
        phase: "diagnostic",
        questionPrompt: "BCNN của 6 và 8 là số nào?",
        selectedOptionLabel: "24",
        isCorrect: false,
        skillName: "Tìm bội chung nhỏ nhất",
        answeredAt: "2026-07-18T08:03:00Z",
      },
      {
        phase: "remediation",
        questionPrompt: "BCNN của 4 và 6 là số nào?",
        selectedOptionLabel: "12",
        isCorrect: true,
        skillName: "Tìm bội chung nhỏ nhất",
        answeredAt: "2026-07-18T08:20:00Z",
      },
      {
        phase: "transfer",
        questionPrompt: "3/4 - 1/4 bằng bao nhiêu?",
        selectedOptionLabel: "2/4",
        isCorrect: true,
        skillName: "Trừ hai phân số cùng mẫu",
        answeredAt: "2026-07-18T08:28:00Z",
      },
    ],
  };
}
