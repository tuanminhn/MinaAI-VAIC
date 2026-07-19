import "server-only";
import type { QueryResultRow } from "pg";
import type { AnswerOption } from "@/lib/contracts";
import type { AnswerExplanationContext, ClassContext, ReteachContext } from "@/lib/ai/fallbacks";
import { DEMO_ASSIGNMENT_ID, DEMO_CLASS_ID } from "@/lib/demo-constants";
import { query } from "./db";

export async function getAnswerExplanationContext(studentId: string, assignmentId: string, questionId: string): Promise<AnswerExplanationContext> {
  const completion = await query<QueryResultRow & { answered: string; required: string }>(
    `SELECT
       (SELECT count(DISTINCT a.question_id) FROM attempts a WHERE a.student_id=$1 AND a.assignment_id=$2)::text AS answered,
       (SELECT count(*) FROM assignment_questions aq WHERE aq.assignment_id=$2)::text AS required`,
    [studentId, assignmentId],
  );
  const answered = Number(completion.rows[0]?.answered ?? 0);
  const required = Number(completion.rows[0]?.required ?? 0);
  if (!required || answered < required) throw new Error("ASSESSMENT_NOT_COMPLETE");

  const attempt = await query<QueryResultRow & {
    question_id: string; selected_option_id: string; is_correct: boolean; misconception_id: string | null;
    stem: string; skill_ids: string[]; options: AnswerOption[]; explanation: string;
  }>(
    `SELECT a.question_id,a.selected_option_id,a.is_correct,a.misconception_id,
       q.stem,q.skill_ids,q.options,q.explanation
     FROM attempts a JOIN questions q ON q.id=a.question_id
     WHERE a.student_id=$1 AND a.assignment_id=$2 AND a.question_id=$3 AND q.review_status='approved'
     ORDER BY a.received_at DESC LIMIT 1`,
    [studentId, assignmentId, questionId],
  );
  const row = attempt.rows[0];
  if (!row) throw new Error("ATTEMPT_NOT_FOUND");
  if (row.is_correct) throw new Error("EXPLANATION_ONLY_FOR_INCORRECT");
  const selected = row.options.find((option) => option.id === row.selected_option_id);
  const correct = row.options.find((option) => option.is_correct);
  if (!selected || !correct) throw new Error("QUESTION_CONTENT_INVALID");
  const skills = await query<QueryResultRow & { canonical_name: string }>(
    "SELECT canonical_name FROM skills WHERE id=ANY($1) AND review_status='approved' ORDER BY grade,id", [row.skill_ids],
  );
  const misconception = row.misconception_id
    ? await query<QueryResultRow & { description: string }>("SELECT description FROM misconceptions WHERE id=$1 AND review_status='approved'", [row.misconception_id])
    : null;
  return {
    questionId: row.question_id,
    stem: row.stem,
    selectedContent: selected.content,
    correctContent: correct.content,
    approvedExplanation: row.explanation,
    skillNames: skills.rows.map((item) => item.canonical_name),
    misconception: misconception?.rows[0]?.description,
  };
}

export async function getClassContext(): Promise<ClassContext> {
  const metrics = await query<QueryResultRow & { student_count: string; completed: string; diagnosed: string; mastered: string; insufficient: string }>(
    `SELECT count(DISTINCT s.id)::text AS student_count,
      count(DISTINCT d.student_id)::text AS completed,
      count(DISTINCT d.student_id) FILTER (WHERE d.status='diagnosed')::text AS diagnosed,
      count(DISTINCT d.student_id) FILTER (WHERE d.status='mastered')::text AS mastered,
      count(DISTINCT d.student_id) FILTER (WHERE d.status='insufficient_evidence')::text AS insufficient
     FROM students s LEFT JOIN diagnostic_results d ON d.student_id=s.id AND d.assignment_id=$2
     WHERE s.classroom_id=$1`, [DEMO_CLASS_ID, DEMO_ASSIGNMENT_ID],
  );
  const gaps = await query<QueryResultRow & { skill_id: string; skill_name: string; description: string; student_count: string; average_confidence: string }>(
    `SELECT sk.id AS skill_id,sk.canonical_name AS skill_name,sk.description,
      count(*)::text AS student_count,avg(d.confidence)::text AS average_confidence
     FROM diagnostic_results d JOIN students s ON s.id=d.student_id
     JOIN skills sk ON sk.id=d.root_cause_skill_id
     WHERE s.classroom_id=$1 AND d.assignment_id=$2 AND d.status='diagnosed' AND sk.review_status='approved'
     GROUP BY sk.id,sk.canonical_name,sk.description ORDER BY count(*) DESC,sk.id`, [DEMO_CLASS_ID, DEMO_ASSIGNMENT_ID],
  );
  const row = metrics.rows[0];
  return {
    studentCount: Number(row?.student_count ?? 0), completed: Number(row?.completed ?? 0), diagnosed: Number(row?.diagnosed ?? 0),
    mastered: Number(row?.mastered ?? 0), insufficient: Number(row?.insufficient ?? 0),
    gaps: gaps.rows.map((gap) => ({ skillId: gap.skill_id, skillName: gap.skill_name, description: gap.description, studentCount: Number(gap.student_count), averageConfidence: Number(gap.average_confidence) })),
  };
}

export async function getReteachContext(skillId: string): Promise<ReteachContext> {
  const skill = await query<QueryResultRow & { id: string; canonical_name: string; description: string }>(
    "SELECT id,canonical_name,description FROM skills WHERE id=$1 AND review_status='approved'", [skillId],
  );
  if (!skill.rows[0]) throw new Error("SKILL_NOT_FOUND");
  const count = await query<QueryResultRow & { student_count: string }>(
    `SELECT count(*)::text AS student_count FROM diagnostic_results d JOIN students s ON s.id=d.student_id
     WHERE s.classroom_id=$1 AND d.assignment_id=$2 AND d.status='diagnosed' AND d.root_cause_skill_id=$3`,
    [DEMO_CLASS_ID, DEMO_ASSIGNMENT_ID, skillId],
  );
  const misconceptions = await query<QueryResultRow & { description: string }>(
    `SELECT m.description,count(*) FROM attempts a JOIN students s ON s.id=a.student_id
     JOIN misconceptions m ON m.id=a.misconception_id
     WHERE s.classroom_id=$1 AND a.assignment_id=$2 AND $3=ANY(m.skill_ids) AND m.review_status='approved'
     GROUP BY m.id,m.description ORDER BY count(*) DESC LIMIT 3`, [DEMO_CLASS_ID, DEMO_ASSIGNMENT_ID, skillId],
  );
  const questions = await query<QueryResultRow & { stem: string }>(
    "SELECT stem FROM questions WHERE $1=ANY(skill_ids) AND review_status='approved' ORDER BY question_type,id LIMIT 3", [skillId],
  );
  return {
    skillId, skillName: skill.rows[0].canonical_name, description: skill.rows[0].description,
    studentCount: Number(count.rows[0]?.student_count ?? 0),
    commonMisconceptions: misconceptions.rows.map((item) => item.description), approvedQuestionStems: questions.rows.map((item) => item.stem),
  };
}
