// ============================================================================
// DATABASE QUERIES - UNIFIED SOURCE OF TRUTH
// ============================================================================
// This file centralizes ALL SQL queries used in the EduTrack project.
// It includes schema definitions, CRUD operations, and reporting queries.
// ============================================================================

export const SCHEMA_QUERIES = {
    CREATE_DB: 'CREATE DATABASE IF NOT EXISTS edutrack',
    USE_DB: 'USE edutrack',

    TABLES: {
        STUDENTS: `
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
        `,
        GRADES: `
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
        `,
        SUBJECTS: `
            CREATE TABLE IF NOT EXISTS subjects (
                id VARCHAR(50) PRIMARY KEY,
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
                INDEX idx_type (type),
                INDEX idx_category (category)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `,
        STUDENT_SUBJECTS: `
            CREATE TABLE IF NOT EXISTS student_subjects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                subject_id VARCHAR(50) NOT NULL,
                grade_id INT NOT NULL,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
                UNIQUE KEY unique_student_subject (student_id, subject_id, grade_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `,
        STUDENT_ASSIGNMENT: `
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
        `,
        ATTENDANCE_MARK: `
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
                INDEX idx_student_id (student_id),
                INDEX idx_grade_section (grade, section),
                INDEX idx_marked_date (marked_date),
                INDEX idx_status (status),
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `,
        MARKS: `
            CREATE TABLE IF NOT EXISTS marks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                subject_id VARCHAR(50) NOT NULL,
                grade_id INT NOT NULL,
                term VARCHAR(50) NOT NULL,
                exam_type ENUM('mid_term', 'final_term', 'assignment', 'quiz', 'practical') NOT NULL,
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
                UNIQUE KEY unique_mark (student_id, subject_id, grade_id, term, exam_type),
                INDEX idx_student_id (student_id),
                INDEX idx_subject_id (subject_id),
                INDEX idx_grade_id (grade_id),
                INDEX idx_term (term),
                INDEX idx_exam_date (exam_date),
                INDEX idx_percentage (percentage),
                INDEX idx_grade_obtained (grade_obtained)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `,
        EMAIL_LOGS: `
            CREATE TABLE IF NOT EXISTS email_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                mark_id INT NOT NULL,
                student_id INT NOT NULL,
                student_name VARCHAR(255),
                student_class VARCHAR(50),
                parent_email VARCHAR(255) NOT NULL,
                email_type ENUM('low_mark_alert') NOT NULL DEFAULT 'low_mark_alert',
                status ENUM('sent', 'failed') NOT NULL,
                error_message TEXT,
                failed_subjects_count INT DEFAULT 0,
                sent_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (mark_id) REFERENCES marks(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                UNIQUE KEY unique_email_log (mark_id, email_type),
                INDEX idx_mark_id (mark_id),
                INDEX idx_student_id (student_id),
                INDEX idx_status (status),
                INDEX idx_email_type (email_type),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `
    }
};

export const STUDENT_QUERIES = {
    CREATE: `
        INSERT INTO students (
            first_name, last_name, date_of_birth, gender, religion, ethnicity, address, nationality,
            parent_type, parent_name, parent_phone, parent_address, parent_gender,
            parent_email, parent_religion, parent_ethnicity, parent_nationality
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    FIND_BY_ID: 'SELECT * FROM students WHERE id = ?',
    FIND_ALL: 'SELECT * FROM students ORDER BY created_at DESC',
    UPDATE: (setClause: string) => `UPDATE students SET ${setClause} WHERE id = ?`,
    DELETE: 'DELETE FROM students WHERE id = ?'
};

export const GRADE_QUERIES = {
    FIND_ALL: `
        SELECT 
            g.id, g.grade, g.grade_part, g.teacher_id, g.created_at, g.updated_at,
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', s.id, 'first_name', s.first_name, 'last_name', s.last_name,
                        'parent_phone', s.parent_phone, 'assigned_at', sa.assigned_at
                    )
                )
                FROM student_assignment sa
                INNER JOIN students s ON sa.student_id = s.id
                WHERE sa.grade_id = g.id
            ) as students
        FROM grades g
        ORDER BY g.grade, g.grade_part
    `,
    FIND_BY_ID: `
        SELECT 
            g.id, g.grade, g.grade_part, g.teacher_id, g.created_at, g.updated_at,
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', s.id, 'first_name', s.first_name, 'last_name', s.last_name,
                        'parent_phone', s.parent_phone, 'assigned_at', sa.assigned_at
                    )
                )
                FROM student_assignment sa
                INNER JOIN students s ON sa.student_id = s.id
                WHERE sa.grade_id = g.id
            ) as students
        FROM grades g
        WHERE g.id = ?
    `,
    GET_ALL_ASSIGNMENTS: `
        SELECT 
            sa.student_id, s.first_name, s.last_name,
            CONCAT(s.first_name, ' ', s.last_name) as student_name,
            g.grade, g.grade_part as section, sa.assigned_at, sa.updated_at
        FROM student_assignment sa
        INNER JOIN students s ON sa.student_id = s.id
        INNER JOIN grades g ON sa.grade_id = g.id
        ORDER BY g.grade, g.grade_part, s.first_name, s.last_name
    `,
    GET_ASSIGNMENTS_BY_GRADE: `
        SELECT 
            sa.student_id, s.first_name, s.last_name,
            CONCAT(s.first_name, ' ', s.last_name) as student_name,
            g.grade, g.grade_part as section, sa.assigned_at, sa.updated_at
        FROM student_assignment sa
        INNER JOIN students s ON sa.student_id = s.id
        INNER JOIN grades g ON sa.grade_id = g.id
        WHERE sa.grade_id = ?
        ORDER BY s.first_name, s.last_name
    `,
    FIND_BY_GRADE_AND_PART: `
        SELECT 
            g.id, g.grade, g.grade_part, g.teacher_id, g.created_at, g.updated_at,
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', s.id, 'first_name', s.first_name, 'last_name', s.last_name,
                        'parent_phone', s.parent_phone, 'assigned_at', sa.assigned_at
                    )
                )
                FROM student_assignment sa
                INNER JOIN students s ON sa.student_id = s.id
                WHERE sa.grade_id = g.id
            ) as students
        FROM grades g
        WHERE g.grade = ? AND g.grade_part = ?
    `,
    CREATE: 'INSERT INTO grades (grade, grade_part, teacher_id) VALUES (?, ?, ?)',
    FIND_BY_TEACHER: `
        SELECT 
            g.id, g.grade, g.grade_part, g.teacher_id, g.created_at, g.updated_at,
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', s.id, 'first_name', s.first_name, 'last_name', s.last_name,
                        'parent_phone', s.parent_phone, 'assigned_at', sa.assigned_at
                    )
                )
                FROM student_assignment sa
                INNER JOIN students s ON sa.student_id = s.id
                WHERE sa.grade_id = g.id
            ) as students
        FROM grades g
        WHERE g.teacher_id = ?
        ORDER BY g.grade, g.grade_part
    `,
    FIND_CURRENT_BEFORE_UPDATE: 'SELECT grade, grade_part FROM grades WHERE id = ?',
    UPDATE: (setClause: string) => `UPDATE grades SET ${setClause} WHERE id = ?`,
    UPDATE_ASSIGNMENTS: `
        UPDATE student_assignment 
        SET grade = ?, section = ? 
        WHERE grade = ? AND section = ?
    `,
    DELETE_ASSIGNMENTS_FOR_GRADE: `
        DELETE FROM student_assignment WHERE grade_id = ?
    `,
    DELETE: 'DELETE FROM grades WHERE id = ?',
    CLEAR_ALL_ASSIGNMENTS: 'DELETE FROM student_assignment',
    CLEAR_ALL_GRADES: 'DELETE FROM grades',
    ASSIGN_STUDENT: `
        INSERT INTO student_assignment (grade_id, student_id, student_name, grade, section)
        SELECT ?, s.id, CONCAT(s.first_name, ' ', s.last_name), g.grade, g.grade_part
        FROM students s, grades g
        WHERE s.id = ? AND g.id = ?
    `,
    REMOVE_STUDENT: `
        DELETE FROM student_assignment WHERE grade_id = ? AND student_id = ?
    `,
    IS_STUDENT_ASSIGNED: `
        SELECT grade_id FROM student_assignment WHERE student_id = ? LIMIT 1
    `,
    GET_STATISTICS: `
        SELECT 
            COUNT(DISTINCT g.id) as totalGrades,
            COUNT(DISTINCT sa.student_id) as totalAssignedStudents,
            COUNT(DISTINCT sa.grade_id) as gradesWithStudents
        FROM grades g
        LEFT JOIN student_assignment sa ON g.id = sa.grade_id
    `,
    TRANSFER_STUDENT_MARKS: `
        UPDATE marks 
        SET grade_id = ? 
        WHERE student_id = ? AND grade_id = ?
    `,
    TRANSFER_STUDENT_ATTENDANCE_MARK: `
        UPDATE attendance_mark 
        SET grade = ?, section = ?
        WHERE student_id = ? AND grade = ? AND section = ?
    `
};

export const SUBJECT_QUERIES = {
    FIND_ALL: `
        SELECT id, name, code, grades, stream, type, category, is_optional, created_at, updated_at
        FROM subjects ORDER BY type ASC, name ASC
    `,
    FIND_BY_ID: `
        SELECT id, name, code, grades, stream, type, category, is_optional, created_at, updated_at
        FROM subjects WHERE id = ?
    `,
    CREATE: `
        INSERT INTO subjects (id, name, code, grades, stream, type, category, is_optional) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    UPDATE: (setClause: string) => `UPDATE subjects SET ${setClause} WHERE id = ?`,
    DELETE: 'DELETE FROM subjects WHERE id = ?',
    FIND_BY_CODE: (excludeId: boolean) => `
        SELECT id, name, code, grades, stream, type, category, is_optional, created_at, updated_at
        FROM subjects WHERE code = ? ${excludeId ? 'AND id != ?' : ''}
    `,
    FIND_DUPLICATE: (hasStream: boolean, excludeId: boolean) => `
        SELECT id, name, code, grades, stream, type, category, is_optional, created_at, updated_at
        FROM subjects
        WHERE LOWER(name) = LOWER(?)
            AND JSON_CONTAINS(grades, ?)
            ${hasStream ? 'AND JSON_CONTAINS(stream, ?)' : 'AND stream IS NULL'}
            ${excludeId ? 'AND id != ?' : ''}
    `,
    FIND_BY_TYPE: `
        SELECT id, name, code, grades, stream, type, category, is_optional, created_at, updated_at
        FROM subjects WHERE type = ? ORDER BY name ASC
    `
};

export const STUDENT_SUBJECT_QUERIES = {
    ASSIGN_BULK: `
        INSERT IGNORE INTO student_subjects (student_id, subject_id, grade_id)
        VALUES ?
    `,
    REMOVE_FOR_STUDENT: `
        DELETE FROM student_subjects WHERE student_id = ? AND grade_id = ?
    `,
    GET_BY_STUDENT_GRADE: `
        SELECT ss.*, s.name as subject_name, s.code as subject_code, s.category, s.is_optional
        FROM student_subjects ss
        JOIN subjects s ON ss.subject_id = s.id
        WHERE ss.student_id = ? AND ss.grade_id = ?
    `,
    GET_BY_SUBJECT_GRADE: `
        SELECT ss.*, st.first_name, st.last_name, CONCAT(st.first_name, ' ', st.last_name) as student_name
        FROM student_subjects ss
        JOIN students st ON ss.student_id = st.id
        WHERE ss.subject_id = ? AND ss.grade_id = ?
    `
};

export const MARKS_QUERIES = {
    CREATE: `
        INSERT INTO marks (
            student_id, subject_id, grade_id, term, exam_type, 
            marks_obtained, max_marks, remarks, exam_date, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    FIND_BY_UNIQUE_KEY: `
        SELECT * FROM marks 
        WHERE student_id = ? AND subject_id = ? AND grade_id = ? AND term = ? AND exam_type = ?
    `,
    FIND_BY_ID: 'SELECT * FROM marks WHERE id = ?',
    FIND_DETAILS_BY_STUDENT_GRADE_TERM: `
        SELECT 
            m.*, s.first_name, s.last_name, CONCAT(s.first_name, ' ', s.last_name) as student_name,
            s.parent_email, sub.name as subject_name, sub.code as subject_code,
            CONCAT(g.grade, '-', g.grade_part) as grade_name
        FROM marks m
        JOIN students s ON m.student_id = s.id
        JOIN subjects sub ON m.subject_id = sub.id
        JOIN grades g ON m.grade_id = g.id
        WHERE m.student_id = ? AND m.grade_id = ? AND m.term = ?
        ORDER BY sub.name, m.exam_type
    `,
    FIND_DETAILS_BY_GRADE_SUBJECT_TERM: `
        SELECT 
            m.*, s.first_name, s.last_name, CONCAT(s.first_name, ' ', s.last_name) as student_name,
            s.parent_email, sub.name as subject_name, sub.code as subject_code,
            CONCAT(g.grade, '-', g.grade_part) as grade_name
        FROM marks m
        JOIN students s ON m.student_id = s.id
        JOIN subjects sub ON m.subject_id = sub.id
        JOIN grades g ON m.grade_id = g.id
        WHERE m.grade_id = ? AND m.subject_id = ? AND m.term = ?
        ORDER BY s.first_name, s.last_name
    `,
    FIND_DETAILS_BY_GRADE_TERM: `
        SELECT 
            m.*, s.first_name, s.last_name, CONCAT(s.first_name, ' ', s.last_name) as student_name,
            s.parent_email, sub.name as subject_name, sub.code as subject_code,
            CONCAT(g.grade, '-', g.grade_part) as grade_name
        FROM marks m
        JOIN students s ON m.student_id = s.id
        JOIN subjects sub ON m.subject_id = sub.id
        JOIN grades g ON m.grade_id = g.id
        WHERE m.grade_id = ? AND m.term = ?
        ORDER BY s.first_name, s.last_name, sub.name, m.exam_type
    `,
    UPDATE: (setClause: string) => `UPDATE marks SET ${setClause} WHERE id = ?`,
    DELETE: 'DELETE FROM marks WHERE id = ?',
    CALCULATE_STUDENT_RESULT: `
        SELECT 
            m.student_id, CONCAT(s.first_name, ' ', s.last_name) as student_name,
            CONCAT(g.grade, '-', g.grade_part) as grade_name, m.term,
            SUM(m.marks_obtained) as total_marks_obtained,
            SUM(m.max_marks) as total_max_marks,
            (SUM(m.marks_obtained) / SUM(m.max_marks) * 100) as overall_percentage,
            CASE 
                WHEN (SUM(m.marks_obtained) / SUM(m.max_marks) * 100) >= 40 THEN 'PASS'
                ELSE 'FAIL'
            END as result,
            GROUP_CONCAT(
                CONCAT(
                    sub.name, '|', sub.code, '|', m.marks_obtained, '|', 
                    m.max_marks, '|', m.percentage, '|', m.grade_obtained, '|', m.exam_type
                )
                ORDER BY sub.name SEPARATOR ';'
            ) as subject_marks_data
        FROM marks m
        JOIN students s ON m.student_id = s.id
        JOIN grades g ON m.grade_id = g.id
        JOIN subjects sub ON m.subject_id = sub.id
        WHERE m.student_id = ? AND m.grade_id = ? AND m.term = ?
        GROUP BY m.student_id, s.first_name, s.last_name, g.grade, g.grade_part, m.term
    `,
    GET_LOW_MARKS: `
        SELECT 
            m.*, s.first_name, s.last_name, CONCAT(s.first_name, ' ', s.last_name) as student_name,
            s.parent_email, sub.name as subject_name, sub.code as subject_code,
            CONCAT(g.grade, '-', g.grade_part) as grade_name
        FROM marks m
        JOIN students s ON m.student_id = s.id
        JOIN subjects sub ON m.subject_id = sub.id
        JOIN grades g ON m.grade_id = g.id
        WHERE m.percentage < ? ORDER BY m.percentage ASC
    `,
    GET_GRADE_STATISTICS: `
        SELECT 
            COUNT(*) as total_students,
            COUNT(CASE WHEN m.percentage >= 35 THEN 1 END) as passed_students,
            COUNT(CASE WHEN m.percentage < 35 THEN 1 END) as failed_students,
            AVG(m.percentage) as average_percentage,
            MAX(m.percentage) as highest_percentage,
            MIN(m.percentage) as lowest_percentage,
            COUNT(CASE WHEN m.grade_obtained = 'A' THEN 1 END) as a_count,
            COUNT(CASE WHEN m.grade_obtained = 'B' THEN 1 END) as b_count,
            COUNT(CASE WHEN m.grade_obtained = 'C' THEN 1 END) as c_count,
            COUNT(CASE WHEN m.grade_obtained = 'S' THEN 1 END) as s_count,
            COUNT(CASE WHEN m.grade_obtained = 'F' THEN 1 END) as f_count
        FROM marks m WHERE m.grade_id = ? AND m.term = ?
    `,
    GET_ALL_GRADES_PERFORMANCE: `
        SELECT 
            CONCAT(g.grade, '-', g.grade_part) as grade_name,
            AVG(CAST(m.percentage AS DECIMAL(10,2))) as average_percentage
        FROM marks m
        JOIN grades g ON m.grade_id = g.id
        WHERE m.term = ? AND m.marks_obtained != 'AB'
        GROUP BY g.id, g.grade, g.grade_part
        ORDER BY g.grade ASC, g.grade_part ASC
    `,
    FIND_GRADE_NUMERIC: 'SELECT grade FROM grades WHERE id = ?',
    COUNT_SUBJECTS_FOR_GRADE: 'SELECT COUNT(*) as total FROM subjects WHERE JSON_CONTAINS(grades, ?)',
    COUNT_ENTERED_MARKS: `
        SELECT COUNT(*) as entered FROM marks 
        WHERE student_id = ? AND grade_id = ? AND term = ? AND exam_type = ?
    `
};


export const ATTENDANCE_MARK_QUERIES = {
    MARK: `
        INSERT INTO attendance_mark (
            student_id, student_name, grade, section, status, 
            marked_date, marked_time, marked_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            status = VALUES(status), updated_date = ?, updated_time = ?,
            marked_by = VALUES(marked_by), updated_at = CURRENT_TIMESTAMP
    `,
    FIND_BY_STUDENT_DATE: 'SELECT * FROM attendance_mark WHERE student_id = ? AND marked_date = ?',
    FIND_BY_GRADE_DATE: `
        SELECT am.*, s.first_name, s.last_name, s.parent_phone
        FROM attendance_mark am
        INNER JOIN students s ON am.student_id = s.id
        WHERE am.grade = ? AND am.section = ? AND am.marked_date = ?
        ORDER BY s.first_name, s.last_name
    `,
    FIND_ALL: `
        SELECT am.*, s.first_name, s.last_name, s.parent_phone
        FROM attendance_mark am
        INNER JOIN students s ON am.student_id = s.id
        ORDER BY am.marked_date DESC, am.marked_time DESC, s.first_name, s.last_name
    `,
    FIND_BY_DATE_RANGE: `
        SELECT am.*, s.first_name, s.last_name, s.parent_phone
        FROM attendance_mark am
        INNER JOIN students s ON am.student_id = s.id
        WHERE am.marked_date BETWEEN ? AND ?
        ORDER BY am.marked_date DESC, am.grade, am.section, s.first_name, s.last_name
    `,
    FIND_BY_STUDENT: `
        SELECT am.*, s.first_name, s.last_name, s.parent_phone
        FROM attendance_mark am
        INNER JOIN students s ON am.student_id = s.id
        WHERE am.student_id = ? ORDER BY am.marked_date DESC, am.marked_time DESC
    `,
    UPDATE: `
        UPDATE attendance_mark 
        SET status = ?, updated_date = ?, updated_time = ?, marked_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE student_id = ? AND marked_date = ?
    `,
    DELETE: 'DELETE FROM attendance_mark WHERE student_id = ? AND marked_date = ?',
    DELETE_BY_GRADE_DATE: 'DELETE FROM attendance_mark WHERE grade = ? AND section = ? AND marked_date = ?',
    CHECK_BEFORE_DELETE: `
        SELECT COUNT(*) as count, student_id, marked_date, status 
        FROM attendance_mark WHERE grade = ? AND section = ? AND marked_date = ?
    `,
    GET_STATISTICS: `
        SELECT 
            COUNT(*) as totalRecords,
            COUNT(CASE WHEN marked_date = ? THEN 1 END) as todayRecords,
            COUNT(CASE WHEN marked_date = ? AND status = 'present' THEN 1 END) as presentToday,
            COUNT(CASE WHEN marked_date = ? AND status = 'absent' THEN 1 END) as absentToday,
            COUNT(CASE WHEN marked_date = ? AND status = 'late' THEN 1 END) as lateToday
        FROM attendance_mark
    `,
    GET_SUMMARY: `
        SELECT 
            COUNT(*) as total_students,
            COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
            COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
            COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
            ROUND((COUNT(CASE WHEN status IN ('present', 'late') THEN 1 END) * 100.0) / COUNT(*), 2) as attendance_percentage
        FROM attendance_mark WHERE grade = ? AND section = ? AND marked_date = ?
    `
};

export const EMAIL_LOG_QUERIES = {
    CREATE: `
        INSERT INTO email_logs (
            mark_id, student_id, student_name, student_class, parent_email,
            email_type, status, error_message, failed_subjects_count, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            status = VALUES(status), student_name = VALUES(student_name),
            student_class = VALUES(student_class), error_message = VALUES(error_message),
            failed_subjects_count = VALUES(failed_subjects_count), sent_at = VALUES(sent_at)
    `,
    FIND_BY_ID: 'SELECT * FROM email_logs WHERE id = ?',
    FIND_BY_MARK_ID: 'SELECT * FROM email_logs WHERE mark_id = ?',
    HAS_EMAIL_BEEN_SENT: 'SELECT id FROM email_logs WHERE mark_id = ? AND status = "sent" LIMIT 1',
    GET_LATEST_FOR_MARK: 'SELECT * FROM email_logs WHERE mark_id = ? ORDER BY created_at DESC LIMIT 1',
    FIND_BY_STUDENT_ID: 'SELECT * FROM email_logs WHERE student_id = ? ORDER BY created_at DESC LIMIT ?',
    FIND_BY_STATUS: 'SELECT * FROM email_logs WHERE status = ? ORDER BY created_at DESC LIMIT ?',
    GET_STATISTICS: `
        SELECT 
            COUNT(CASE WHEN status = 'sent' THEN 1 END) as total_sent,
            COUNT(CASE WHEN status = 'failed' THEN 1 END) as total_failed,
            COUNT(CASE WHEN status = 'sent' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN 1 END) as recent_sent,
            COUNT(CASE WHEN status = 'failed' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN 1 END) as recent_failed,
            COUNT(DISTINCT student_id) as total_students
        FROM email_logs
    `,
    DELETE: 'DELETE FROM email_logs WHERE id = ?',
    CLEANUP_OLD: 'DELETE FROM email_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)'
};
