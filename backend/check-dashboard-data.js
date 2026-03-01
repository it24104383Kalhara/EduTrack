const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDashboardData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'edutrack'
  });

  try {
    console.log('🔍 Checking Dashboard Data...\n');
    
    // Check students table
    console.log('📚 Students Table:');
    const [students] = await connection.execute('SELECT * FROM students');
    console.table(students);
    console.log(`Total students: ${students.length}\n`);
    
    // Check grades table
    console.log('📊 Grades Table:');
    const [grades] = await connection.execute('SELECT * FROM grades');
    console.table(grades);
    console.log(`Total grades: ${grades.length}\n`);
    
    // Check student_assignment table
    console.log('📋 Student Assignment Table:');
    const [assignments] = await connection.execute('SELECT * FROM student_assignment');
    console.table(assignments);
    console.log(`Total assignments: ${assignments.length}\n`);
    
    // Check what the dashboard API would return
    console.log('🔗 API Response Check:');
    
    // Test grades endpoint
    const gradesResponse = await connection.execute(`
      SELECT 
        g.id,
        g.grade,
        g.grade_part,
        g.created_at,
        g.updated_at,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', sa.student_id,
              'first_name', SUBSTRING_INDEX(sa.student_name, ' ', 1),
              'last_name', SUBSTRING_INDEX(sa.student_name, ' ', -1),
              'parent_phone', '',
              'assigned_at', sa.assigned_at
            )
          )
          FROM student_assignment sa
          WHERE sa.grade = g.grade AND sa.section = g.grade_part
        ) as students
      FROM grades g
      ORDER BY g.grade, g.grade_part
    `);
    
    console.log('Grades with students (what dashboard sees):');
    console.table(gradesResponse[0]);
    
    // Test assignments endpoint
    const assignmentsResponse = await connection.execute(`
      SELECT 
        sa.student_id,
        sa.student_name,
        sa.grade,
        sa.section,
        sa.assigned_at,
        sa.updated_at
      FROM student_assignment sa
      ORDER BY sa.grade, sa.section, sa.student_name
    `);
    
    console.log('\nAll assignments (what assignments API sees):');
    console.table(assignmentsResponse[0]);
    
  } catch (error) {
    console.error('❌ Error checking dashboard data:', error);
  } finally {
    await connection.end();
  }
}

checkDashboardData();
