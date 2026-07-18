import type {
  DiagnosticSessionResponse,
  SubmitDiagnosticAttemptRequest,
  SubmitDiagnosticAttemptResponse,
} from "@/contracts/diagnostic";
import {
  diagnosticSessionResponseSchema,
  submitDiagnosticAttemptResponseSchema,
} from "@/features/diagnostic/schemas/diagnostic-schema";
import { httpRequest } from "@/lib/api/http-client";
import type { DiagnosticRepository } from "@/repositories/diagnostic-repository";

function createDiagnosticRequestHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export const httpDiagnosticRepository: DiagnosticRepository = {
  async getSession(
    sessionId: string,
    accessToken: string,
    signal?: AbortSignal,
  ): Promise<DiagnosticSessionResponse> {
    const response = await httpRequest<unknown>(`/diagnostic-sessions/${sessionId}`, {
      headers: createDiagnosticRequestHeaders(accessToken),
      signal,
    });
    return diagnosticSessionResponseSchema.parse(response);
  },

  async submitAttempt(
    sessionId: string,
    accessToken: string,
    input: SubmitDiagnosticAttemptRequest,
    signal?: AbortSignal,
  ): Promise<SubmitDiagnosticAttemptResponse> {
    const response = await httpRequest<unknown>(`/diagnostic-sessions/${sessionId}/attempts`, {
      method: "POST",
      headers: createDiagnosticRequestHeaders(accessToken),
      body: input,
      signal,
    });
    return submitDiagnosticAttemptResponseSchema.parse(response);
  },
};
