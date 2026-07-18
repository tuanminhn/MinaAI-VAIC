import type { AuthSession, AuthUser, LoginRequest } from "@/contracts/auth";

type MockAccount = {
  credentials: LoginRequest;
  session: AuthSession;
};

const studentUser: AuthUser = {
  id: "student-001",
  displayName: "Nguyễn Hà Linh",
  role: "student",
  schoolName: "THCS Minh Khai",
  classroomName: "6A1",
};

const teacherUser: AuthUser = {
  id: "teacher-001",
  displayName: "Cô Trần Thu Hà",
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
      accessToken: "mock-token-student-001",
    },
  },
  {
    credentials: {
      username: "teacher.ha",
      password: "mina-teacher",
    },
    session: {
      user: teacherUser,
      accessToken: "mock-token-teacher-001",
    },
  },
];

export function findMockAccountByCredentials(
  credentials: LoginRequest,
): MockAccount | undefined {
  return mockAuthAccounts.find(
    (account) =>
      account.credentials.username === credentials.username.trim() &&
      account.credentials.password === credentials.password,
  );
}

export function findMockSessionByToken(token: string): AuthSession | undefined {
  return mockAuthAccounts.find((account) => account.session.accessToken === token)?.session;
}
