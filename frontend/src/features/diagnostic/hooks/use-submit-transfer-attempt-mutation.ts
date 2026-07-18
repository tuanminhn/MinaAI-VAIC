import { useMutation } from "@tanstack/react-query";
import type {
  SubmitTransferAttemptRequest,
  SubmitTransferAttemptResponse,
} from "@/contracts/diagnostic";
import { httpDiagnosticRepository } from "@/repositories/http-diagnostic-repository";

type SubmitTransferAttemptVariables = {
  sessionId: string;
  input: SubmitTransferAttemptRequest;
  signal?: AbortSignal;
};

export function useSubmitTransferAttemptMutation() {
  return useMutation<SubmitTransferAttemptResponse, Error, SubmitTransferAttemptVariables>({
    mutationFn: ({ sessionId, input, signal }) =>
      httpDiagnosticRepository.submitTransferAttempt(sessionId, input, signal),
    retry: 0,
  });
}
