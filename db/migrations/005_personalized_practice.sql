CREATE TABLE IF NOT EXISTS personalized_practice_assignments (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  source_assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL REFERENCES skills(id),
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  instructions TEXT NOT NULL,
  questions JSONB NOT NULL,
  citations JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_metadata JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'assigned', 'in_progress', 'submitted')),
  answers JSONB,
  score INTEGER,
  total INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personalized_practice_student_status
  ON personalized_practice_assignments (student_id, status, created_at DESC);
