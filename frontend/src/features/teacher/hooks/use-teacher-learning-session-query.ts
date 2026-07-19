import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { httpTeacherRepository } from "@/repositories/http-teacher-repository";

export function useTeacherLearningSessionQuery(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.teacher.learningSession(sessionId),
    queryFn: ({ signal }) => httpTeacherRepository.getLearningSessionEvidence(sessionId, signal),
    enabled: sessionId.length > 0,
    retry: 0,
  });
}
