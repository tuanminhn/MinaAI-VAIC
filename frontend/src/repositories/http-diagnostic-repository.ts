import type {
  DiagnosticResultResponse,
  DiagnosticSessionResponse,
  RemediationResponse,
  StartRemediationRunResponse,
  StartTransferCheckResponse,
  SubmitDiagnosticAttemptRequest,
  SubmitDiagnosticAttemptResponse,
  SubmitRemediationAttemptRequest,
  SubmitRemediationAttemptResponse,
  SubmitTransferAttemptRequest,
  SubmitTransferAttemptResponse,
  TransferResponse,
} from "@/contracts/diagnostic";
import {
  diagnosticResultResponseSchema,
  diagnosticSessionResponseSchema,
  remediationResponseSchema,
  startRemediationRunResponseSchema,
  startTransferCheckResponseSchema,
  submitDiagnosticAttemptResponseSchema,
  submitRemediationAttemptResponseSchema,
  submitTransferAttemptResponseSchema,
  transferResponseSchema,
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

  async startRemediation(
    sessionId: string,
    signal?: AbortSignal,
  ): Promise<StartRemediationRunResponse> {
    const response = await httpRequest<unknown>(
      `/diagnostic-sessions/${sessionId}/remediation-runs`,
      {
        method: "POST",
        signal,
      },
    );
    return startRemediationRunResponseSchema.parse(response);
  },

  async getRemediation(sessionId: string, signal?: AbortSignal): Promise<RemediationResponse> {
    const response = await httpRequest<unknown>(
      `/diagnostic-sessions/${sessionId}/remediation`,
      { signal },
    );
    return remediationResponseSchema.parse(response);
  },

  async submitRemediationAttempt(
    sessionId: string,
    input: SubmitRemediationAttemptRequest,
    signal?: AbortSignal,
  ): Promise<SubmitRemediationAttemptResponse> {
    const response = await httpRequest<unknown>(
      `/diagnostic-sessions/${sessionId}/remediation/attempts`,
      {
        method: "POST",
        body: input,
        signal,
      },
    );
    return submitRemediationAttemptResponseSchema.parse(response);
  },

  async startTransfer(
    sessionId: string,
    signal?: AbortSignal,
  ): Promise<StartTransferCheckResponse> {
    const response = await httpRequest<unknown>(
      `/diagnostic-sessions/${sessionId}/transfer-checks`,
      {
        method: "POST",
        signal,
      },
    );
    return startTransferCheckResponseSchema.parse(response);
  },

  async getTransfer(sessionId: string, signal?: AbortSignal): Promise<TransferResponse> {
    const response = await httpRequest<unknown>(`/diagnostic-sessions/${sessionId}/transfer`, {
      signal,
    });
    return transferResponseSchema.parse(response);
  },

  async submitTransferAttempt(
    sessionId: string,
    input: SubmitTransferAttemptRequest,
    signal?: AbortSignal,
  ): Promise<SubmitTransferAttemptResponse> {
    const response = await httpRequest<unknown>(
      `/diagnostic-sessions/${sessionId}/transfer/attempts`,
      {
        method: "POST",
        body: input,
        signal,
      },
    );
    return submitTransferAttemptResponseSchema.parse(response);
  },

  async getResult(sessionId: string, signal?: AbortSignal): Promise<DiagnosticResultResponse> {
    const response = await httpRequest<unknown>(`/diagnostic-sessions/${sessionId}/result`, {
      signal,
    });
    return diagnosticResultResponseSchema.parse(response);
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
