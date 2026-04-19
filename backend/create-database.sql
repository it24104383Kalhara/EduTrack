-- Create EduTrack Hostel Database
CREATE DATABASE IF NOT EXISTS edutrack_hostel;
USE edutrack_hostel;

-- Create tables
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    capacity INT NOT NULL DEFAULT 5,
    current_occupancy INT NOT NULL DEFAULT 0,
    floor_number VARCHAR(10),
    room_type ENUM('single', 'double', 'dormitory') DEFAULT 'dormitory',
    status ENUM('available', 'maintenance', 'full') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
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
    FOREIGN KEY (assigned_room) REFERENCES rooms(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payments (
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
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS email_logs (
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
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

-- Insert sample data
INSERT IGNORE INTO rooms (room_number, capacity, current_occupancy, floor_number, room_type, status) VALUES
('H001', 5, 2, '1', 'dormitory', 'available'),
('H002', 5, 0, '1', 'dormitory', 'available'),
('H003', 5, 3, '2', 'dormitory', 'available'),
('H004', 5, 1, '2', 'dormitory', 'available'),
('H005', 5, 0, '3', 'dormitory', 'available');

INSERT IGNORE INTO students (registration_number, student_name, grade, parent_email, parent_phone, assigned_room, room_number, admission_date, status) VALUES
('REG2024001', 'John Smith', 'Grade 10', 'robert.smith@email.com', '+1234567890', 1, 'H001', '2024-01-15', 'active'),
('REG2024002', 'Emily Johnson', 'Grade 11', 'mary.johnson@email.com', '+1234567891', 1, 'H001', '2024-01-16', 'active'),
('REG2024003', 'Michael Brown', 'Grade 9', 'james.brown@email.com', '+1234567892', 3, 'H003', '2024-01-17', 'active'),
('REG2024004', 'Sarah Davis', 'Grade 12', 'sarah.parent@email.com', '+1234567893', 4, 'H004', '2024-01-18', 'active'),
('REG2024005', 'David Wilson', 'Grade 8', 'david.parent@email.com', '+1234567894', NULL, NULL, '2024-01-19', 'active');

INSERT IGNORE INTO payments (student_id, amount, payment_type, status, payment_date, due_date, payment_method, transaction_id, description) VALUES
(1, 2000.00, 'hostel_fee', 'paid', '2024-01-20', '2024-01-15', 'bank_transfer', 'TXN001', 'January hostel fee'),
(2, 2000.00, 'hostel_fee', 'pending', NULL, '2024-01-15', NULL, NULL, 'January hostel fee'),
(3, 5000.00, 'tuition_fee', 'pending', NULL, '2024-01-20', NULL, NULL, 'Q1 tuition fee'),
(4, 1500.00, 'mess_fee', 'pending', NULL, '2024-01-25', NULL, NULL, 'January mess fee'),
(5, 500.00, 'library_fee', 'pending', NULL, '2024-01-30', NULL, NULL, 'Annual library fee');

SELECT 'Database and sample data created successfully!' as message;
