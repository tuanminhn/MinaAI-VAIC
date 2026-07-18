import { useQueries } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { httpTeacherRepository } from "@/repositories/http-teacher-repository";

export function useTeacherClassPageQuery(classId: string) {
  const [detailQuery, assignmentsQuery, studentsQuery] = useQueries({
    queries: [
      {
        queryKey: queryKeys.teacher.classDetail(classId),
        queryFn: ({ signal }) => httpTeacherRepository.getClassDetail(classId, signal),
        enabled: classId.length > 0,
        retry: 0,
      },
      {
        queryKey: queryKeys.teacher.classAssignments(classId),
        queryFn: ({ signal }) => httpTeacherRepository.listClassAssignments(classId, signal),
        enabled: classId.length > 0,
        retry: 0,
      },
      {
        queryKey: queryKeys.teacher.classStudents(classId),
        queryFn: ({ signal }) => httpTeacherRepository.listClassStudents(classId, signal),
        enabled: classId.length > 0,
        retry: 0,
      },
    ],
  });

  return { detailQuery, assignmentsQuery, studentsQuery };
}
