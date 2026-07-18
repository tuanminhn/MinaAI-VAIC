export const queryKeys = {
  health: ["health"] as const,
  auth: {
    me: (accessToken: string | null) => ["auth", "me", accessToken] as const,
  },
  diagnostic: {
    session: (accessToken: string | null, sessionId: string) =>
      ["diagnostic", "session", accessToken, sessionId] as const,
  },
  student: {
    home: (accessToken: string | null) => ["student", "home", accessToken] as const,
    assignments: (
      accessToken: string | null,
      status?: string,
      page = 1,
      pageSize = 10,
    ) => ["student", "assignments", accessToken, status ?? "all", page, pageSize] as const,
  },
};
