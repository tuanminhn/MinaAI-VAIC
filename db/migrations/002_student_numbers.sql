ALTER TABLE students ADD COLUMN IF NOT EXISTS student_number TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS students_classroom_student_number_unique
  ON students (classroom_id, student_number)
  WHERE student_number IS NOT NULL;
