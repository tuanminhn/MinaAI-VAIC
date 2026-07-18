import type {
  StudentAssignmentsQuery,
  StudentAssignmentsResponse,
  StudentHomeResponse,
} from "@/contracts/student";

export interface StudentRepository {
  getHome(accessToken: string, signal?: AbortSignal): Promise<StudentHomeResponse>;
  listAssignments(
    accessToken: string,
    query?: StudentAssignmentsQuery,
    signal?: AbortSignal,
  ): Promise<StudentAssignmentsResponse>;
}
