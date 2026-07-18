import type { AuthRepository } from "@/repositories/auth-repository";
import type { AuthSession, AuthUser, LoginRequest } from "@/contracts/auth";
import {
  authSessionSchema,
  authUserSchemaForApi,
} from "@/features/auth/schemas/login-schema";
import { httpRequest } from "@/lib/api/http-client";

export const httpAuthRepository: AuthRepository = {
  async login(input: LoginRequest, signal?: AbortSignal): Promise<AuthSession> {
    const response = await httpRequest<unknown>("/auth/login", {
      method: "POST",
      body: input,
      signal,
    });
    return authSessionSchema.parse(response);
  },

  async getCurrentUser(accessToken: string, signal?: AbortSignal): Promise<AuthUser> {
    const response = await httpRequest<unknown>("/auth/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal,
    });
    return authUserSchemaForApi.parse(response);
  },

  async logout(accessToken: string, signal?: AbortSignal): Promise<void> {
    await httpRequest("/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal,
    });
  },
};
