export type AiMeta = {
  mode: "llm" | "fallback";
  provider: string;
  model: string;
  grounded: true;
  requiresTeacherApproval: boolean;
  reason?: "not_configured" | "disabled" | "provider_error" | "invalid_output";
};

export type AnswerExplanation = {
  feedback: string;
  concept: string;
  steps: string[];
  selfCheckQuestion: string;
  citations: string[];
};

export type ClassSummary = {
  headline: string;
  overview: string;
  priorities: { title: string; reason: string; studentCount: number }[];
  classWideGaps: { skillId: string; skillName: string; studentCount: number; reason: string }[];
  nextActions: string[];
  citations: string[];
};

export type ReteachPlan = {
  title: string;
  objective: string;
  durationMinutes: number;
  group: { skillId: string; skillName: string; studentCount: number };
  agenda: { minutes: number; activity: string; teacherMove: string }[];
  workedExample: string;
  checks: string[];
  differentiation: { support: string; extension: string };
  citations: string[];
};

export type PersonalizedPracticeContent = {
  title: string;
  objective: string;
  instructions: string;
  questions: {
    id: string;
    stem: string;
    options: { id: string; content: string }[];
    correctOptionId: string;
    explanation: string;
    targetedMisconception: string;
    difficulty: "foundation" | "practice" | "transfer";
  }[];
  citations: string[];
};

export type AiResponse<T> = T & { ai: AiMeta };
