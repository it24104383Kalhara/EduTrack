# How to View MySQL Database

## 🗄️ **MySQL Database Viewer Guide**

### 📋 **Database Information**
- **Database Name**: `edutrack_hostel`
- **Host**: `localhost`
- **User**: `root`
- **Password**: `navodya@2004`

---

## 🛠️ **Method 1: MySQL Command Line**

### **Open MySQL Command Line**
```bash
# Windows - Open Command Prompt or PowerShell
mysql -u root -pnavodya@2004

# Or if prompted for password:
mysql -u root -p
# Then enter: navodya@2004
```

### **Use the Database**
```sql
USE edutrack_hostel;
```

### **View All Tables**
```sql
SHOW TABLES;
```

### **View Table Data**
```sql
-- View all rooms
SELECT * FROM rooms;

-- View all students
SELECT * FROM students;

-- View all payments
SELECT * FROM payments;

-- View email logs
SELECT * FROM email_logs;
```

### **Useful Queries**
```sql
-- View room occupancy summary
SELECT 
    room_number,
    capacity,
    current_occupancy,
    (capacity - current_occupancy) as available_spaces,
    CASE 
        WHEN current_occupancy = 0 THEN 'Empty'
        WHEN current_occupancy >= capacity THEN 'Full'
        ELSE 'Partially Filled'
    END as status
FROM rooms;

-- View student assignments
SELECT 
    s.student_name,
    s.registration_number,
    s.grade,
    r.room_number,
    s.parent_email
FROM students s
LEFT JOIN rooms r ON s.assigned_room = r.id
WHERE s.status = 'active';

-- View payment summary
SELECT 
    p.payment_type,
    p.status,
    COUNT(*) as count,
    SUM(p.amount) as total_amount
FROM payments p
GROUP BY p.payment_type, p.status;

-- View dashboard statistics
SELECT 
    (SELECT COUNT(*) FROM rooms) as total_rooms,
    (SELECT COUNT(*) FROM rooms WHERE current_occupancy > 0) as occupied_rooms,
    (SELECT COUNT(*) FROM students WHERE status = 'active') as total_students,
    (SELECT COUNT(*) FROM students WHERE status = 'active' AND assigned_room IS NOT NULL) as students_in_hostel,
    (SELECT COUNT(*) FROM payments WHERE status = 'pending') as pending_payments,
    (SELECT COUNT(*) FROM payments WHERE status = 'pending' AND due_date < CURDATE()) as overdue_payments,
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'paid') as total_collected;
```

---

## 🖥️ **Method 2: MySQL Workbench (GUI)**

### **Download and Install**
1. Go to: https://dev.mysql.com/downloads/workbench/
2. Download MySQL Workbench
3. Install the application

### **Connect to Database**
1. Open MySQL Workbench
2. Click `+` to add new connection
3. **Connection Name**: EduTrack Hostel
4. **Hostname**: localhost
5. **Port**: 3306
6. **Username**: root
7. **Password**: navodya@2004
8. Click **Test Connection**
9. Click **OK** to save

### **View Database**
1. Double-click your connection
2. In the query editor, type: `USE edutrack_hostel;`
3. Click the lightning bolt to execute
4. Use the queries from Method 1

---

## 🌐 **Method 3: Web-Based Tools**

### **phpMyAdmin** (if you have XAMPP/WAMP)
1. Open http://localhost/phpmyadmin
2. Server: localhost
3. Username: root
4. Password: navodya@2004
5. Select `edutrack_hostel` database

### **Adminer** (lightweight web tool)
1. Download from: https://www.adminer.org/
2. Place in your web server
3. Open in browser
4. Server: localhost
5. Username: root
6. Password: navodya@2004
7. Database: edutrack_hostel

---

## 🔧 **Method 4: Node.js Script (Built-in)**

I can create a Node.js script to view your database:

### **Database Viewer Script**
```bash
# Run the built-in database viewer
node view-database.js
```

---

## 📊 **Database Schema Overview**

### **Tables Structure**

#### **rooms**
- `id` (Primary Key)
- `room_number` (Unique)
- `capacity`
- `current_occupancy`
- `floor_number`
- `room_type` (single/double/dormitory)
- `status` (available/maintenance/full)

#### **students**
- `id` (Primary Key)
- `registration_number` (Unique)
- `student_name`
- `grade`
- `parent_email`
- `parent_phone`
- `assigned_room` (Foreign Key to rooms)
- `room_number`
- `admission_date`
- `status` (active/inactive/graduated)

#### **payments**
- `id` (Primary Key)
- `student_id` (Foreign Key to students)
- `amount`
- `payment_type` (hostel_fee/tuition_fee/mess_fee/library_fee/other)
- `status` (pending/paid/overdue/cancelled)
- `payment_date`
- `due_date`
- `payment_method`
- `transaction_id`
- `description`

#### **email_logs**
- `id` (Primary Key)
- `student_id` (Foreign Key to students)
- `parent_email`
- `email_type` (payment_reminder/payment_warning/payment_confirmation/other)
- `subject`
- `message`
- `status` (sent/failed/pending)
- `sent_at`
- `error_message`

---

## 🚀 **Quick Start Commands**

### **Open MySQL Now**
```bash
# In Command Prompt/PowerShell:
mysql -u root -pnavodya@2004

# Then run:
USE edutrack_hostel;
SHOW TABLES;
SELECT * FROM rooms;
```

### **View Sample Data**
```sql
-- Quick overview of all data
SELECT 'Rooms' as table_name, COUNT(*) as record_count FROM rooms
UNION ALL
SELECT 'Students', COUNT(*) FROM students WHERE status = 'active'
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments
UNION ALL
SELECT 'Email Logs', COUNT(*) FROM email_logs;
```

---

## 🎯 **Recommended Method**

**For beginners**: Use MySQL Command Line (Method 1)
**For advanced users**: Use MySQL Workbench (Method 2)
**For web interface**: Use phpMyAdmin (Method 3)

---

## 🔍 **Troubleshooting**

### **Connection Issues**
```bash
# Check if MySQL is running
# Windows:
net start mysql

# Or restart MySQL service
net stop mysql
net start mysql
```

### **Password Issues**
```bash
# Reset MySQL password (if needed)
mysql -u root -p
# Then enter your password: navodya@2004
```

### **Database Not Found**
```sql
-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS edutrack_hostel;
USE edutrack_hostel;
```

---

## 📞 **Need Help?**

1. **Try Method 1 first** (MySQL Command Line)
2. **Use the sample queries** provided above
3. **Check connection** with the test command
4. **Ask for help** if you get stuck!

**Your database is ready with sample data!** 🎉
