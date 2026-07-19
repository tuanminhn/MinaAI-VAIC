export type ReviewStatus = "pending" | "approved" | "rejected";
export type QuestionType = "diagnostic" | "remediation" | "transfer";
export type DiagnosisStatus = "diagnosed" | "mastered" | "insufficient_evidence" | "outside_mvp_scope";

export type AnswerOption = {
  id: string;
  content: string;
  is_correct: boolean;
  misconception_id?: string;
};

export type Question = {
  id: string;
  type: QuestionType;
  grade: 6 | 7 | 8 | 9;
  stem: string;
  skill_ids: string[];
  options: AnswerOption[];
  explanation: string;
  provenance?: unknown[];
  review_status: ReviewStatus;
};

export type Misconception = {
  id: string;
  description: string;
  error_pattern: string;
  severity: "fundamental" | "major" | string;
  skill_ids: string[];
  review_status: ReviewStatus;
};

export type KnowledgeEdge = {
  source_skill_id: string;
  target_skill_id: string;
  relationship_type: "prerequisite" | "supporting";
  evidence: string;
  confidence: number;
};

export type SubmittedAnswer = {
  questionId: string;
  optionId: string;
};

export type DiagnosisEvidence = {
  questionId: string;
  stem: string;
  selectedOptionId: string;
  selectedContent: string;
  correctOptionId: string;
  isCorrect: boolean;
  misconceptionId?: string;
  misconception?: string;
};

export type Diagnosis = {
  status: DiagnosisStatus;
  targetSkillId: string;
  rootCauseSkillId: string | null;
  confidence: number;
  evidence: DiagnosisEvidence[];
  recommendedPathId: string | null;
  nextQuestionId: string | null;
  engineVersion: string;
  contentVersion: string;
};

export type StudentSummary = {
  id: string;
  displayName: string;
  studentNumber: string | null;
  scenario: string | null;
  diagnosis: Diagnosis | null;
  remediationStatus: string | null;
  personalizedPracticeStatus: "draft" | "assigned" | "in_progress" | "submitted" | null;
};

export type PracticeQuestion = {
  id: string;
  stem: string;
  options: { id: string; content: string }[];
  correctOptionId: string;
  explanation: string;
  targetedMisconception: string;
  difficulty: "foundation" | "practice" | "transfer";
};

export type PersonalizedPractice = {
  id: string;
  studentId: string;
  studentDisplayName: string;
  studentNumber: string | null;
  skillId: string;
  skillName: string;
  title: string;
  objective: string;
  instructions: string;
  questions: PracticeQuestion[];
  citations: string[];
  status: "draft" | "assigned" | "in_progress" | "submitted";
  score?: number | null;
  total?: number | null;
};
