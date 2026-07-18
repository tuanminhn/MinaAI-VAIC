import type {
  TeacherAssignmentOverviewResponse,
  TeacherAssignmentStudentsQuery,
  TeacherAssignmentStudentsResponse,
  TeacherClassAssignmentsResponse,
  TeacherClassDetailResponse,
  TeacherClassesResponse,
  TeacherLearningSessionEvidenceResponse,
  TeacherStudentsResponse,
} from "@/contracts/teacher";

export type TeacherRepository = {
  listClasses(signal?: AbortSignal): Promise<TeacherClassesResponse>;
  getClassDetail(classId: string, signal?: AbortSignal): Promise<TeacherClassDetailResponse>;
  listClassStudents(classId: string, signal?: AbortSignal): Promise<TeacherStudentsResponse>;
  listClassAssignments(
    classId: string,
    signal?: AbortSignal,
  ): Promise<TeacherClassAssignmentsResponse>;
  getAssignmentOverview(
    assignmentId: string,
    signal?: AbortSignal,
  ): Promise<TeacherAssignmentOverviewResponse>;
  listAssignmentStudents(
    assignmentId: string,
    query?: TeacherAssignmentStudentsQuery,
    signal?: AbortSignal,
  ): Promise<TeacherAssignmentStudentsResponse>;
  getLearningSessionEvidence(
    sessionId: string,
    signal?: AbortSignal,
  ): Promise<TeacherLearningSessionEvidenceResponse>;
};
