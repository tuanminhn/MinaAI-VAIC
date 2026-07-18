export const queryKeys = {
  health: ["health"] as const,
  auth: {
    me: () => ["auth", "me"] as const,
  },
  diagnostic: {
    session: (sessionId: string) => ["diagnostic", "session", sessionId] as const,
  },
  student: {
    home: () => ["student", "home"] as const,
    assignments: (status?: string, page = 1, pageSize = 10) =>
      ["student", "assignments", status ?? "all", page, pageSize] as const,
  },
};
