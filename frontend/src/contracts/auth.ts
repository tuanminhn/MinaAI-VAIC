export type UserRole = "student" | "teacher";

export type AuthUser = {
  id: string;
  displayName: string;
  role: UserRole;
  schoolName?: string;
  classroomName?: string;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};
