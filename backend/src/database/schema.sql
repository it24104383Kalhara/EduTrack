-- EduTrack Hostel Management Database Schema

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS edutrack_hostel;
USE edutrack_hostel;

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS email_logs;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS rooms;

-- Rooms table
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    capacity INT NOT NULL DEFAULT 5,
    current_occupancy INT NOT NULL DEFAULT 0,
    floor_number VARCHAR(10),
    room_type ENUM('single', 'double', 'dormitory') DEFAULT 'dormitory',
    status ENUM('available', 'maintenance', 'full') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_room_number (room_number),
    INDEX idx_status (status)
);

-- Students table
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registration_number VARCHAR(50) NOT NULL UNIQUE,
    student_name VARCHAR(100) NOT NULL,
    grade VARCHAR(20) NOT NULL,
    parent_email VARCHAR(100),
    parent_phone VARCHAR(20),
    assigned_room INT NULL,
    room_number VARCHAR(20) NULL,
    admission_date DATE,
    status ENUM('active', 'inactive', 'graduated') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_room) REFERENCES rooms(id) ON DELETE SET NULL,
    INDEX idx_registration_number (registration_number),
    INDEX idx_assigned_room (assigned_room),
    INDEX idx_status (status)
);

-- Payments table
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_type ENUM('hostel_fee', 'tuition_fee', 'mess_fee', 'library_fee', 'other') NOT NULL,
    status ENUM('pending', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
    payment_date DATE NULL,
    due_date DATE NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id),
    INDEX idx_status (status),
    INDEX idx_payment_type (payment_type),
    INDEX idx_due_date (due_date)
);

-- Email logs table
CREATE TABLE email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NULL,
    parent_email VARCHAR(100) NOT NULL,
    email_type ENUM('payment_reminder', 'payment_warning', 'payment_confirmation', 'other') NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
    INDEX idx_student_id (student_id),
    INDEX idx_email_type (email_type),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at)
);

-- Insert sample data for rooms
INSERT INTO rooms (room_number, capacity, current_occupancy, floor_number, room_type, status) VALUES
('H001', 5, 2, '1', 'dormitory', 'available'),
('H002', 5, 0, '1', 'dormitory', 'available'),
('H003', 5, 3, '2', 'dormitory', 'available'),
('H004', 5, 1, '2', 'dormitory', 'available'),
('H005', 5, 0, '3', 'dormitory', 'available');

-- Insert sample data for students
INSERT INTO students (registration_number, student_name, grade, parent_email, parent_phone, assigned_room, room_number, admission_date, status) VALUES
('REG2024001', 'John Smith', 'Grade 10', 'robert.smith@email.com', '+1234567890', 1, 'H001', '2024-01-15', 'active'),
('REG2024002', 'Emily Johnson', 'Grade 11', 'mary.johnson@email.com', '+1234567891', 1, 'H001', '2024-01-16', 'active'),
('REG2024003', 'Michael Brown', 'Grade 9', 'james.brown@email.com', '+1234567892', 3, 'H003', '2024-01-17', 'active'),
('REG2024004', 'Sarah Davis', 'Grade 12', 'sarah.parent@email.com', '+1234567893', 4, 'H004', '2024-01-18', 'active'),
('REG2024005', 'David Wilson', 'Grade 8', 'david.parent@email.com', '+1234567894', NULL, NULL, '2024-01-19', 'active');

-- Insert sample data for payments
INSERT INTO payments (student_id, amount, payment_type, status, payment_date, due_date, payment_method, transaction_id, description) VALUES
(1, 2000.00, 'hostel_fee', 'paid', '2024-01-20', '2024-01-15', 'bank_transfer', 'TXN001', 'January hostel fee'),
(2, 2000.00, 'hostel_fee', 'pending', NULL, '2024-01-15', NULL, NULL, 'January hostel fee'),
(3, 5000.00, 'tuition_fee', 'pending', NULL, '2024-01-20', NULL, NULL, 'Q1 tuition fee'),
(4, 1500.00, 'mess_fee', 'pending', NULL, '2024-01-25', NULL, NULL, 'January mess fee'),
(5, 500.00, 'library_fee', 'pending', NULL, '2024-01-30', NULL, NULL, 'Annual library fee');

-- Insert sample email logs
INSERT INTO email_logs (student_id, parent_email, email_type, subject, message, status, sent_at) VALUES
(1, 'robert.smith@email.com', 'payment_confirmation', 'Payment Received - EduTrack', 'Dear Parent, We have received your payment of $2000.00 for hostel fee. Thank you!', 'sent', '2024-01-20 10:30:00'),
(2, 'mary.johnson@email.com', 'payment_reminder', 'Payment Reminder - EduTrack', 'Dear Parent, This is a reminder that your payment of $2000.00 for hostel fee is due. Please make the payment at your earliest convenience.', 'sent', '2024-01-21 09:00:00');

-- Create views for common queries
CREATE VIEW room_summary AS
SELECT 
    r.id,
    r.room_number,
    r.capacity,
    r.current_occupancy,
    (r.capacity - r.current_occupancy) as available_spaces,
    r.status,
    COUNT(s.id) as assigned_students
FROM rooms r
LEFT JOIN students s ON r.id = s.assigned_room AND s.status = 'active'
GROUP BY r.id;

CREATE VIEW payment_summary AS
SELECT 
    p.id,
    p.student_id,
    s.student_name,
    s.registration_number,
    p.amount,
    p.payment_type,
    p.status,
    p.due_date,
    p.payment_date,
    DATEDIFF(p.due_date, CURDATE()) as days_until_due,
    CASE 
        WHEN p.status = 'paid' THEN 'completed'
        WHEN p.status = 'cancelled' THEN 'cancelled'
        WHEN p.due_date < CURDATE() AND p.status != 'paid' THEN 'overdue'
        WHEN DATEDIFF(p.due_date, CURDATE()) <= 7 AND p.status = 'pending' THEN 'due_soon'
        ELSE 'pending'
    END as payment_status_category
FROM payments p
JOIN students s ON p.student_id = s.id;

CREATE VIEW student_summary AS
SELECT 
    s.id,
    s.registration_number,
    s.student_name,
    s.grade,
    s.parent_email,
    s.assigned_room,
    s.room_number,
    s.status,
    COUNT(p.id) as total_payments,
    COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_payments,
    SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END) as total_paid,
    SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END) as amount_due
FROM students s
LEFT JOIN payments p ON s.id = p.student_id
GROUP BY s.id;

-- Stored procedures for common operations
DELIMITER //

CREATE PROCEDURE GetDashboardStats()
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM rooms) as total_rooms,
        (SELECT COUNT(*) FROM rooms WHERE current_occupancy > 0) as occupied_rooms,
        (SELECT COUNT(*) FROM students WHERE status = 'active') as total_students,
        (SELECT COUNT(*) FROM students WHERE status = 'active' AND assigned_room IS NOT NULL) as students_in_hostel,
        (SELECT COUNT(*) FROM payments WHERE status = 'pending') as pending_payments,
        (SELECT COUNT(*) FROM payments WHERE status = 'pending' AND due_date < CURDATE()) as overdue_payments,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'paid') as total_collected,
        (SELECT COUNT(*) FROM payments WHERE status = 'pending' AND DATEDIFF(due_date, CURDATE()) <= 7) as due_this_week;
END //

CREATE PROCEDURE AssignStudentToRoom(IN student_id INT, IN room_id INT)
BEGIN
    DECLARE room_capacity INT;
    DECLARE current_occupancy INT;
    
    -- Get room capacity and current occupancy
    SELECT capacity, current_occupancy INTO room_capacity, current_occupancy
    FROM rooms WHERE id = room_id;
    
    -- Check if room has space
    IF current_occupancy < room_capacity THEN
        -- Update student assignment
        UPDATE students 
        SET assigned_room = room_id, room_number = (SELECT room_number FROM rooms WHERE id = room_id)
        WHERE id = student_id;
        
        -- Update room occupancy
        UPDATE rooms 
        SET current_occupancy = current_occupancy + 1 
        WHERE id = room_id;
        
        SELECT 'Student assigned successfully' as message;
    ELSE
        SELECT 'Room is full' as message;
    END IF;
END //

DELIMITER ;

-- Triggers for maintaining data consistency
DELIMITER //

CREATE TRIGGER update_room_occupancy_after_student_assignment
AFTER UPDATE ON students
FOR EACH ROW
BEGIN
    IF OLD.assigned_room != NEW.assigned_room THEN
        -- Decrease occupancy of old room
        IF OLD.assigned_room IS NOT NULL THEN
            UPDATE rooms SET current_occupancy = current_occupancy - 1 WHERE id = OLD.assigned_room;
        END IF;
        
        -- Increase occupancy of new room
        IF NEW.assigned_room IS NOT NULL THEN
            UPDATE rooms SET current_occupancy = current_occupancy + 1 WHERE id = NEW.assigned_room;
        END IF;
    END IF;
END //

CREATE TRIGGER update_room_occupancy_after_student_deletion
AFTER DELETE ON students
FOR EACH ROW
BEGIN
    IF OLD.assigned_room IS NOT NULL THEN
        UPDATE rooms SET current_occupancy = current_occupancy - 1 WHERE id = OLD.assigned_room;
    END IF;
END //

DELIMITER ;

-- Create indexes for performance optimization
CREATE INDEX idx_payments_due_date_status ON payments(due_date, status);
CREATE INDEX idx_students_room_status ON students(assigned_room, status);
CREATE INDEX idx_email_logs_student_type ON email_logs(student_id, email_type);

-- Show database setup completion
SELECT 'EduTrack Hostel Management Database setup completed successfully!' as status;
