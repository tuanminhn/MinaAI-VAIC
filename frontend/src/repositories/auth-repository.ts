import type { AuthSession, AuthUser, LoginRequest } from "@/contracts/auth";

export interface AuthRepository {
  login(input: LoginRequest, signal?: AbortSignal): Promise<AuthSession>;
  getCurrentUser(signal?: AbortSignal): Promise<AuthUser>;
  logout(signal?: AbortSignal): Promise<void>;
}
