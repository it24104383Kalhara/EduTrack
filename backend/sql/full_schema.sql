-- EduTrack - Integrated Database Schema
-- Combined Core Student Progress and Sport Management

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------
-- CORE TABLES (Users, Teachers, Students, Academics)
-- ---------------------------------------------------------

-- 1. Users Table (Admin and Staff)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'teacher') NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    gender ENUM('male', 'female'),
    grade VARCHAR(50),
    phone_number VARCHAR(20),
    birthday DATE,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Teachers Table (Extended User Info)
CREATE TABLE IF NOT EXISTS teachers (
    user_id INT PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    gender ENUM('male', 'female'),
    grade VARCHAR(50),
    phone_number VARCHAR(20),
    birthday DATE,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Students Table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('male', 'female') NOT NULL,
    religion VARCHAR(50) NOT NULL,
    ethnicity VARCHAR(50) NOT NULL DEFAULT '',
    address TEXT NOT NULL,
    nationality VARCHAR(100) NOT NULL,
    parent_type ENUM('father', 'mother', 'guardian') NOT NULL,
    parent_name VARCHAR(200) NOT NULL,
    parent_phone VARCHAR(20) NOT NULL,
    parent_address TEXT NOT NULL,
    parent_gender ENUM('male', 'female') NOT NULL,
    parent_email VARCHAR(150),
    parent_religion VARCHAR(50) NOT NULL,
    parent_ethnicity VARCHAR(50) NOT NULL DEFAULT '',
    parent_nationality VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Grades Table
CREATE TABLE IF NOT EXISTS grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grade INT NOT NULL,
    grade_part VARCHAR(30) NOT NULL,
    teacher_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_grade (grade, grade_part),
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    grades JSON NOT NULL,
    stream JSON,
    type ENUM('6-11', '12-13') NOT NULL,
    category VARCHAR(100) DEFAULT NULL,
    is_optional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_code (code),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Student Subjects Mapping
CREATE TABLE IF NOT EXISTS student_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    grade_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_subject (student_id, subject_id, grade_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Student Assignment (Current Grade/Section)
CREATE TABLE IF NOT EXISTS student_assignment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grade_id INT NOT NULL,
    student_id INT NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    grade INT NOT NULL,
    section VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Academic Attendance
CREATE TABLE IF NOT EXISTS attendance_mark (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    grade INT NOT NULL,
    section VARCHAR(10) NOT NULL,
    status ENUM('present', 'absent', 'late') NOT NULL,
    marked_date DATE NOT NULL,
    marked_time TIME NOT NULL,
    updated_date DATE DEFAULT NULL,
    updated_time TIME DEFAULT NULL,
    marked_by VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_attendance (student_id, marked_date),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Academic Marks
CREATE TABLE IF NOT EXISTS marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    grade_id INT NOT NULL,
    term VARCHAR(50) NOT NULL,
    exam_type ENUM('mid_term', 'final_term', 'assignment', 'quiz', 'practical', 'first', 'second', 'third') NOT NULL,
    marks_obtained VARCHAR(10) NOT NULL,
    max_marks DECIMAL(5,2) NOT NULL,
    percentage VARCHAR(10) GENERATED ALWAYS AS (
        CASE 
            WHEN marks_obtained = 'AB' THEN 'AB' 
            ELSE CAST((CAST(marks_obtained AS DECIMAL(5,2)) / max_marks * 100) AS CHAR)
        END
    ) STORED,
    grade_obtained VARCHAR(10) GENERATED ALWAYS AS (
        CASE 
            WHEN marks_obtained = 'AB' THEN 'AB'
            WHEN (CAST(marks_obtained AS DECIMAL(5,2)) / max_marks * 100) >= 75 THEN 'A'
            WHEN (CAST(marks_obtained AS DECIMAL(5,2)) / max_marks * 100) >= 65 THEN 'B'
            WHEN (CAST(marks_obtained AS DECIMAL(5,2)) / max_marks * 100) >= 55 THEN 'C'
            WHEN (CAST(marks_obtained AS DECIMAL(5,2)) / max_marks * 100) >= 40 THEN 'S'
            ELSE 'F'
        END
    ) STORED,
    remarks TEXT,
    exam_date DATE NOT NULL,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
    UNIQUE KEY unique_mark (student_id, subject_id, grade_id, term, exam_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Email Logs
CREATE TABLE IF NOT EXISTS email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mark_id INT NOT NULL,
    student_id INT NOT NULL,
    student_name VARCHAR(255),
    student_class VARCHAR(50),
    parent_email VARCHAR(255) NOT NULL,
    email_type ENUM('low_mark_alert', 'attendance_alert') NOT NULL DEFAULT 'low_mark_alert',
    status ENUM('sent', 'failed') NOT NULL,
    error_message TEXT,
    failed_subjects_count INT DEFAULT 0,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mark_id) REFERENCES marks(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_email_log (mark_id, email_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------
-- SPORT & EXTRA-CURRICULAR LOGIC
-- ---------------------------------------------------------

-- 11. Sports/Activities
CREATE TABLE IF NOT EXISTS sports_activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  type ENUM('Sport', 'Club', 'Society') NOT NULL,
  in_charge_staff_id INT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (in_charge_staff_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Activity Memberships
CREATE TABLE IF NOT EXISTS sports_memberships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  activity_id INT NOT NULL,
  role ENUM('Member', 'Captain', 'Vice-Captain', 'President', 'Secretary', 'Treasurer') DEFAULT 'Member',
  joined_at DATE NOT NULL,
  quit_at DATE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (activity_id) REFERENCES sports_activities(id) ON DELETE CASCADE,
  UNIQUE KEY unique_membership (student_id, activity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Sports Inventory (Equipment)
CREATE TABLE IF NOT EXISTS sports_inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  total_quantity INT DEFAULT 0,
  available_quantity INT DEFAULT 0,
  `condition` ENUM('New', 'Good', 'Fair', 'Poor', 'Broken') DEFAULT 'Good',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Inventory Logs (Borrowing/Returning)
CREATE TABLE IF NOT EXISTS sports_inventory_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  borrowed_by_id INT NOT NULL, -- Currently mapped to user_id for simplicity, can be student or staff
  borrowed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  returned_at TIMESTAMP NULL,
  status ENUM('Borrowed', 'Returned', 'Lost', 'Damaged') DEFAULT 'Borrowed',
  FOREIGN KEY (item_id) REFERENCES sports_inventory(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Facilities
CREATE TABLE IF NOT EXISTS sports_facilities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('Ground', 'Room', 'Hall', 'Court', 'Pool') NOT NULL,
  capacity INT,
  location_description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Facility Bookings
CREATE TABLE IF NOT EXISTS sports_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  facility_id INT NOT NULL,
  booked_by_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  purpose TEXT,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  FOREIGN KEY (facility_id) REFERENCES sports_facilities(id) ON DELETE CASCADE,
  FOREIGN KEY (booked_by_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Practice Sessions
CREATE TABLE IF NOT EXISTS sports_practice_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  activity_id INT NOT NULL,
  coach_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  location_id INT,
  FOREIGN KEY (activity_id) REFERENCES sports_activities(id) ON DELETE CASCADE,
  FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES sports_facilities(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Sport Attendance
CREATE TABLE IF NOT EXISTS sports_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  student_id INT NOT NULL,
  status ENUM('Present', 'Absent', 'Excused', 'Late') NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sports_practice_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Achievements
CREATE TABLE IF NOT EXISTS sports_achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT,
  activity_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  date DATE NOT NULL,
  merit_points INT DEFAULT 0,
  description TEXT,
  FOREIGN KEY (activity_id) REFERENCES sports_activities(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Attendance Reports (Coach to Principal)
CREATE TABLE IF NOT EXISTS sports_attendance_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  activity_id INT NOT NULL,
  coach_id INT NOT NULL,
  report_date DATE NOT NULL,
  total_students INT DEFAULT 0,
  present_count INT DEFAULT 0,
  absent_count INT DEFAULT 0,
  late_count INT DEFAULT 0,
  excused_count INT DEFAULT 0,
  notes TEXT,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  reviewed_by INT NULL,
  FOREIGN KEY (activity_id) REFERENCES sports_activities(id) ON DELETE CASCADE,
  FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Teacher Notifications
CREATE TABLE IF NOT EXISTS sports_teacher_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  teacher_id INT NOT NULL,
  message TEXT NOT NULL,
  status ENUM('Unread', 'Read', 'Actioned') DEFAULT 'Unread',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES sports_attendance_reports(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Seed initial admin user (password: admin123)
-- Hash generated for 'admin123'
-- INSERT IGNORE INTO users (username, email, password_hash, role, status) 
-- VALUES ('admin', 'admin@edutrack.com', '$2b$10$YourHashHere', 'admin', 'approved');
