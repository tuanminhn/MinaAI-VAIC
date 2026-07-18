import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { queryKeys } from "@/lib/query/query-keys";
import { httpStudentRepository } from "@/repositories/http-student-repository";

export function useStudentHomeQuery() {
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? null;

  return useQuery({
    queryKey: queryKeys.student.home(accessToken),
    queryFn: ({ signal }) => httpStudentRepository.getHome(accessToken as string, signal),
    enabled: Boolean(accessToken),
    retry: 0,
  });
}
