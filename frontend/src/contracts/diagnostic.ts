export type DiagnosticSessionState =
  | "diagnosing"
  | "gap_confirmed"
  | "in_remediation"
  | "transfer_ready"
  | "completed";

export type DiagnosticOption = {
  id: string;
  label: string;
};

export type DiagnosticQuestion = {
  id: string;
  prompt: string;
  options: DiagnosticOption[];
  selectionMode: "single";
};

export type DiagnosticProgress = {
  answered: number;
  estimatedTotal?: number;
};

export type DiagnosticSessionResponse = {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  state: DiagnosticSessionState;
  progress: DiagnosticProgress;
  currentQuestion?: DiagnosticQuestion;
  nextRoute?: string;
};

export type SubmitDiagnosticAttemptRequest = {
  questionId: string;
  selectedOptionId: string;
};

export type DiagnosticFeedbackTone = "neutral" | "encouraging" | "corrective";

export type SubmitDiagnosticAttemptResponse = {
  attemptId: string;
  correct?: boolean;
  feedback: {
    title: string;
    message: string;
    tone: DiagnosticFeedbackTone;
  };
  nextAction:
    | {
        type: "next_question";
        label: string;
      }
    | {
        type: "navigate";
        route: string;
        label: string;
      }
    | {
        type: "completed";
        route: string;
        label: string;
      };
};
