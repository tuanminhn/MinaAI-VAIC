export const queryKeys = {
  health: ["health"] as const,
  auth: {
    me: () => ["auth", "me"] as const,
  },
  diagnostic: {
    session: (sessionId: string) => ["diagnostic", "session", sessionId] as const,
    remediation: (sessionId: string) => ["diagnostic", "remediation", sessionId] as const,
    transfer: (sessionId: string) => ["diagnostic", "transfer", sessionId] as const,
    result: (sessionId: string) => ["diagnostic", "result", sessionId] as const,
  },
  student: {
    home: () => ["student", "home"] as const,
    assignments: (status?: string, page = 1, pageSize = 10) =>
      ["student", "assignments", status ?? "all", page, pageSize] as const,
  },
  teacher: {
    classes: () => ["teacher", "classes"] as const,
    classDetail: (classId: string) => ["teacher", "class", classId] as const,
    classStudents: (classId: string) => ["teacher", "class", classId, "students"] as const,
    classAssignments: (classId: string) => ["teacher", "class", classId, "assignments"] as const,
    assignmentOverview: (assignmentId: string) =>
      ["teacher", "assignment", assignmentId, "overview"] as const,
    assignmentStudents: (assignmentId: string, page = 1, pageSize = 20) =>
      ["teacher", "assignment", assignmentId, "students", page, pageSize] as const,
    learningSession: (sessionId: string) => ["teacher", "learning-session", sessionId] as const,
  },
};
