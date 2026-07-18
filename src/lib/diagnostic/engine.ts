import type { Diagnosis, KnowledgeEdge, Misconception, Question, SubmittedAnswer } from "@/lib/contracts";

export const ENGINE_VERSION = "rules-v1.0.0";
export const TARGET_SKILL_ID = "MATH.G7.RATIONAL.ADD_SUBTRACT";
export const CONTENT_VERSION = "MINA_KNTT_MATH_G6_G7_DEMO_V1";
export const DEFAULT_PATH_ID = "PATH.G6_TO_G7.COMMON_DENOM.ADD";
export const NEXT_PROBE_QUESTION_ID = "Q.DIAG.G6.COMMON_DENOM.001";

type EngineInput = {
  answers: SubmittedAnswer[];
  questions: Question[];
  misconceptions: Misconception[];
  edges?: KnowledgeEdge[];
  targetSkillId?: string;
};

export function diagnose({
  answers,
  questions,
  misconceptions,
  edges = [],
  targetSkillId = TARGET_SKILL_ID,
}: EngineInput): Diagnosis {
  const base = {
    targetSkillId,
    engineVersion: ENGINE_VERSION,
    contentVersion: CONTENT_VERSION,
  };

  if (targetSkillId !== TARGET_SKILL_ID) {
    return {
      ...base,
      status: "outside_mvp_scope",
      rootCauseSkillId: null,
      confidence: 1,
      evidence: [],
      recommendedPathId: null,
      nextQuestionId: null,
    };
  }

  const questionById = new Map(questions.map((question) => [question.id, question]));
  const misconceptionById = new Map(misconceptions.map((item) => [item.id, item]));
  const evidence = answers.flatMap((answer) => {
    const question = questionById.get(answer.questionId);
    if (!question || question.type !== "diagnostic") return [];
    const selected = question.options.find((item) => item.id === answer.optionId);
    const correct = question.options.find((item) => item.is_correct);
    if (!selected || !correct) return [];
    const misconception = selected.misconception_id
      ? misconceptionById.get(selected.misconception_id)
      : undefined;
    return [{
      questionId: question.id,
      stem: question.stem,
      selectedOptionId: selected.id,
      selectedContent: selected.content,
      correctOptionId: correct.id,
      isCorrect: selected.is_correct,
      misconceptionId: selected.misconception_id,
      misconception: misconception?.description,
    }];
  });

  if (evidence.length < 2) {
    return {
      ...base,
      status: "insufficient_evidence",
      rootCauseSkillId: null,
      confidence: evidence.length === 1 ? 0.35 : 0,
      evidence,
      recommendedPathId: null,
      nextQuestionId: NEXT_PROBE_QUESTION_ID,
    };
  }

  if (evidence.every((item) => item.isCorrect) && evidence.length >= 3) {
    return {
      ...base,
      status: "mastered",
      rootCauseSkillId: null,
      confidence: Math.min(0.99, 0.7 + evidence.length * 0.07),
      evidence,
      recommendedPathId: null,
      nextQuestionId: null,
    };
  }

  const candidateScores = new Map<string, number>();
  for (const item of evidence.filter((value) => !value.isCorrect)) {
    if (!item.misconceptionId) continue;
    const misconception = misconceptionById.get(item.misconceptionId);
    for (const skillId of misconception?.skill_ids ?? []) {
      if (!skillId.startsWith("MATH.G6.")) continue;
      const specificity = skillId === "MATH.G6.FRACTION.COMMON_DENOMINATOR" ? 1.25 : 1;
      candidateScores.set(skillId, (candidateScores.get(skillId) ?? 0) + specificity);
    }
  }

  const candidateIds = new Set(candidateScores.keys());
  const prerequisiteEdges = edges.filter((edge) => edge.relationship_type === "prerequisite");
  const reachesCandidate = (source: string, target: string) => {
    const queue = [source];
    const visited = new Set<string>();
    while (queue.length) {
      const current = queue.shift()!;
      if (current === target) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      for (const edge of prerequisiteEdges) {
        if (edge.source_skill_id === current) queue.push(edge.target_skill_id);
      }
    }
    return false;
  };
  const foundationalCandidates = [...candidateScores.entries()].filter(([candidate]) =>
    ![...candidateIds].some((other) => other !== candidate && reachesCandidate(other, candidate)),
  );
  const [rootCauseSkillId, score = 0] = (foundationalCandidates.length ? foundationalCandidates : [...candidateScores.entries()])
    .sort((a, b) => b[1] - a[1])[0] ?? [];
  if (!rootCauseSkillId) {
    return {
      ...base,
      status: "insufficient_evidence",
      rootCauseSkillId: null,
      confidence: 0.45,
      evidence,
      recommendedPathId: null,
      nextQuestionId: NEXT_PROBE_QUESTION_ID,
    };
  }

  const wrongCount = evidence.filter((item) => !item.isCorrect).length;
  const confidence = Math.min(0.95, 0.58 + wrongCount * 0.08 + Math.min(score, 3) * 0.06);
  return {
    ...base,
    status: "diagnosed",
    rootCauseSkillId,
    confidence: Number(confidence.toFixed(2)),
    evidence,
    recommendedPathId: rootCauseSkillId === "MATH.G6.FRACTION.COMMON_DENOMINATOR" ? DEFAULT_PATH_ID : null,
    nextQuestionId: null,
  };
}
