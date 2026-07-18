import type { AuthSession, LoginRequest, AuthUser } from "@/contracts/auth";
import type { AuthNotice } from "@/features/auth/types/auth-notice";

export type AuthStatus = "restoring" | "authenticated" | "unauthenticated";

export type AuthContextValue = {
  status: AuthStatus;
  session: AuthSession | null;
  user: AuthUser | null;
  notice: AuthNotice | null;
  signIn(input: LoginRequest): Promise<AuthSession>;
  signOut(): Promise<void>;
  resetSession(notice?: AuthNotice): void;
  clearNotice(): void;
};
