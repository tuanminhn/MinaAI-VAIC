ALTER TABLE skills DROP CONSTRAINT IF EXISTS skills_grade_check;
ALTER TABLE skills ADD CONSTRAINT skills_grade_check CHECK (grade IN (6, 7, 8, 9));

ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_grade_check;
ALTER TABLE questions ADD CONSTRAINT questions_grade_check CHECK (grade IN (6, 7, 8, 9));

ALTER TABLE classrooms DROP CONSTRAINT IF EXISTS classrooms_grade_check;
ALTER TABLE classrooms ADD CONSTRAINT classrooms_grade_check CHECK (grade IN (6, 7, 8, 9));
