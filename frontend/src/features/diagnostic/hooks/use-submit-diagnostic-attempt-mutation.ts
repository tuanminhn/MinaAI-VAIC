import { useMutation } from "@tanstack/react-query";
import type {
  SubmitDiagnosticAttemptRequest,
  SubmitDiagnosticAttemptResponse,
} from "@/contracts/diagnostic";
import { httpDiagnosticRepository } from "@/repositories/http-diagnostic-repository";

type SubmitDiagnosticAttemptVariables = {
  sessionId: string;
  input: SubmitDiagnosticAttemptRequest;
  signal?: AbortSignal;
};

export function useSubmitDiagnosticAttemptMutation() {
  return useMutation<
    SubmitDiagnosticAttemptResponse,
    Error,
    SubmitDiagnosticAttemptVariables
  >({
    mutationFn: ({ sessionId, input, signal }) =>
      httpDiagnosticRepository.submitAttempt(sessionId, input, signal),
    retry: 0,
  });
}
