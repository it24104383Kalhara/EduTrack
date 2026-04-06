-- Sport & Extra Curriculum Activities Database Schema

-- 1. Activities (Sports, Clubs, Societies)
CREATE TABLE IF NOT EXISTS sports_activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  type ENUM('Sport', 'Club', 'Society') NOT NULL,
  in_charge_staff_id INT, -- Foreign key referencing staff/user
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Memberships (Students joining Activities)
CREATE TABLE IF NOT EXISTS sports_memberships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL, -- Foreign key referencing student/user
  activity_id INT NOT NULL,
  role ENUM('Member', 'Captain', 'Vice-Captain', 'President', 'Secretary', 'Treasurer') DEFAULT 'Member',
  joined_at DATE NOT NULL,
  quit_at DATE,
  FOREIGN KEY (activity_id) REFERENCES sports_activities(id) ON DELETE CASCADE
);

-- 3. Inventory (Equipment)
CREATE TABLE IF NOT EXISTS sports_inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  total_quantity INT DEFAULT 0,
  available_quantity INT DEFAULT 0,
  `condition` ENUM('New', 'Good', 'Fair', 'Poor', 'Broken') DEFAULT 'Good',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Inventory Logs (Borrowing/Returning)
CREATE TABLE IF NOT EXISTS sports_inventory_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  borrowed_by_id INT NOT NULL, -- Student or Staff ID
  borrowed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  returned_at TIMESTAMP NULL,
  status ENUM('Borrowed', 'Returned', 'Lost', 'Damaged') DEFAULT 'Borrowed',
  FOREIGN KEY (item_id) REFERENCES sports_inventory(id) ON DELETE CASCADE
);

-- 5. Facilities (Grounds, Courts, Rooms)
CREATE TABLE IF NOT EXISTS sports_facilities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('Ground', 'Room', 'Hall', 'Court', 'Pool') NOT NULL,
  capacity INT,
  location_description TEXT
);

-- 6. Bookings (Facility Reservation)
CREATE TABLE IF NOT EXISTS sports_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  facility_id INT NOT NULL,
  booked_by_id INT NOT NULL, -- Staff ID usually
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  purpose TEXT,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  FOREIGN KEY (facility_id) REFERENCES sports_facilities(id) ON DELETE CASCADE
);

-- 7. Practice Sessions (Scheduled practices)
CREATE TABLE IF NOT EXISTS sports_practice_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  activity_id INT NOT NULL,
  coach_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  location_id INT, -- Optional link to facility
  FOREIGN KEY (activity_id) REFERENCES sports_activities(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES sports_facilities(id) ON DELETE SET NULL
);

-- 8. Attendance (Student attendance for sessions)
CREATE TABLE IF NOT EXISTS sports_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  student_id INT NOT NULL,
  status ENUM('Present', 'Absent', 'Excused', 'Late') NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sports_practice_sessions(id) ON DELETE CASCADE
);

-- 9. Achievements (Awards, Match Results)
CREATE TABLE IF NOT EXISTS sports_achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT, -- Nullable if team achievement
  activity_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  date DATE NOT NULL,
  merit_points INT DEFAULT 0,
  description TEXT,
  FOREIGN KEY (activity_id) REFERENCES sports_activities(id) ON DELETE CASCADE
);

-- 10. Attendance Reports (Coach → Principal workflow)
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
  FOREIGN KEY (activity_id) REFERENCES sports_activities(id) ON DELETE CASCADE
);

-- 11. Teacher Notifications (Principal → Teacher after report approval)
CREATE TABLE IF NOT EXISTS sports_teacher_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  teacher_id INT NOT NULL,
  message TEXT NOT NULL,
  status ENUM('Unread', 'Read', 'Actioned') DEFAULT 'Unread',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES sports_attendance_reports(id) ON DELETE CASCADE
);
