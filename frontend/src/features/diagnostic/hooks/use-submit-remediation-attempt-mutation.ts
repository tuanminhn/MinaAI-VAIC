import { useMutation } from "@tanstack/react-query";
import type {
  SubmitRemediationAttemptRequest,
  SubmitRemediationAttemptResponse,
} from "@/contracts/diagnostic";
import { httpDiagnosticRepository } from "@/repositories/http-diagnostic-repository";

type SubmitRemediationAttemptVariables = {
  sessionId: string;
  input: SubmitRemediationAttemptRequest;
  signal?: AbortSignal;
};

export function useSubmitRemediationAttemptMutation() {
  return useMutation<
    SubmitRemediationAttemptResponse,
    Error,
    SubmitRemediationAttemptVariables
  >({
    mutationFn: ({ sessionId, input, signal }) =>
      httpDiagnosticRepository.submitRemediationAttempt(sessionId, input, signal),
    retry: 0,
  });
}
