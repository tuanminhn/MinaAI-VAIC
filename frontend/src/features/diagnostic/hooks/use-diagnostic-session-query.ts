import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { queryKeys } from "@/lib/query/query-keys";
import { httpDiagnosticRepository } from "@/repositories/http-diagnostic-repository";

export function useDiagnosticSessionQuery(sessionId: string) {
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? null;

  return useQuery({
    queryKey: queryKeys.diagnostic.session(accessToken, sessionId),
    queryFn: ({ signal }) =>
      httpDiagnosticRepository.getSession(sessionId, accessToken as string, signal),
    enabled: Boolean(accessToken) && sessionId.length > 0,
    retry: 0,
  });
}
