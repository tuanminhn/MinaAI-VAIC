import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { queryKeys } from "@/lib/query/query-keys";
import { httpDiagnosticRepository } from "@/repositories/http-diagnostic-repository";

export function useResultQuery(sessionId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.diagnostic.result(sessionId),
    queryFn: ({ signal }) => httpDiagnosticRepository.getResult(sessionId, signal),
    enabled: Boolean(user) && sessionId.length > 0,
    retry: 0,
  });
}
