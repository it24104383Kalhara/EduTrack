-- Simple query to check updated_at column
-- Run this in your database viewer:

SELECT id, first_name, last_name, updated_at 
FROM students 
ORDER BY updated_at DESC;

-- Or to see all columns:
SELECT * FROM students WHERE id = 15;
