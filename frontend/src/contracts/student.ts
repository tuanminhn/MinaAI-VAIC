export type AssignmentStatus =
  | "not_started"
  | "in_progress"
  | "remediation"
  | "transfer_ready"
  | "completed";

export type AssignmentSummary = {
  id: string;
  title: string;
  description?: string;
  subject: "math";
  grade: number;
  status: AssignmentStatus;
  progress: {
    completed: number;
    total: number;
  };
  estimatedMinutes?: number;
  assignedAt?: string;
  dueAt?: string;
  diagnosticAvailable: boolean;
  nextRoute?: string | null;
};

export type StudentHomeResponse = {
  student: {
    id: string;
    displayName: string;
    classroomName?: string | null;
    schoolName?: string | null;
  };
  currentAssignment?: AssignmentSummary;
  recentAssignments: AssignmentSummary[];
};

export type StudentAssignmentsQuery = {
  status?: AssignmentStatus;
  page?: number;
  pageSize?: number;
};

export type StudentAssignmentsResponse = {
  items: AssignmentSummary[];
  page: number;
  pageSize: number;
  total: number;
};

export type StartDiagnosticSessionResponse = {
  sessionId: string;
  state: "diagnosing" | "gap_confirmed" | "in_remediation" | "transfer_ready" | "completed";
  route: string;
  resumed: boolean;
};
