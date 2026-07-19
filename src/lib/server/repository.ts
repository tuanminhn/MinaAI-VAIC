import "server-only";
import { randomUUID } from "node:crypto";
import type { QueryResultRow } from "pg";
import type { AiMeta, PersonalizedPracticeContent } from "@/lib/ai/contracts";
import type { AnswerOption, Diagnosis, KnowledgeEdge, Misconception, PersonalizedPractice, PracticeQuestion, Question, StudentSummary, SubmittedAnswer } from "@/lib/contracts";
import { diagnose, TARGET_SKILL_ID } from "@/lib/diagnostic/engine";
import { DEMO_ASSIGNMENT_ID, DEMO_CLASS_ID } from "@/lib/demo-constants";
import { query, transaction } from "./db";

type QuestionRow = QueryResultRow & {
  id: string;
  question_type: Question["type"];
  grade: 6 | 7 | 8 | 9;
  stem: string;
  skill_ids: string[];
  options: AnswerOption[];
  explanation: string;
  review_status: "approved";
};

type MisconceptionRow = QueryResultRow & Misconception;

async function getQuestions(types?: Question["type"][]): Promise<Question[]> {
  const result = types?.length
    ? await query<QuestionRow>("SELECT * FROM questions WHERE question_type = ANY($1) ORDER BY id", [types])
    : await query<QuestionRow>("SELECT * FROM questions ORDER BY id");
  return result.rows.map((row) => ({
    id: row.id,
    type: row.question_type,
    grade: row.grade,
    stem: row.stem,
    skill_ids: row.skill_ids,
    options: row.options,
    explanation: row.explanation,
    review_status: row.review_status,
  }));
}

async function getMisconceptions(): Promise<Misconception[]> {
  const result = await query<MisconceptionRow>("SELECT * FROM misconceptions ORDER BY id");
  return result.rows;
}

async function getKnowledgeEdges(): Promise<KnowledgeEdge[]> {
  const result = await query<QueryResultRow & KnowledgeEdge>(
    "SELECT source_skill_id,target_skill_id,relationship_type,evidence,confidence FROM knowledge_edges ORDER BY source_skill_id,target_skill_id",
  );
  return result.rows.map((row) => ({ ...row, confidence: Number(row.confidence) }));
}

async function saveDiagnosis(studentId: string, assignmentId: string, result: Diagnosis) {
  await query(
    `INSERT INTO diagnostic_results
      (student_id,assignment_id,status,target_skill_id,root_cause_skill_id,confidence,evidence,
       recommended_path_id,next_question_id,engine_version,content_version,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now())
     ON CONFLICT (student_id,assignment_id) DO UPDATE SET status=EXCLUDED.status,
       target_skill_id=EXCLUDED.target_skill_id,root_cause_skill_id=EXCLUDED.root_cause_skill_id,
       confidence=EXCLUDED.confidence,evidence=EXCLUDED.evidence,recommended_path_id=EXCLUDED.recommended_path_id,
       next_question_id=EXCLUDED.next_question_id,engine_version=EXCLUDED.engine_version,
       content_version=EXCLUDED.content_version,updated_at=now()`,
    [studentId, assignmentId, result.status, result.targetSkillId, result.rootCauseSkillId, result.confidence,
      JSON.stringify(result.evidence), result.recommendedPathId, result.nextQuestionId, result.engineVersion, result.contentVersion],
  );
}

export async function diagnoseStudent(studentId: string, assignmentId = DEMO_ASSIGNMENT_ID): Promise<Diagnosis> {
  const attempts = await query<QueryResultRow & { question_id: string; selected_option_id: string }>(
    `SELECT DISTINCT ON (question_id) question_id,selected_option_id
     FROM attempts WHERE student_id=$1 AND assignment_id=$2 ORDER BY question_id,received_at DESC`,
    [studentId, assignmentId],
  );
  const result = diagnose({
    answers: attempts.rows.map((row) => ({ questionId: row.question_id, optionId: row.selected_option_id })),
    questions: await getQuestions(),
    misconceptions: await getMisconceptions(),
    edges: await getKnowledgeEdges(),
    targetSkillId: TARGET_SKILL_ID,
  });
  await saveDiagnosis(studentId, assignmentId, result);
  return result;
}

export async function recordAttempt(input: {
  eventId: string;
  studentId: string;
  assignmentId?: string;
  questionId: string;
  optionId: string;
  occurredAt?: string;
}) {
  const assignmentId = input.assignmentId ?? DEMO_ASSIGNMENT_ID;
  const questionResult = await query<QuestionRow>("SELECT * FROM questions WHERE id=$1 AND review_status='approved'", [input.questionId]);
  const question = questionResult.rows[0];
  if (!question) throw new Error("QUESTION_NOT_FOUND");
  const selected = question.options.find((item) => item.id === input.optionId);
  if (!selected) throw new Error("OPTION_NOT_FOUND");
  await query(
    `INSERT INTO attempts
      (event_id,student_id,assignment_id,question_id,selected_option_id,is_correct,misconception_id,occurred_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (event_id) DO NOTHING`,
    [input.eventId, input.studentId, assignmentId, input.questionId, input.optionId,
      selected.is_correct, selected.misconception_id ?? null, input.occurredAt ?? new Date().toISOString()],
  );
  return diagnoseStudent(input.studentId, assignmentId);
}

export async function getDemoPayload() {
  const classroom = await query<QueryResultRow & { id: string; name: string; grade: number; class_code: string }>(
    "SELECT id,name,grade,class_code FROM classrooms WHERE id=$1", [DEMO_CLASS_ID],
  );
  if (!classroom.rows[0]) throw new Error("DEMO_NOT_SEEDED");
  const students = await query<QueryResultRow & { id: string; display_name: string; scenario: string; answers: Record<string, string> }>(
    `SELECT s.id,s.display_name,s.scenario,d.answers FROM students s
     JOIN demo_scenarios d ON d.student_id=s.id WHERE s.classroom_id=$1 ORDER BY s.display_name`, [DEMO_CLASS_ID],
  );
  const questions = await query<QuestionRow>(
    `SELECT q.* FROM assignment_questions aq JOIN questions q ON q.id=aq.question_id
     WHERE aq.assignment_id=$1 ORDER BY aq.position`, [DEMO_ASSIGNMENT_ID],
  );
  if (questions.rows.length === 0) throw new Error("DEMO_ASSIGNMENT_EMPTY");
  return {
    classroom: { id: classroom.rows[0].id, name: classroom.rows[0].name, grade: classroom.rows[0].grade, code: classroom.rows[0].class_code },
    assignment: { id: DEMO_ASSIGNMENT_ID, title: "Diagnostic tổng hợp Toán lớp 9" },
    students: students.rows.map((row) => ({ id: row.id, displayName: row.display_name, scenario: row.scenario, presetAnswers: row.answers })),
    questions: questions.rows.map((row) => ({
      id: row.id,
      type: row.question_type,
      grade: row.grade,
      stem: row.stem,
      options: row.options.map((option) => ({ id: option.id, content: option.content })),
    })),
  };
}

export async function loginDemoStudent(studentNumber: string) {
  const normalizedNumber = studentNumber.trim();
  if (!normalizedNumber || normalizedNumber.length > 40) throw new Error("INVALID_STUDENT_NUMBER");
  const result = await query<QueryResultRow & { id: string; display_name: string; student_number: string }>(
    `SELECT id,display_name,student_number FROM students
     WHERE classroom_id=$1 AND student_number=$2`, [DEMO_CLASS_ID, normalizedNumber],
  );
  if (!result.rows[0]) throw new Error("STUDENT_NUMBER_NOT_FOUND");
  return { id: result.rows[0].id, displayName: result.rows[0].display_name, studentNumber: result.rows[0].student_number };
}

export async function loginOrRegisterDemoStudent(displayName: string | undefined, studentNumber: string) {
  const normalizedNumber = studentNumber.trim();
  if (!/^\d{1,40}$/.test(normalizedNumber)) throw new Error("INVALID_STUDENT_NUMBER");
  const suppliedName = displayName?.trim().replace(/\s+/g, " ") ?? "";
  if (suppliedName.length > 80) throw new Error("INVALID_STUDENT_NAME");
  const normalizedName = suppliedName || `Học sinh ${normalizedNumber}`;

  return transaction(async (client) => {
    const inserted = await client.query<QueryResultRow & { id: string; display_name: string; student_number: string }>(
      `INSERT INTO students (id,classroom_id,display_name,student_number)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (classroom_id,student_number) WHERE student_number IS NOT NULL DO NOTHING
       RETURNING id,display_name,student_number`,
      [`STUDENT_${randomUUID()}`, DEMO_CLASS_ID, normalizedName, normalizedNumber],
    );
    const created = inserted.rows[0];
    if (created) {
      return { id: created.id, displayName: created.display_name, studentNumber: created.student_number, isNew: true };
    }

    const existing = await client.query<QueryResultRow & { id: string; display_name: string; student_number: string }>(
      `SELECT id,display_name,student_number FROM students
       WHERE classroom_id=$1 AND student_number=$2`,
      [DEMO_CLASS_ID, normalizedNumber],
    );
    if (!existing.rows[0]) throw new Error("STUDENT_ACCOUNT_CONFLICT");
    return {
      id: existing.rows[0].id,
      displayName: existing.rows[0].display_name,
      studentNumber: existing.rows[0].student_number,
      isNew: false,
    };
  });
}

export async function resetDemo() {
  await transaction(async (client) => {
    await client.query("DELETE FROM personalized_practice_assignments WHERE source_assignment_id=$1", [DEMO_ASSIGNMENT_ID]);
    await client.query("DELETE FROM remediation_assignments WHERE assignment_id=$1", [DEMO_ASSIGNMENT_ID]);
    await client.query("DELETE FROM diagnostic_results WHERE assignment_id=$1", [DEMO_ASSIGNMENT_ID]);
    await client.query("DELETE FROM attempts WHERE assignment_id=$1", [DEMO_ASSIGNMENT_ID]);
  });
  return { reset: true };
}

export async function runScenario(studentId: string) {
  const scenario = await query<QueryResultRow & { answers: Record<string, string> }>(
    "SELECT answers FROM demo_scenarios WHERE student_id=$1", [studentId],
  );
  if (!scenario.rows[0]) throw new Error("SCENARIO_NOT_FOUND");
  await query("DELETE FROM attempts WHERE student_id=$1 AND assignment_id=$2", [studentId, DEMO_ASSIGNMENT_ID]);
  await query("DELETE FROM diagnostic_results WHERE student_id=$1 AND assignment_id=$2", [studentId, DEMO_ASSIGNMENT_ID]);
  for (const [questionId, optionId] of Object.entries(scenario.rows[0].answers)) {
    await recordAttempt({ eventId: randomUUID(), studentId, assignmentId: DEMO_ASSIGNMENT_ID, questionId, optionId });
  }
  return diagnoseStudent(studentId, DEMO_ASSIGNMENT_ID);
}

export async function runAllScenarios() {
  const students = await query<QueryResultRow & { id: string }>(
    `SELECT s.id FROM students s JOIN demo_scenarios d ON d.student_id=s.id
     WHERE s.classroom_id=$1 ORDER BY s.id`, [DEMO_CLASS_ID],
  );
  const results = [];
  for (const student of students.rows) results.push({ studentId: student.id, diagnosis: await runScenario(student.id) });
  return results;
}

export async function getTeacherDashboard() {
  const students = await query<QueryResultRow & {
    id: string; display_name: string; student_number: string | null; scenario: string | null; status: Diagnosis["status"] | null;
    target_skill_id: string | null; root_cause_skill_id: string | null; confidence: string | null;
    evidence: Diagnosis["evidence"] | null; recommended_path_id: string | null; next_question_id: string | null;
    engine_version: string | null; content_version: string | null; remediation_status: string | null;
    personalized_practice_status: StudentSummary["personalizedPracticeStatus"];
  }>(
    `SELECT s.id,s.display_name,s.student_number,s.scenario,d.status,d.target_skill_id,d.root_cause_skill_id,d.confidence,
       d.evidence,d.recommended_path_id,d.next_question_id,d.engine_version,d.content_version,
       r.status AS remediation_status,p.status AS personalized_practice_status
     FROM students s
     LEFT JOIN diagnostic_results d ON d.student_id=s.id AND d.assignment_id=$2
     LEFT JOIN remediation_assignments r ON r.student_id=s.id AND r.assignment_id=$2
     LEFT JOIN LATERAL (
       SELECT status FROM personalized_practice_assignments pp
       WHERE pp.student_id=s.id AND pp.source_assignment_id=$2
       ORDER BY pp.created_at DESC LIMIT 1
     ) p ON true
     WHERE s.classroom_id=$1 ORDER BY
       CASE d.status WHEN 'diagnosed' THEN 1 WHEN 'insufficient_evidence' THEN 2 WHEN 'mastered' THEN 3 ELSE 4 END,
       s.display_name`,
    [DEMO_CLASS_ID, DEMO_ASSIGNMENT_ID],
  );
  const summaries: StudentSummary[] = students.rows.map((row) => ({
    id: row.id,
    displayName: row.display_name,
    studentNumber: row.student_number,
    scenario: row.scenario,
    diagnosis: row.status ? {
      status: row.status,
      targetSkillId: row.target_skill_id!,
      rootCauseSkillId: row.root_cause_skill_id,
      confidence: Number(row.confidence),
      evidence: row.evidence ?? [],
      recommendedPathId: row.recommended_path_id,
      nextQuestionId: row.next_question_id,
      engineVersion: row.engine_version!,
      contentVersion: row.content_version!,
    } : null,
    remediationStatus: row.remediation_status,
    personalizedPracticeStatus: row.personalized_practice_status,
  }));
  const diagnosed = summaries.filter((item) => item.diagnosis?.status === "diagnosed").length;
  const mastered = summaries.filter((item) => item.diagnosis?.status === "mastered").length;
  const insufficient = summaries.filter((item) => item.diagnosis?.status === "insufficient_evidence").length;
  return {
    classroom: { id: DEMO_CLASS_ID, name: "Lớp 7A demo", studentCount: summaries.length },
    assignmentId: DEMO_ASSIGNMENT_ID,
    freshness: new Date().toISOString(),
    metrics: { diagnosed, mastered, insufficient, completed: diagnosed + mastered + insufficient },
    students: summaries,
  };
}

export async function assignRemediation(studentId: string, pathId = "PATH.G6_TO_G7.COMMON_DENOM.ADD") {
  await query(
    `INSERT INTO remediation_assignments (student_id,assignment_id,path_id,status)
     VALUES ($1,$2,$3,'assigned')
     ON CONFLICT (student_id,assignment_id,path_id) DO UPDATE SET status='assigned',updated_at=now()`,
    [studentId, DEMO_ASSIGNMENT_ID, pathId],
  );
  return { studentId, pathId, status: "assigned" };
}

export async function submitTransfer(studentId: string, answers: SubmittedAnswer[]) {
  const questions = await getQuestions(["transfer"]);
  const byId = new Map(questions.map((item) => [item.id, item]));
  let correct = 0;
  for (const answer of answers) {
    const question = byId.get(answer.questionId);
    if (!question) continue;
    const selected = question.options.find((item) => item.id === answer.optionId);
    if (!selected) continue;
    if (selected.is_correct) correct += 1;
    await query(
      `INSERT INTO attempts
        (event_id,student_id,assignment_id,question_id,selected_option_id,is_correct,misconception_id,occurred_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,now()) ON CONFLICT (event_id) DO NOTHING`,
      [randomUUID(), studentId, DEMO_ASSIGNMENT_ID, question.id, selected.id, selected.is_correct, selected.misconception_id ?? null],
    );
  }
  const score = questions.length ? correct / questions.length : 0;
  const status = score >= 0.5 ? "provisionally_closed" : "teacher_review";
  await query(
    `UPDATE remediation_assignments SET status=$1,updated_at=now()
     WHERE student_id=$2 AND assignment_id=$3`, [status, studentId, DEMO_ASSIGNMENT_ID],
  );
  return { studentId, correct, total: questions.length, score, status };
}

export async function getRemediation(studentId: string) {
  const assignment = await query<QueryResultRow & { status: string; path_id: string; estimated_minutes: number; question_ids: string[]; transfer_question_ids: string[] }>(
    `SELECT ra.status,ra.path_id,rp.estimated_minutes,rp.question_ids,rp.transfer_question_ids
     FROM remediation_assignments ra JOIN remediation_paths rp ON rp.id=ra.path_id
     WHERE ra.student_id=$1 AND ra.assignment_id=$2`, [studentId, DEMO_ASSIGNMENT_ID],
  );
  if (!assignment.rows[0]) return null;
  const ids = [...assignment.rows[0].question_ids, ...assignment.rows[0].transfer_question_ids];
  const questions = await query<QuestionRow>("SELECT * FROM questions WHERE id = ANY($1) ORDER BY question_type,id", [ids]);
  return {
    status: assignment.rows[0].status,
    pathId: assignment.rows[0].path_id,
    estimatedMinutes: assignment.rows[0].estimated_minutes,
    questions: questions.rows.map((row) => ({ id: row.id, type: row.question_type, stem: row.stem, options: row.options })),
  };
}

type PracticeRow = QueryResultRow & {
  id: string; student_id: string; display_name: string; student_number: string | null;
  skill_id: string; skill_name: string; title: string; objective: string; instructions: string;
  questions: PracticeQuestion[]; citations: string[]; status: PersonalizedPractice["status"];
  score: number | null; total: number | null;
};

function mapPractice(row: PracticeRow): PersonalizedPractice {
  return {
    id: row.id, studentId: row.student_id, studentDisplayName: row.display_name, studentNumber: row.student_number,
    skillId: row.skill_id, skillName: row.skill_name, title: row.title, objective: row.objective,
    instructions: row.instructions, questions: row.questions, citations: row.citations, status: row.status,
    score: row.score, total: row.total,
  };
}

async function getPracticeById(id: string) {
  const result = await query<PracticeRow>(
    `SELECT pp.id,pp.student_id,s.display_name,s.student_number,pp.skill_id,sk.canonical_name AS skill_name,
       pp.title,pp.objective,pp.instructions,pp.questions,pp.citations,pp.status,pp.score,pp.total
     FROM personalized_practice_assignments pp JOIN students s ON s.id=pp.student_id
     JOIN skills sk ON sk.id=pp.skill_id WHERE pp.id=$1`, [id],
  );
  return result.rows[0] ? mapPractice(result.rows[0]) : null;
}

export async function savePersonalizedPracticeDraft(input: {
  studentId: string; skillId: string; content: PersonalizedPracticeContent; ai: AiMeta;
}) {
  const id = `PRACTICE_${randomUUID()}`;
  await query(
    `INSERT INTO personalized_practice_assignments
      (id,student_id,source_assignment_id,skill_id,title,objective,instructions,questions,citations,ai_metadata,status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'draft')`,
    [id, input.studentId, DEMO_ASSIGNMENT_ID, input.skillId, input.content.title, input.content.objective,
      input.content.instructions, JSON.stringify(input.content.questions), JSON.stringify(input.content.citations), JSON.stringify(input.ai)],
  );
  const draft = await getPracticeById(id);
  if (!draft) throw new Error("PRACTICE_DRAFT_NOT_FOUND");
  return { ...draft, ai: input.ai };
}

export async function assignPersonalizedPractice(id: string) {
  const updated = await query<QueryResultRow & { id: string }>(
    `UPDATE personalized_practice_assignments SET status='assigned',assigned_at=now(),updated_at=now()
     WHERE id=$1 AND status='draft' RETURNING id`, [id],
  );
  if (!updated.rows[0]) throw new Error("PRACTICE_DRAFT_NOT_ASSIGNABLE");
  return getPracticeById(id);
}

export async function getStudentPractices(studentId: string) {
  const result = await query<PracticeRow>(
    `SELECT pp.id,pp.student_id,s.display_name,s.student_number,pp.skill_id,sk.canonical_name AS skill_name,
       pp.title,pp.objective,pp.instructions,pp.questions,pp.citations,pp.status,pp.score,pp.total
     FROM personalized_practice_assignments pp JOIN students s ON s.id=pp.student_id
     JOIN skills sk ON sk.id=pp.skill_id
     WHERE pp.student_id=$1 AND pp.status IN ('assigned','in_progress','submitted')
     ORDER BY pp.created_at DESC`, [studentId],
  );
  return result.rows.map(mapPractice);
}

export async function submitPersonalizedPractice(studentId: string, practiceId: string, answers: Record<string, string>) {
  return transaction(async (client) => {
    const result = await client.query<QueryResultRow & { questions: PracticeQuestion[]; status: string }>(
      `SELECT questions,status FROM personalized_practice_assignments
       WHERE id=$1 AND student_id=$2 FOR UPDATE`, [practiceId, studentId],
    );
    const row = result.rows[0];
    if (!row) throw new Error("PRACTICE_NOT_FOUND");
    if (!['assigned', 'in_progress'].includes(row.status)) throw new Error("PRACTICE_NOT_SUBMITTABLE");
    if (row.questions.some((question) => !answers[question.id])) throw new Error("PRACTICE_INCOMPLETE");
    const results = row.questions.map((question) => ({
      questionId: question.id, selectedOptionId: answers[question.id], correctOptionId: question.correctOptionId,
      isCorrect: answers[question.id] === question.correctOptionId, explanation: question.explanation,
    }));
    const score = results.filter((item) => item.isCorrect).length;
    await client.query(
      `UPDATE personalized_practice_assignments SET status='submitted',answers=$1,score=$2,total=$3,
       submitted_at=now(),updated_at=now() WHERE id=$4`,
      [JSON.stringify({ selections: answers, results }), score, row.questions.length, practiceId],
    );
    return { practiceId, score, total: row.questions.length, results };
  });
}
