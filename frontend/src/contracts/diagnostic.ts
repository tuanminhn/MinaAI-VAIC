export type DiagnosticSessionState =
  | "diagnosing"
  | "gap_confirmed"
  | "in_remediation"
  | "transfer_ready"
  | "completed";

export type DiagnosticOutcome =
  | "mastered_without_remediation"
  | "mastered_after_remediation"
  | "needs_teacher_support";

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
  total?: number;
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
  clientAttemptId: string;
};

export type DiagnosticFeedbackTone = "neutral" | "encouraging" | "corrective";

export type DiagnosticFeedback = {
  title: string;
  message: string;
  tone: DiagnosticFeedbackTone;
};

export type NextQuestionAction = {
  type: "next_question";
  label: string;
};

export type NavigateAction = {
  type: "navigate";
  route: string;
  label: string;
};

export type CompletedAction = {
  type: "completed";
  route: string;
  label: string;
};

export type LearningNextAction = NextQuestionAction | NavigateAction | CompletedAction;

export type SubmitDiagnosticAttemptResponse = {
  attemptId: string;
  correct?: boolean;
  feedback: DiagnosticFeedback;
  nextAction: LearningNextAction;
};

export type StartRemediationRunResponse = {
  sessionId: string;
  runId: string;
  cycleNumber: number;
  state: DiagnosticSessionState;
  route: string;
  resumed: boolean;
};

export type RemediationUnit = {
  title: string;
  summary: string;
  explanation: string;
  workedExample: string;
  practiceInstruction: string;
};

export type RemediationResponse = {
  sessionId: string;
  assignmentTitle: string;
  state: DiagnosticSessionState;
  cycleNumber: number;
  unit: RemediationUnit;
  progress: DiagnosticProgress;
  currentQuestion?: DiagnosticQuestion;
  nextRoute?: string;
};

export type SubmitRemediationAttemptRequest = SubmitDiagnosticAttemptRequest;

export type SubmitRemediationAttemptResponse = {
  attemptId: string;
  correct?: boolean;
  feedback: DiagnosticFeedback;
  nextAction: NextQuestionAction | NavigateAction;
};

export type StartTransferCheckResponse = {
  sessionId: string;
  transferCheckId: string;
  cycleNumber: number;
  state: DiagnosticSessionState;
  route: string;
  resumed: boolean;
};

export type TransferResponse = {
  sessionId: string;
  assignmentTitle: string;
  state: DiagnosticSessionState;
  cycleNumber: number;
  progress: DiagnosticProgress;
  currentQuestion?: DiagnosticQuestion;
  nextRoute?: string;
};

export type SubmitTransferAttemptRequest = SubmitDiagnosticAttemptRequest;

export type SubmitTransferAttemptResponse = {
  attemptId: string;
  correct?: boolean;
  feedback: DiagnosticFeedback;
  nextAction: LearningNextAction;
};

export type DiagnosticResultResponse = {
  sessionId: string;
  assignment: {
    id: string;
    title: string;
  };
  outcome: DiagnosticOutcome;
  summary: {
    title: string;
    message: string;
  };
  learningEvidence: {
    diagnosticQuestionsAnswered: number;
    remediationQuestionsAnswered: number;
    transferQuestionsAnswered: number;
    remediationCycles: number;
  };
  rootCause?: {
    name: string;
  } | null;
  completedAt?: string | null;
};
