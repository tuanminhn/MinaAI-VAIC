import { useQuery } from "@tanstack/react-query";
import type { StudentAssignmentsQuery } from "@/contracts/student";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { queryKeys } from "@/lib/query/query-keys";
import { httpStudentRepository } from "@/repositories/http-student-repository";

export function useStudentAssignmentsQuery(query: StudentAssignmentsQuery = {}) {
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? null;
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 10;

  return useQuery({
    queryKey: queryKeys.student.assignments(accessToken, query.status, page, pageSize),
    queryFn: ({ signal }) =>
      httpStudentRepository.listAssignments(accessToken as string, { ...query, page, pageSize }, signal),
    enabled: Boolean(accessToken),
    retry: 0,
  });
}
