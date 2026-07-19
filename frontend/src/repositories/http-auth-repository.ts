import type { AuthRepository } from "@/repositories/auth-repository";
import type { AuthSession, AuthUser, LoginRequest } from "@/contracts/auth";
import type { z } from "zod";
import {
  authSessionSchema,
  authUserSchemaForApi,
} from "@/features/auth/schemas/login-schema";
import { createApiError } from "@/lib/api/api-error";
import { httpRequest } from "@/lib/api/http-client";
import { HttpRequestError } from "@/lib/api/http-client";

function parseAuthPayload<T>(schema: z.ZodType<T>, response: unknown, context: string): T {
  const result = schema.safeParse(response);

  if (result.success) {
    return result.data;
  }

  console.error(`${context}: AUTH_RESPONSE_INVALID`, result.error.flatten());
  throw new HttpRequestError(
    createApiError({
      status: 200,
      code: "AUTH_RESPONSE_INVALID",
      message: "Phan hoi xac thuc khong hop le.",
    }),
  );
}

export const httpAuthRepository: AuthRepository = {
  async login(input: LoginRequest, signal?: AbortSignal): Promise<AuthSession> {
    const response = await httpRequest<unknown>("/auth/login", {
      method: "POST",
      body: input,
      signal,
    });
    return parseAuthPayload(authSessionSchema, response, "login");
  },

  async getCurrentUser(signal?: AbortSignal): Promise<AuthUser> {
    const response = await httpRequest<unknown>("/auth/me", { signal });
    return parseAuthPayload(authUserSchemaForApi, response, "me");
  },

  async logout(signal?: AbortSignal): Promise<void> {
    await httpRequest("/auth/logout", {
      method: "POST",
      signal,
    });
  },
};
