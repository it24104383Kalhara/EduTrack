-- Update exam_type ENUM to use first, second, third instead of mid_term, final_term, assignment, quiz, practical
ALTER TABLE marks MODIFY COLUMN exam_type ENUM('first', 'second', 'third') NOT NULL;
