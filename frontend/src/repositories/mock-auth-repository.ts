import type { AuthRepository } from "@/repositories/auth-repository";
import type { AuthSession, AuthUser, LoginRequest } from "@/contracts/auth";
import {
  findMockAccountByCredentials,
  findMockSessionByToken,
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
            code: "invalid_credentials",
            message: "Ten dang nhap hoac mat khau khong dung.",
          }),
        ),
      );
    }

    return Promise.resolve(account.session);
  },

  getCurrentUser(accessToken: string): Promise<AuthUser> {
    const session = findMockSessionByToken(accessToken);

    if (!session) {
      return Promise.reject(
        new HttpRequestError(
          createApiError({
            status: 401,
            code: "session_expired",
            message: "Phien dang nhap da het han.",
          }),
        ),
      );
    }

    return Promise.resolve(session.user);
  },

  async logout(): Promise<void> {
    return Promise.resolve();
  },
};
