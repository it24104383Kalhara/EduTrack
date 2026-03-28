-- Add teacher_id to grades table for isolation
ALTER TABLE edutrack.grades ADD COLUMN teacher_id INT DEFAULT NULL;

-- Add foreign key constraint
ALTER TABLE edutrack.grades 
ADD CONSTRAINT fk_grade_teacher 
FOREIGN KEY (teacher_id) REFERENCES edutrack.users(id) 
ON DELETE SET NULL;

-- Add an index for faster filtering
CREATE INDEX idx_teacher_id ON edutrack.grades(teacher_id);
