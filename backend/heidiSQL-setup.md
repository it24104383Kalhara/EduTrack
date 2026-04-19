# HeidiSQL Connection Guide

## 🔗 **Connect HeidiSQL to EduTrack MySQL Database**

### 📋 **Connection Information**
- **Host/Server**: `localhost` or `127.0.0.1`
- **User**: `root`
- **Password**: `navodya@2004`
- **Port**: `3306` (default MySQL port)
- **Database**: `edutrack_hostel`

---

## 🛠️ **Step-by-Step Connection**

### **1. Open HeidiSQL**
- Launch HeidiSQL application
- Click "New" to create a new session

### **2. Configure Connection**
Fill in these details:

#### **Connection Tab**:
```
Server type: MySQL
Host/IP: localhost or 127.0.0.1
Port: 3306
User: root
Password: navodya@2004
```

#### **Advanced Tab** (if needed):
```
Database: edutrack_hostel
Charset: utf8mb4
Compression: None
```

### **3. Test Connection**
- Click "Test" button
- Should show: "Connection successful"
- If error occurs, check password and service

### **4. Save and Connect**
- Click "Save" to store the session
- Click "Open" to connect

---

## 🔧 **Troubleshooting HeidiSQL**

### **❌ Connection Failed?**

#### **Check MySQL Service**:
```bash
# Check if MySQL is running
net start | findstr mysql

# Start MySQL if not running
net start mysql
```

#### **Check Port**:
```bash
# Check if MySQL is listening on port 3306
netstat -an | findstr 3306
```

#### **Verify Credentials**:
- User: `root`
- Password: `navodya@2004`
- Database: `edutrack_hostel`

### **❌ Database Not Visible?**

#### **Refresh Database List**:
1. In HeidiSQL, right-click on connection
2. Select "Refresh"
3. Look for `edutrack_hostel`

#### **Manual Database Selection**:
1. Connect to MySQL server
2. In query tab, run: `USE edutrack_hostel;`
3. Refresh database list

---

## 📊 **Viewing Your Data**

Once connected, you'll see:

### **Tables**:
- `rooms` - Room information
- `students` - Student data
- `payments` - Payment records
- `email_logs` - Email history

### **Sample Queries**:
```sql
-- View all rooms
SELECT * FROM rooms;

-- View room occupancy
SELECT 
    room_number,
    capacity,
    current_occupancy,
    (capacity - current_occupancy) as available_spaces
FROM rooms;

-- View students with room assignments
SELECT 
    s.student_name,
    s.registration_number,
    s.grade,
    r.room_number as assigned_room,
    s.parent_email
FROM students s
LEFT JOIN rooms r ON s.assigned_room = r.id
WHERE s.status = 'active';

-- View payment summary
SELECT 
    p.payment_type,
    p.status,
    COUNT(*) as count,
    SUM(p.amount) as total
FROM payments p
GROUP BY p.payment_type, p.status;
```

---

## 🎯 ** HeidiSQL Tips**

### **Navigation**:
- **Left Panel**: Database and table list
- **Center Panel**: Query editor
- **Right Panel**: Data grid and results

### **Features**:
- **Query Tab**: Write and execute SQL queries
- **Data Tab**: Browse and edit table data
- **Export**: Right-click table → Export
- **Import**: Right-click table → Import

### **Keyboard Shortcuts**:
- `F9`: Execute query
- `F5`: Refresh data
- `Ctrl+R`: Refresh table list

---

## 🔍 **Alternative: If HeidiSQL Doesn't Work**

### **Try MySQL Command Line**:
```bash
mysql -u root -pnavodya@2004
USE edutrack_hostel;
SHOW TABLES;
```

### **Try Web Viewer**:
1. Open `database-viewer.html` in browser
2. Navigate to: `http://localhost:5005/api/rooms`
3. View data in web interface

---

## 🚀 **Quick Connection Test**

### **Test with HeidiSQL**:
1. **Server**: `localhost`
2. **User**: `root`
3. **Password**: `navodya@2004`
4. **Port**: `3306`
5. **Database**: `edutrack_hostel`

### **Expected Result**:
- ✅ Connection successful
- 📋 4 tables visible
- 📊 Sample data loaded

---

## 📞 **Still Having Issues?**

### **Common Problems**:
1. **MySQL not running** → Start MySQL service
2. **Wrong port** → Check if MySQL uses 3306 or 3307
3. **Password incorrect** → Verify: `navodya@2004`
4. **Firewall blocking** → Allow port 3306 through firewall

### **Verify MySQL Status**:
```bash
# Check MySQL service status
sc query mysql

# Check MySQL version
mysql --version
```

---

## 🎉 **Success Indicators**

When properly connected, you'll see:

### **In HeidiSQL**:
- ✅ Database: `edutrack_hostel`
- ✅ Tables: 4 (rooms, students, payments, email_logs)
- ✅ Data: Sample records visible
- ✅ Queries: Execute successfully

### **Data You Should See**:
- **5 rooms**: H001-H005 with occupancy data
- **5 students**: With room assignments and details
- **5 payments**: Mixed statuses and amounts
- **2 email logs**: Sample email records

---

**🔗 Ready to connect HeidiSQL! Use the credentials above to view your EduTrack database!**
