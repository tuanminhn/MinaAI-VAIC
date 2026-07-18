import type { AuthSession, AuthUser, LoginRequest } from "@/contracts/auth";

export interface AuthRepository {
  login(input: LoginRequest, signal?: AbortSignal): Promise<AuthSession>;
  getCurrentUser(accessToken: string, signal?: AbortSignal): Promise<AuthUser>;
  logout(accessToken: string, signal?: AbortSignal): Promise<void>;
}
