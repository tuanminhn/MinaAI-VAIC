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

export interface DiagnosticRepository {
  getSession(sessionId: string, signal?: AbortSignal): Promise<DiagnosticSessionResponse>;
  startRemediation(
    sessionId: string,
    signal?: AbortSignal,
  ): Promise<StartRemediationRunResponse>;
  getRemediation(sessionId: string, signal?: AbortSignal): Promise<RemediationResponse>;
  submitRemediationAttempt(
    sessionId: string,
    input: SubmitRemediationAttemptRequest,
    signal?: AbortSignal,
  ): Promise<SubmitRemediationAttemptResponse>;
  startTransfer(sessionId: string, signal?: AbortSignal): Promise<StartTransferCheckResponse>;
  getTransfer(sessionId: string, signal?: AbortSignal): Promise<TransferResponse>;
  submitTransferAttempt(
    sessionId: string,
    input: SubmitTransferAttemptRequest,
    signal?: AbortSignal,
  ): Promise<SubmitTransferAttemptResponse>;
  getResult(sessionId: string, signal?: AbortSignal): Promise<DiagnosticResultResponse>;
  submitAttempt(
    sessionId: string,
    input: SubmitDiagnosticAttemptRequest,
    signal?: AbortSignal,
  ): Promise<SubmitDiagnosticAttemptResponse>;
}
