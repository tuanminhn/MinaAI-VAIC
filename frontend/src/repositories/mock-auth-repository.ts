import type { AuthRepository } from "@/repositories/auth-repository";
import type { AuthSession, AuthUser, LoginRequest } from "@/contracts/auth";
import {
  clearMockActiveSession,
  findMockAccountByCredentials,
  getMockActiveSession,
  setMockActiveSession,
} from "@/fixtures/auth";
import { createApiError } from "@/lib/api/api-error";
import { HttpRequestError } from "@/lib/api/http-client";

export const mockAuthRepository: AuthRepository = {
  login(input: LoginRequest): Promise<AuthSession> {
    const account = findMockAccountByCredentials(input);

    if (!account) {
      return Promise.reject(
        new HttpRequestError(
          createApiError({
            status: 401,
            code: "INVALID_CREDENTIALS",
            message: "Ten dang nhap hoac mat khau khong dung.",
          }),
        ),
      );
    }

    setMockActiveSession(account.session);
    return Promise.resolve(account.session);
  },

  getCurrentUser(): Promise<AuthUser> {
    const session = getMockActiveSession();

    if (!session) {
      return Promise.reject(
        new HttpRequestError(
          createApiError({
            status: 401,
            code: "AUTH_REQUIRED",
            message: "Ban can dang nhap de tiep tuc.",
          }),
        ),
      );
    }

    return Promise.resolve(session.user);
  },

  async logout(): Promise<void> {
    clearMockActiveSession();
    return Promise.resolve();
  },
};
