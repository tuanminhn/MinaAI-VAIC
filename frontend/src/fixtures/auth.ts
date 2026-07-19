import type { AuthSession, AuthUser, LoginRequest } from "@/contracts/auth";

type MockAccount = {
  credentials: LoginRequest;
  session: AuthSession;
};

const studentUser: AuthUser = {
  id: "student-001",
  displayName: "Nguyen Ha Linh",
  role: "student",
  schoolName: "THCS Minh Khai",
  classroomName: "6A1",
};

const teacherUser: AuthUser = {
  id: "teacher-001",
  displayName: "Co Tran Thu Ha",
  role: "teacher",
  schoolName: "THCS Minh Khai",
};

export const mockAuthAccounts: MockAccount[] = [
  {
    credentials: {
      username: "student.linh",
      password: "mina-student",
    },
    session: {
      user: studentUser,
    },
  },
  {
    credentials: {
      username: "teacher.ha",
      password: "mina-teacher",
    },
    session: {
      user: teacherUser,
    },
  },
];

let activeMockSession: AuthSession | null = null;

export function findMockAccountByCredentials(
  credentials: LoginRequest,
): MockAccount | undefined {
  return mockAuthAccounts.find(
    (account) =>
      account.credentials.username === credentials.username.trim() &&
      account.credentials.password === credentials.password,
  );
}

export function getMockActiveSession(): AuthSession | null {
  return activeMockSession;
}

export function setMockActiveSession(session: AuthSession | null): void {
  activeMockSession = session;
}

export function setMockActiveSessionForUserId(userId: string): void {
  activeMockSession =
    mockAuthAccounts.find((account) => account.session.user.id === userId)?.session ?? null;
}

export function clearMockActiveSession(): void {
  activeMockSession = null;
}
