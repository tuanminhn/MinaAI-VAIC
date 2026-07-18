CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_datasets (
  id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  series TEXT NOT NULL,
  subject TEXT NOT NULL,
  grades INTEGER[] NOT NULL,
  review_status TEXT NOT NULL CHECK (review_status IN ('pending', 'approved', 'rejected')),
  reviewed_at DATE,
  reviewed_by TEXT,
  review_scope JSONB NOT NULL DEFAULT '[]'::jsonb,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  dataset_id TEXT NOT NULL REFERENCES content_datasets(id),
  code TEXT UNIQUE NOT NULL,
  canonical_name TEXT NOT NULL,
  grade INTEGER NOT NULL CHECK (grade IN (6, 7)),
  domain TEXT NOT NULL,
  subdomain TEXT NOT NULL,
  description TEXT NOT NULL,
  mastery_threshold NUMERIC(4,3) NOT NULL,
  provenance JSONB NOT NULL,
  review_status TEXT NOT NULL CHECK (review_status = 'approved')
);

CREATE TABLE IF NOT EXISTS knowledge_edges (
  source_skill_id TEXT NOT NULL REFERENCES skills(id),
  target_skill_id TEXT NOT NULL REFERENCES skills(id),
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('prerequisite', 'supporting')),
  evidence TEXT NOT NULL,
  confidence NUMERIC(4,3) NOT NULL,
  review_status TEXT NOT NULL CHECK (review_status = 'approved'),
  PRIMARY KEY (source_skill_id, target_skill_id, relationship_type)
);

CREATE TABLE IF NOT EXISTS misconceptions (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  error_pattern TEXT NOT NULL,
  severity TEXT NOT NULL,
  skill_ids TEXT[] NOT NULL,
  review_status TEXT NOT NULL CHECK (review_status = 'approved')
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  question_type TEXT NOT NULL CHECK (question_type IN ('diagnostic', 'remediation', 'transfer')),
  grade INTEGER NOT NULL CHECK (grade IN (6, 7)),
  stem TEXT NOT NULL,
  skill_ids TEXT[] NOT NULL,
  options JSONB NOT NULL,
  explanation TEXT NOT NULL,
  provenance JSONB NOT NULL,
  review_status TEXT NOT NULL CHECK (review_status = 'approved')
);

CREATE TABLE IF NOT EXISTS remediation_paths (
  id TEXT PRIMARY KEY,
  target_skill_id TEXT NOT NULL REFERENCES skills(id),
  root_cause_skill_id TEXT NOT NULL REFERENCES skills(id),
  estimated_minutes INTEGER NOT NULL,
  max_steps INTEGER NOT NULL,
  question_ids TEXT[] NOT NULL,
  transfer_question_ids TEXT[] NOT NULL,
  pass_threshold NUMERIC(4,3) NOT NULL,
  on_pass TEXT NOT NULL,
  on_fail TEXT NOT NULL,
  review_status TEXT NOT NULL CHECK (review_status = 'approved')
);

CREATE TABLE IF NOT EXISTS classrooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade INTEGER NOT NULL CHECK (grade IN (6, 7)),
  class_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  scenario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_skill_id TEXT NOT NULL REFERENCES skills(id),
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'closed')),
  content_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assignment_questions (
  assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id),
  position INTEGER NOT NULL,
  PRIMARY KEY (assignment_id, question_id)
);

CREATE TABLE IF NOT EXISTS attempts (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID UNIQUE NOT NULL,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id),
  selected_option_id TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  misconception_id TEXT REFERENCES misconceptions(id),
  occurred_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attempts_student_assignment
  ON attempts (student_id, assignment_id, received_at);

CREATE TABLE IF NOT EXISTS diagnostic_results (
  id BIGSERIAL PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('diagnosed', 'mastered', 'insufficient_evidence', 'outside_mvp_scope')),
  target_skill_id TEXT REFERENCES skills(id),
  root_cause_skill_id TEXT REFERENCES skills(id),
  confidence NUMERIC(4,3) NOT NULL,
  evidence JSONB NOT NULL,
  recommended_path_id TEXT REFERENCES remediation_paths(id),
  next_question_id TEXT REFERENCES questions(id),
  engine_version TEXT NOT NULL,
  content_version TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, assignment_id)
);

CREATE TABLE IF NOT EXISTS remediation_assignments (
  id BIGSERIAL PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  path_id TEXT NOT NULL REFERENCES remediation_paths(id),
  status TEXT NOT NULL CHECK (status IN ('assigned', 'in_progress', 'provisionally_closed', 'teacher_review')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, assignment_id, path_id)
);

CREATE TABLE IF NOT EXISTS demo_scenarios (
  student_id TEXT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  expected JSONB NOT NULL
);
