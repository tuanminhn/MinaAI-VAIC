import { describe, expect, it } from "vitest";
import demoStudents from "../../../knowledge-graph/output/demo_students.json";
import graphJson from "../../../knowledge-graph/output/knowledge_graph.json";
import misconceptionsJson from "../../../knowledge-graph/output/misconceptions.json";
import questionsJson from "../../../knowledge-graph/output/questions.json";
import type { KnowledgeEdge, Misconception, Question } from "@/lib/contracts";
import { diagnose } from "./engine";

const questions = questionsJson.questions as Question[];
const misconceptions = misconceptionsJson.misconceptions as Misconception[];
const edges = graphJson.edges as KnowledgeEdge[];

function answersFor(studentId: string) {
  const student = demoStudents.students.find((item) => item.id === studentId)!;
  return Object.entries(student.answers).map(([questionId, optionId]) => ({ questionId, optionId }));
}

describe("diagnostic engine", () => {
  it("finds Minh's root-cause gap", () => {
    const result = diagnose({ answers: answersFor("STUDENT_DEMO_MINH"), questions, misconceptions, edges });
    expect(result.status).toBe("diagnosed");
    expect(result.rootCauseSkillId).toBe("MATH.G6.FRACTION.COMMON_DENOMINATOR");
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it("marks An as mastered", () => {
    const result = diagnose({ answers: answersFor("STUDENT_DEMO_AN"), questions, misconceptions, edges });
    expect(result.status).toBe("mastered");
  });

  it("does not force a conclusion for Lan", () => {
    const result = diagnose({ answers: answersFor("STUDENT_DEMO_LAN"), questions, misconceptions, edges });
    expect(result.status).toBe("insufficient_evidence");
    expect(result.nextQuestionId).toBe("Q.DIAG.G6.COMMON_DENOM.001");
  });

  it("returns outside scope for unknown target", () => {
    const result = diagnose({ answers: [], questions, misconceptions, targetSkillId: "MATH.G8.ALGEBRA" });
    expect(result.status).toBe("outside_mvp_scope");
  });
});
