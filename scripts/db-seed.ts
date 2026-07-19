import { loadEnvConfig } from "@next/env";
import { Pool } from "pg";
import graphJson from "../knowledge-graph/output/knowledge_graph.json";
import misconceptionsJson from "../knowledge-graph/output/misconceptions.json";
import questionsJson from "../knowledge-graph/output/questions.json";
import pathsJson from "../knowledge-graph/output/remediation_paths.json";
import studentsJson from "../knowledge-graph/output/demo_students.json";

loadEnvConfig(process.cwd());

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required in .env");
  if (graphJson.dataset.review_status !== "approved") throw new Error("Only an approved dataset can be seeded");
  const isLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: isLocal ? undefined : { rejectUnauthorized: false } });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const dataset = graphJson.dataset;
    await client.query(
      `INSERT INTO content_datasets
        (id, schema_version, series, subject, grades, review_status, reviewed_at, reviewed_by, review_scope)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO UPDATE SET review_status=EXCLUDED.review_status, reviewed_at=EXCLUDED.reviewed_at,
         reviewed_by=EXCLUDED.reviewed_by, review_scope=EXCLUDED.review_scope, imported_at=now()`,
      [dataset.id, graphJson.schema_version, dataset.series, dataset.subject, dataset.grades, dataset.review_status,
        dataset.reviewed_at, dataset.reviewed_by, JSON.stringify(dataset.review_scope)],
    );
    for (const item of graphJson.skills) {
      await client.query(
        `INSERT INTO skills
          (id,dataset_id,code,canonical_name,grade,domain,subdomain,description,mastery_threshold,provenance,review_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO UPDATE SET canonical_name=EXCLUDED.canonical_name, description=EXCLUDED.description,
           mastery_threshold=EXCLUDED.mastery_threshold, provenance=EXCLUDED.provenance, review_status=EXCLUDED.review_status`,
        [item.id, dataset.id, item.code, item.canonical_name, item.grade, item.domain, item.subdomain,
          item.description, item.mastery_threshold, JSON.stringify(item.provenance), item.review_status],
      );
    }
    await client.query("DELETE FROM knowledge_edges");
    for (const edge of graphJson.edges) {
      await client.query(
        `INSERT INTO knowledge_edges
          (source_skill_id,target_skill_id,relationship_type,evidence,confidence,review_status)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [edge.source_skill_id, edge.target_skill_id, edge.relationship_type, edge.evidence, edge.confidence, edge.review_status],
      );
    }
    for (const item of misconceptionsJson.misconceptions) {
      await client.query(
        `INSERT INTO misconceptions (id,description,error_pattern,severity,skill_ids,review_status)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO UPDATE SET description=EXCLUDED.description,error_pattern=EXCLUDED.error_pattern,
           severity=EXCLUDED.severity,skill_ids=EXCLUDED.skill_ids,review_status=EXCLUDED.review_status`,
        [item.id, item.description, item.error_pattern, item.severity, item.skill_ids, item.review_status],
      );
    }
    for (const item of questionsJson.questions) {
      await client.query(
        `INSERT INTO questions (id,question_type,grade,stem,skill_ids,options,explanation,provenance,review_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO UPDATE SET stem=EXCLUDED.stem,skill_ids=EXCLUDED.skill_ids,options=EXCLUDED.options,
           explanation=EXCLUDED.explanation,provenance=EXCLUDED.provenance,review_status=EXCLUDED.review_status`,
        [item.id, item.type, item.grade, item.stem, item.skill_ids, JSON.stringify(item.options), item.explanation,
          JSON.stringify(item.provenance), item.review_status],
      );
    }
    for (const item of pathsJson.remediation_paths) {
      await client.query(
        `INSERT INTO remediation_paths
          (id,target_skill_id,root_cause_skill_id,estimated_minutes,max_steps,question_ids,transfer_question_ids,
           pass_threshold,on_pass,on_fail,review_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO UPDATE SET question_ids=EXCLUDED.question_ids,transfer_question_ids=EXCLUDED.transfer_question_ids,
           pass_threshold=EXCLUDED.pass_threshold,review_status=EXCLUDED.review_status`,
        [item.id, item.target_skill_id, item.root_cause_skill_id, item.estimated_minutes, item.max_steps,
          item.question_ids, item.transfer_question_ids, item.pass_threshold, item.on_pass, item.on_fail, item.review_status],
      );
    }

    await client.query(`INSERT INTO classrooms (id,name,grade,class_code) VALUES ('CLASS_DEMO_7A','Lớp 9A demo',9,'MINA9A')
      ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,grade=EXCLUDED.grade,class_code=EXCLUDED.class_code`);
    for (const student of studentsJson.students) {
      await client.query(
        `INSERT INTO students (id,classroom_id,display_name,scenario,student_number) VALUES ($1,'CLASS_DEMO_7A',$2,$3,$4)
         ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name,scenario=EXCLUDED.scenario,student_number=EXCLUDED.student_number`,
        [student.id, student.display_name, student.scenario, student.student_number],
      );
      await client.query(
        `INSERT INTO demo_scenarios (student_id,answers,expected) VALUES ($1,$2,$3)
         ON CONFLICT (student_id) DO UPDATE SET answers=EXCLUDED.answers,expected=EXCLUDED.expected`,
        [student.id, JSON.stringify(student.answers), JSON.stringify(student.expected)],
      );
    }
    await client.query(
      `INSERT INTO assignments (id,classroom_id,title,target_skill_id,status,content_version)
       VALUES ('ASSIGNMENT_DEMO_G9','CLASS_DEMO_7A','Diagnostic tổng hợp Toán lớp 9',
         'MATH.G9.READINESS','active',$1)
       ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,status=EXCLUDED.status,content_version=EXCLUDED.content_version`,
      [dataset.id],
    );
    const diagnostic = questionsJson.questions.filter((item) => item.type === "diagnostic" && item.grade === 9);
    await client.query("DELETE FROM assignment_questions WHERE assignment_id='ASSIGNMENT_DEMO_G9'");
    for (const [index, item] of diagnostic.entries()) {
      await client.query(
        "INSERT INTO assignment_questions (assignment_id,question_id,position) VALUES ('ASSIGNMENT_DEMO_G9',$1,$2)",
        [item.id, index + 1],
      );
    }
    await client.query("COMMIT");
    console.log(`seeded ${graphJson.skills.length} skills, ${graphJson.edges.length} edges, ${questionsJson.questions.length} questions`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
