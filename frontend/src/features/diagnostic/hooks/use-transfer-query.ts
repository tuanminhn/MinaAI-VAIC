import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { queryKeys } from "@/lib/query/query-keys";
import { httpDiagnosticRepository } from "@/repositories/http-diagnostic-repository";

export function useTransferQuery(sessionId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.diagnostic.transfer(sessionId),
    queryFn: async ({ signal }) => {
      await httpDiagnosticRepository.startTransfer(sessionId, signal);
      return httpDiagnosticRepository.getTransfer(sessionId, signal);
    },
    enabled: Boolean(user) && sessionId.length > 0,
    retry: 0,
  });
}
