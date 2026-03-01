// Database Connection Script to View Student Assignments
// Run this with: node view-assignments.js

const mysql = require('mysql2/promise');

async function viewAssignments() {
  try {
    // Create database connection
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'ishani',
      database: 'edutrack'
    });

    console.log('🔗 Connected to EduTrack Database');
    console.log('=====================================\n');

    // Show all student assignments with complete details
    console.log('📋 STUDENT ASSIGNMENTS DATA:');
    console.log('=====================================\n');

    const [assignments] = await connection.execute(`
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
      ORDER BY g.grade, g.grade_part, s.first_name, s.last_name
    `);

    if (assignments.length === 0) {
      console.log('❌ No student assignments found in the database.');
    } else {
      console.log(`✅ Found ${assignments.length} student assignments:\n`);
      
      // Display table header
      console.log('+------------+---------------------+-------+---------+---------------------+---------------------+');
      console.log('| Student ID | Student Name        | Grade | Section | Assigned At         | Updated At          |');
      console.log('+------------+---------------------+-------+---------+---------------------+---------------------+');
      
      // Display each assignment
      assignments.forEach(row => {
        const studentId = row.student_id.toString().padEnd(11);
        const studentName = (row.student_name || '').padEnd(20);
        const grade = row.grade.toString().padEnd(6);
        const section = (row.section || '').padEnd(8);
        const assignedAt = new Date(row.assigned_at).toLocaleString().padEnd(20);
        const updatedAt = row.updated_at ? new Date(row.updated_at).toLocaleString().padEnd(19) : 'N/A'.padEnd(19);
        
        console.log(`| ${studentId} | ${studentName} | ${grade} | ${section} | ${assignedAt} | ${updatedAt} |`);
      });
      
      console.log('+------------+---------------------+-------+---------+---------------------+---------------------+');
    }

    console.log('\n📊 RAW DATABASE TABLES:');
    console.log('=====================================\n');

    // Show student_assignments table
    console.log('🗂️  student_assignments table:');
    const [studentAssignments] = await connection.execute('SELECT * FROM student_assignments');
    console.table(studentAssignments);

    // Show students table
    console.log('\n👥 students table (first 5):');
    const [students] = await connection.execute('SELECT id, first_name, last_name, date_of_birth FROM students LIMIT 5');
    console.table(students);

    // Show grades table
    console.log('\n📚 grades table:');
    const [grades] = await connection.execute('SELECT * FROM grades');
    console.table(grades);

    // Close connection
    await connection.end();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Database Error:', error.message);
    console.log('\n💡 Make sure MySQL is running and the database credentials are correct:');
    console.log('   - Host: localhost');
    console.log('   - User: root');
    console.log('   - Password: ishani');
    console.log('   - Database: edutrack');
  }
}

// Run the function
viewAssignments();
