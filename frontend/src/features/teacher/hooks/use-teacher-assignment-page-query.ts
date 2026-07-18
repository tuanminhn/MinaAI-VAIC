import { useQueries } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { httpTeacherRepository } from "@/repositories/http-teacher-repository";

export function useTeacherAssignmentPageQuery(
  assignmentId: string,
  page = 1,
  pageSize = 20,
) {
  const [overviewQuery, studentsQuery] = useQueries({
    queries: [
      {
        queryKey: queryKeys.teacher.assignmentOverview(assignmentId),
        queryFn: ({ signal }) => httpTeacherRepository.getAssignmentOverview(assignmentId, signal),
        enabled: assignmentId.length > 0,
        retry: 0,
      },
      {
        queryKey: queryKeys.teacher.assignmentStudents(assignmentId, page, pageSize),
        queryFn: ({ signal }) =>
          httpTeacherRepository.listAssignmentStudents(
            assignmentId,
            { page, pageSize },
            signal,
          ),
        enabled: assignmentId.length > 0,
        retry: 0,
      },
    ],
  });

  return { overviewQuery, studentsQuery };
}
