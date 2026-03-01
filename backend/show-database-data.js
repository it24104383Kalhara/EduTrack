// COMPLETE DATABASE DATA VIEWER
// This will show you ALL data in the database with multiple methods

const mysql = require('mysql2');
const fs = require('fs');

console.log('🔍 COMPREHENSIVE DATABASE DATA VIEWER');
console.log('=====================================\n');

async function showAllData() {
    let connection;
    
    try {
        // Connect to database
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'ishani',
            database: 'edutrack'
        });

        console.log('✅ CONNECTED TO DATABASE: edutrack');
        console.log('👤 USER: root');
        console.log('🌐 HOST: localhost');
        console.log('🔐 PASSWORD: ishani');
        console.log('=====================================\n');

        // 1. Show all tables
        console.log('📋 ALL TABLES IN DATABASE:');
        const [tables] = await connection.execute('SHOW TABLES');
        tables.forEach((table, index) => {
            console.log(`   ${index + 1}. ${Object.values(table)[0]}`);
        });
        console.log('');

        // 2. Show student_assignments table structure
        console.log('🏗️  STUDENT_ASSIGNMENTS TABLE STRUCTURE:');
        const [structure] = await connection.execute('DESCRIBE student_assignments');
        structure.forEach(column => {
            console.log(`   ${column.Field} | ${column.Type} | ${column.Null} | ${column.Key}`);
        });
        console.log('');

        // 3. Show raw student_assignments data
        console.log('📊 RAW STUDENT_ASSIGNMENTS DATA:');
        const [rawData] = await connection.execute('SELECT * FROM student_assignments');
        console.log('ID | GRADE_ID | STUDENT_ID | ASSIGNED_AT | UPDATED_AT');
        console.log('---|----------|------------|-------------|------------');
        rawData.forEach(row => {
            console.log(`${row.id} | ${row.grade_id} | ${row.student_id} | ${row.assigned_at} | ${row.updated_at}`);
        });
        console.log('');

        // 4. Show complete view with student names and grades
        console.log('👥 COMPLETE VIEW WITH STUDENT NAMES & GRADES:');
        const [completeData] = await connection.execute(`
            SELECT 
                sa.student_id,
                CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                g.grade,
                g.grade_part AS section,
                sa.assigned_at,
                sa.updated_at
            FROM student_assignments sa
            JOIN students s ON sa.student_id = s.id
            JOIN grades g ON sa.grade_id = g.id
            ORDER BY g.grade, g.grade_part, s.first_name
        `);
        
        console.log('STUDENT_ID | STUDENT_NAME        | GRADE | SECTION | ASSIGNED_AT         | UPDATED_AT');
        console.log('------------|---------------------|-------|---------|---------------------|------------');
        completeData.forEach(row => {
            const studentId = row.student_id.toString().padEnd(11);
            const studentName = (row.student_name || '').padEnd(20);
            const grade = row.grade.toString().padEnd(6);
            const section = (row.section || '').padEnd(8);
            const assignedAt = row.assigned_at;
            const updatedAt = row.updated_at;
            
            console.log(`${studentId} | ${studentName} | ${grade} | ${section} | ${assignedAt} | ${updatedAt}`);
        });
        console.log('');

        // 5. Show students table
        console.log('👨‍🎓 STUDENTS TABLE:');
        const [students] = await connection.execute('SELECT id, first_name, last_name, date_of_birth FROM students');
        console.log('ID | FIRST_NAME | LAST_NAME | DATE_OF_BIRTH');
        console.log('---|-----------|----------|--------------');
        students.forEach(row => {
            console.log(`${row.id} | ${row.first_name} | ${row.last_name} | ${row.date_of_birth}`);
        });
        console.log('');

        // 6. Show grades table
        console.log('📚 GRADES TABLE:');
        const [grades] = await connection.execute('SELECT id, grade, grade_part, created_at FROM grades');
        console.log('ID | GRADE | GRADE_PART | CREATED_AT');
        console.log('---|-------|------------|------------');
        grades.forEach(row => {
            console.log(`${row.id} | ${row.grade} | ${row.grade_part} | ${row.created_at}`);
        });
        console.log('');

        // 7. Create HTML report
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>EduTrack Database Report</title>
    <style>
        body { font-family: Arial; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #10b981; color: white; }
        .header { color: #10b981; text-align: center; }
    </style>
</head>
<body>
    <h1 class="header">🗄️ EduTrack Database Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
    
    <h2>📋 Student Assignments (${completeData.length} records)</h2>
    <table>
        <tr><th>Student ID</th><th>Student Name</th><th>Grade</th><th>Section</th><th>Assigned At</th><th>Updated At</th></tr>
        ${completeData.map(row => `
            <tr>
                <td>${row.student_id}</td>
                <td>${row.student_name}</td>
                <td>${row.grade}</td>
                <td>${row.section}</td>
                <td>${new Date(row.assigned_at).toLocaleString()}</td>
                <td>${row.updated_at ? new Date(row.updated_at).toLocaleString() : 'N/A'}</td>
            </tr>
        `).join('')}
    </table>
    
    <h2>👥 Students (${students.length} records)</h2>
    <table>
        <tr><th>ID</th><th>First Name</th><th>Last Name</th><th>Date of Birth</th></tr>
        ${students.map(row => `
            <tr>
                <td>${row.id}</td>
                <td>${row.first_name}</td>
                <td>${row.last_name}</td>
                <td>${new Date(row.date_of_birth).toLocaleDateString()}</td>
            </tr>
        `).join('')}
    </table>
    
    <h2>📚 Grades (${grades.length} records)</h2>
    <table>
        <tr><th>ID</th><th>Grade</th><th>Section</th><th>Created At</th></tr>
        ${grades.map(row => `
            <tr>
                <td>${row.id}</td>
                <td>${row.grade}</td>
                <td>${row.grade_part}</td>
                <td>${new Date(row.created_at).toLocaleString()}</td>
            </tr>
        `).join('')}
    </table>
</body>
</html>`;

        // Save HTML report
        fs.writeFileSync('database-report.html', htmlContent);
        console.log('📄 HTML REPORT SAVED: database-report.html');
        console.log('   Open this file in your browser to see the data!');

        // 8. Create JSON report
        const jsonData = {
            timestamp: new Date().toISOString(),
            database: 'edutrack',
            tables: {
                student_assignments: rawData,
                students: students,
                grades: grades,
                complete_view: completeData
            }
        };
        
        fs.writeFileSync('database-data.json', JSON.stringify(jsonData, null, 2));
        console.log('📁 JSON DATA SAVED: database-data.json');

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.log('\n🔧 TROUBLESHOOTING:');
        console.log('1. Make sure MySQL is running');
        console.log('2. Check MySQL credentials (root/ishani)');
        console.log('3. Verify database name (edutrack)');
        console.log('4. Check if MySQL service is started');
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✅ Database connection closed');
        }
    }
}

// Run the function
showAllData().then(() => {
    console.log('\n🎉 COMPLETE! Check these files:');
    console.log('   1. database-report.html (Open in browser)');
    console.log('   2. database-data.json (Raw data)');
    console.log('   3. Your console output above');
    console.log('   4. Your website: http://localhost:5173');
});
