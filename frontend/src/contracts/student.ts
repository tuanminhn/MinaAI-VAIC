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
  nextRoute?: string;
};

export type StudentHomeResponse = {
  student: {
    id: string;
    displayName: string;
    classroomName?: string;
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
  totalItems: number;
};
