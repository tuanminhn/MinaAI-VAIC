import { useMutation } from "@tanstack/react-query";
import type {
  SubmitDiagnosticAttemptRequest,
  SubmitDiagnosticAttemptResponse,
} from "@/contracts/diagnostic";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { httpDiagnosticRepository } from "@/repositories/http-diagnostic-repository";

type SubmitDiagnosticAttemptVariables = {
  sessionId: string;
  input: SubmitDiagnosticAttemptRequest;
  signal?: AbortSignal;
};

export function useSubmitDiagnosticAttemptMutation() {
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? null;

  return useMutation<
    SubmitDiagnosticAttemptResponse,
    Error,
    SubmitDiagnosticAttemptVariables
  >({
    mutationFn: ({ sessionId, input, signal }) =>
      httpDiagnosticRepository.submitAttempt(sessionId, accessToken as string, input, signal),
    retry: 0,
  });
}
