export type UserRole = "student" | "teacher";

export type AuthUser = {
  id: string;
  displayName: string;
  role: UserRole;
  schoolName?: string | null;
  classroomName?: string | null;
};

export type AuthSession = {
  user: AuthUser;
};

export type LoginRequest = {
  username: string;
  password: string;
};
