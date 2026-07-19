import { useQuery } from "@tanstack/react-query";
import type { StudentAssignmentsQuery } from "@/contracts/student";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { queryKeys } from "@/lib/query/query-keys";
import { httpStudentRepository } from "@/repositories/http-student-repository";

export function useStudentAssignmentsQuery(query: StudentAssignmentsQuery = {}) {
  const { user } = useAuth();
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 10;

  return useQuery({
    queryKey: queryKeys.student.assignments(query.status, page, pageSize),
    queryFn: ({ signal }) =>
      httpStudentRepository.listAssignments({ ...query, page, pageSize }, signal),
    enabled: Boolean(user),
    retry: 0,
  });
}
