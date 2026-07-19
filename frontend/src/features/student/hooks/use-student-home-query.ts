import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { queryKeys } from "@/lib/query/query-keys";
import { httpStudentRepository } from "@/repositories/http-student-repository";

export function useStudentHomeQuery() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.student.home(),
    queryFn: ({ signal }) => httpStudentRepository.getHome(signal),
    enabled: Boolean(user),
    retry: 0,
  });
}
