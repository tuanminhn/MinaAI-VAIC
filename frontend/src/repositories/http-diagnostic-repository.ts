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

export const httpDiagnosticRepository: DiagnosticRepository = {
  async getSession(
    sessionId: string,
    signal?: AbortSignal,
  ): Promise<DiagnosticSessionResponse> {
    const response = await httpRequest<unknown>(`/diagnostic-sessions/${sessionId}`, { signal });
    return diagnosticSessionResponseSchema.parse(response);
  },

  async submitAttempt(
    sessionId: string,
    input: SubmitDiagnosticAttemptRequest,
    signal?: AbortSignal,
  ): Promise<SubmitDiagnosticAttemptResponse> {
    const response = await httpRequest<unknown>(`/diagnostic-sessions/${sessionId}/attempts`, {
      method: "POST",
      body: input,
      signal,
    });
    return submitDiagnosticAttemptResponseSchema.parse(response);
  },
};
