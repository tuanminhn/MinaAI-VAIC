import type {
  DiagnosticSessionResponse,
  SubmitDiagnosticAttemptRequest,
  SubmitDiagnosticAttemptResponse,
} from "@/contracts/diagnostic";

export interface DiagnosticRepository {
  getSession(sessionId: string, accessToken: string, signal?: AbortSignal): Promise<DiagnosticSessionResponse>;
  submitAttempt(
    sessionId: string,
    accessToken: string,
    input: SubmitDiagnosticAttemptRequest,
    signal?: AbortSignal,
  ): Promise<SubmitDiagnosticAttemptResponse>;
}
