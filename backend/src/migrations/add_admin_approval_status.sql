-- Add status column to users table for Admin Approval Workflow
ALTER TABLE users ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';

-- Auto-approve existing users immediately so current admins/teachers are not locked out
UPDATE users SET status = 'approved';
