import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { httpTeacherRepository } from "@/repositories/http-teacher-repository";

export function useTeacherClassesQuery() {
  return useQuery({
    queryKey: queryKeys.teacher.classes(),
    queryFn: ({ signal }) => httpTeacherRepository.listClasses(signal),
    retry: 0,
  });
}
