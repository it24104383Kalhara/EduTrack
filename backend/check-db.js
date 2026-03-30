const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabaseState() {
  let connection;
  try {
    console.log('🔍 Checking database state...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'edutrack'
    });

    console.log('✅ Connected to database');

    // Check users table
    try {
      const [users] = await connection.execute('SELECT id, username, role, status, grade FROM users WHERE role = "teacher"');
      console.log('📊 Teachers in users table:', users.length);
      users.forEach(user => {
        console.log(`  - ID: ${user.id}, Username: ${user.username}, Grade: ${user.grade || 'NULL'}, Status: ${user.status}`);
      });
    } catch (error) {
      console.log('❌ Error checking users table:', error.message);
    }

    // Check teachers table
    try {
      const [teachers] = await connection.execute('SELECT user_id, first_name, last_name, grade FROM teachers');
      console.log('📊 Entries in teachers table:', teachers.length);
      teachers.forEach(teacher => {
        console.log(`  - User ID: ${teacher.user_id}, Name: ${teacher.first_name} ${teacher.last_name}, Grade: ${teacher.grade || 'NULL'}`);
      });
    } catch (error) {
      console.log('❌ Error checking teachers table:', error.message);
    }

    // Check grades table
    try {
      const [grades] = await connection.execute('SELECT id, grade, grade_part, teacher_id FROM grades');
      console.log('📊 Grades in database:');
      grades.forEach(grade => {
        console.log(`  - ID: ${grade.id}, Grade: ${grade.grade}-${grade.grade_part}, Teacher ID: ${grade.teacher_id || 'NULL'}`);
      });
    } catch (error) {
      console.log('❌ Error checking grades table:', error.message);
    }

    // Check for missing teacher entries
    try {
      const [missingTeachers] = await connection.execute(`
        SELECT u.id, u.username, u.first_name, u.last_name 
        FROM users u 
        LEFT JOIN teachers t ON u.id = t.user_id 
        WHERE u.role = 'teacher' AND t.user_id IS NULL
      `);
      
      if (missingTeachers.length > 0) {
        console.log('⚠️  Teachers missing from teachers table:');
        missingTeachers.forEach(teacher => {
          console.log(`  - ID: ${teacher.id}, Username: ${teacher.username}`);
        });
      } else {
        console.log('✅ All teachers have entries in teachers table');
      }
    } catch (error) {
      console.log('❌ Error checking missing teachers:', error.message);
    }

  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDatabaseState();
