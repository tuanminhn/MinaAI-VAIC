import { useMutation } from "@tanstack/react-query";
import type { StartDiagnosticSessionResponse } from "@/contracts/student";
import { httpStudentRepository } from "@/repositories/http-student-repository";

type StartDiagnosticSessionVariables = {
  assignmentId: string;
  signal?: AbortSignal;
};

export function useStartDiagnosticSessionMutation() {
  return useMutation<StartDiagnosticSessionResponse, Error, StartDiagnosticSessionVariables>({
    mutationFn: ({ assignmentId, signal }) =>
      httpStudentRepository.startDiagnosticSession(assignmentId, signal),
    retry: 0,
  });
}
