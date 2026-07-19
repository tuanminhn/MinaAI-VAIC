import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { queryKeys } from "@/lib/query/query-keys";
import { httpDiagnosticRepository } from "@/repositories/http-diagnostic-repository";

export function useRemediationQuery(sessionId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.diagnostic.remediation(sessionId),
    queryFn: async ({ signal }) => {
      await httpDiagnosticRepository.startRemediation(sessionId, signal);
      return httpDiagnosticRepository.getRemediation(sessionId, signal);
    },
    enabled: Boolean(user) && sessionId.length > 0,
    retry: 0,
  });
}
