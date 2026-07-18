import type {
  StudentAssignmentsQuery,
  StudentAssignmentsResponse,
  StudentHomeResponse,
} from "@/contracts/student";
import {
  studentAssignmentsResponseSchema,
  studentHomeResponseSchema,
} from "@/features/student/schemas/student-schema";
import { httpRequest } from "@/lib/api/http-client";
import type { StudentRepository } from "@/repositories/student-repository";

function createStudentRequestHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

function buildAssignmentsPath(query: StudentAssignmentsQuery = {}): string {
  const searchParams = new URLSearchParams();

  if (query.status) {
    searchParams.set("status", query.status);
  }

  if (query.page) {
    searchParams.set("page", String(query.page));
  }

  if (query.pageSize) {
    searchParams.set("pageSize", String(query.pageSize));
  }

  const queryString = searchParams.toString();
  return queryString.length > 0 ? `/student/assignments?${queryString}` : "/student/assignments";
}

export const httpStudentRepository: StudentRepository = {
  async getHome(accessToken: string, signal?: AbortSignal): Promise<StudentHomeResponse> {
    const response = await httpRequest<unknown>("/student/home", {
      headers: createStudentRequestHeaders(accessToken),
      signal,
    });
    return studentHomeResponseSchema.parse(response);
  },

  async listAssignments(
    accessToken: string,
    query: StudentAssignmentsQuery = {},
    signal?: AbortSignal,
  ): Promise<StudentAssignmentsResponse> {
    const response = await httpRequest<unknown>(buildAssignmentsPath(query), {
      headers: createStudentRequestHeaders(accessToken),
      signal,
    });
    return studentAssignmentsResponseSchema.parse(response);
  },
};
