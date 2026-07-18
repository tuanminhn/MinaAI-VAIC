import type {
  TeacherAssignmentOverviewResponse,
  TeacherAssignmentStudentsQuery,
  TeacherAssignmentStudentsResponse,
  TeacherClassAssignmentsResponse,
  TeacherClassDetailResponse,
  TeacherClassesResponse,
  TeacherLearningSessionEvidenceResponse,
  TeacherStudentsResponse,
  TeacherInterventionsResponse,
  TeacherStudentProfileResponse,
  TeacherSupportGroupsResponse,
  TeacherCreateAssignmentRequest,
  TeacherCreateAssignmentResponse,
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
  listSupportGroups(signal?: AbortSignal): Promise<TeacherSupportGroupsResponse>;
  listInterventions(signal?: AbortSignal): Promise<TeacherInterventionsResponse>;
  getStudentProfile(studentId: string, signal?: AbortSignal): Promise<TeacherStudentProfileResponse>;
  createAssignment(classId: string, payload: TeacherCreateAssignmentRequest): Promise<TeacherCreateAssignmentResponse>;
};
