import type {
  StudentAssignmentsQuery,
  StudentAssignmentsResponse,
  StudentHomeResponse,
} from "@/contracts/student";

export interface StudentRepository {
  getHome(signal?: AbortSignal): Promise<StudentHomeResponse>;
  listAssignments(
    query?: StudentAssignmentsQuery,
    signal?: AbortSignal,
  ): Promise<StudentAssignmentsResponse>;
}
