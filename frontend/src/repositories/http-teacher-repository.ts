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
import {
  teacherAssignmentOverviewResponseSchema,
  teacherAssignmentStudentsResponseSchema,
  teacherClassesResponseSchema,
  teacherClassAssignmentsResponseSchema,
  teacherClassDetailResponseSchema,
  teacherLearningSessionEvidenceResponseSchema,
  teacherStudentsResponseSchema,
  teacherInterventionsResponseSchema,
  teacherStudentProfileResponseSchema,
  teacherSupportGroupsResponseSchema,
} from "@/features/teacher/schemas/teacher-schema";
import { httpRequest } from "@/lib/api/http-client";
import type { TeacherRepository } from "@/repositories/teacher-repository";

function buildAssignmentStudentsPath(
  assignmentId: string,
  query: TeacherAssignmentStudentsQuery = {},
): string {
  const searchParams = new URLSearchParams();

  if (query.page) {
    searchParams.set("page", String(query.page));
  }
  if (query.pageSize) {
    searchParams.set("pageSize", String(query.pageSize));
  }

  const queryString = searchParams.toString();
  return queryString.length > 0
    ? `/teacher/assignments/${assignmentId}/students?${queryString}`
    : `/teacher/assignments/${assignmentId}/students`;
}

export const httpTeacherRepository: TeacherRepository = {
  async listClasses(signal?: AbortSignal): Promise<TeacherClassesResponse> {
    const response = await httpRequest<unknown>("/teacher/classes", { signal });
    return teacherClassesResponseSchema.parse(response);
  },

  async getClassDetail(classId: string, signal?: AbortSignal): Promise<TeacherClassDetailResponse> {
    const response = await httpRequest<unknown>(`/teacher/classes/${classId}`, { signal });
    return teacherClassDetailResponseSchema.parse(response);
  },

  async listClassStudents(classId: string, signal?: AbortSignal): Promise<TeacherStudentsResponse> {
    const response = await httpRequest<unknown>(`/teacher/classes/${classId}/students`, {
      signal,
    });
    return teacherStudentsResponseSchema.parse(response);
  },

  async listClassAssignments(
    classId: string,
    signal?: AbortSignal,
  ): Promise<TeacherClassAssignmentsResponse> {
    const response = await httpRequest<unknown>(`/teacher/classes/${classId}/assignments`, {
      signal,
    });
    return teacherClassAssignmentsResponseSchema.parse(response);
  },

  async getAssignmentOverview(
    assignmentId: string,
    signal?: AbortSignal,
  ): Promise<TeacherAssignmentOverviewResponse> {
    const response = await httpRequest<unknown>(`/teacher/assignments/${assignmentId}/overview`, {
      signal,
    });
    return teacherAssignmentOverviewResponseSchema.parse(response);
  },

  async listAssignmentStudents(
    assignmentId: string,
    query: TeacherAssignmentStudentsQuery = {},
    signal?: AbortSignal,
  ): Promise<TeacherAssignmentStudentsResponse> {
    const response = await httpRequest<unknown>(buildAssignmentStudentsPath(assignmentId, query), {
      signal,
    });
    return teacherAssignmentStudentsResponseSchema.parse(response);
  },

  async getLearningSessionEvidence(
    sessionId: string,
    signal?: AbortSignal,
  ): Promise<TeacherLearningSessionEvidenceResponse> {
    const response = await httpRequest<unknown>(`/teacher/learning-sessions/${sessionId}`, {
      signal,
    });
    return teacherLearningSessionEvidenceResponseSchema.parse(response);
  },

  async listSupportGroups(signal?: AbortSignal): Promise<TeacherSupportGroupsResponse> {
    return teacherSupportGroupsResponseSchema.parse(
      await httpRequest<unknown>("/teacher/support-groups", { signal }),
    );
  },

  async listInterventions(signal?: AbortSignal): Promise<TeacherInterventionsResponse> {
    return teacherInterventionsResponseSchema.parse(
      await httpRequest<unknown>("/teacher/interventions", { signal }),
    );
  },

  async getStudentProfile(studentId: string, signal?: AbortSignal): Promise<TeacherStudentProfileResponse> {
    return teacherStudentProfileResponseSchema.parse(
      await httpRequest<unknown>(`/teacher/students/${studentId}/profile`, { signal }),
    );
  },

  async createAssignment(classId: string, payload: TeacherCreateAssignmentRequest): Promise<TeacherCreateAssignmentResponse> {
    return httpRequest<TeacherCreateAssignmentResponse>(`/teacher/classes/${classId}/assignments`, { method: "POST", body: payload });
  },
};
