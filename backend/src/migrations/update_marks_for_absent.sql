-- Migration to support "AB" for absent students
-- Run this script to update the marks table

-- 1. Update marks_obtained column to accept strings (for "AB")
ALTER TABLE marks MODIFY COLUMN marks_obtained VARCHAR(10) NOT NULL;

-- 2. Update grade_obtained calculation to handle "AB"
ALTER TABLE marks MODIFY COLUMN grade_obtained VARCHAR(10) GENERATED ALWAYS AS (
  CASE 
    WHEN marks_obtained = 'AB' THEN 'AB'
    WHEN (CAST(marks_obtained AS DECIMAL(5,2)) / max_marks * 100) >= 75 THEN 'A'
    WHEN (CAST(marks_obtained AS DECIMAL(5,2)) / max_marks * 100) >= 65 THEN 'B'
    WHEN (CAST(marks_obtained AS DECIMAL(5,2)) / max_marks * 100) >= 55 THEN 'C'
    WHEN (CAST(marks_obtained AS DECIMAL(5,2)) / max_marks * 100) >= 40 THEN 'S'
    ELSE 'F'
  END
) STORED;

-- 3. Update percentage calculation to handle "AB"
ALTER TABLE marks MODIFY COLUMN percentage DECIMAL(5,2) GENERATED ALWAYS AS (
  CASE 
    WHEN marks_obtained = 'AB' THEN 0
    ELSE (CAST(marks_obtained AS DECIMAL(5,2)) / max_marks * 100)
  END
) STORED;

-- 4. Add index for better performance on absent students
CREATE INDEX idx_marks_obtained ON marks(marks_obtained);
