const mysql = require('mysql2/promise');
require('dotenv').config();

async function deleteTestData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'edutrack'
  });

  try {
    console.log('🗑️  Deleting Test Data...\n');
    
    // Show current data before deletion
    console.log('📊 Current Data Before Deletion:');
    
    const [students] = await connection.execute('SELECT COUNT(*) as count FROM students');
    const [grades] = await connection.execute('SELECT COUNT(*) as count FROM grades');
    const [assignments] = await connection.execute('SELECT COUNT(*) as count FROM student_assignment');
    const [subjects] = await connection.execute('SELECT COUNT(*) as count FROM subjects');
    
    console.log(`   Students: ${students[0].count}`);
    console.log(`   Grades: ${grades[0].count}`);
    console.log(`   Assignments: ${assignments[0].count}`);
    console.log(`   Subjects: ${subjects[0].count}\n`);
    
    // Confirm deletion
    console.log('⚠️  This will delete ALL data from the following tables:');
    console.log('   1. student_assignment (student assignments)');
    console.log('   2. students (registered students)');
    console.log('   3. grades (grade information)');
    console.log('   4. subjects (subject information)\n');
    
    // Delete data in correct order (respecting foreign key constraints)
    console.log('🔄 Deleting data...');
    
    // 1. Delete student assignments first
    const [deleteAssignments] = await connection.execute('DELETE FROM student_assignment');
    console.log(`✅ Deleted ${deleteAssignments.affectedRows} student assignments`);
    
    // 2. Delete students
    const [deleteStudents] = await connection.execute('DELETE FROM students');
    console.log(`✅ Deleted ${deleteStudents.affectedRows} students`);
    
    // 3. Delete grades
    const [deleteGrades] = await connection.execute('DELETE FROM grades');
    console.log(`✅ Deleted ${deleteGrades.affectedRows} grades`);
    
    // 4. Delete subjects
    const [deleteSubjects] = await connection.execute('DELETE FROM subjects');
    console.log(`✅ Deleted ${deleteSubjects.affectedRows} subjects`);
    
    // Reset auto-increment counters
    console.log('\n🔄 Resetting auto-increment counters...');
    
    await connection.execute('ALTER TABLE student_assignment AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE students AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE grades AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE subjects AUTO_INCREMENT = 1');
    
    console.log('✅ Auto-increment counters reset');
    
    // Verify deletion
    console.log('\n📊 Data After Deletion:');
    
    const [studentsAfter] = await connection.execute('SELECT COUNT(*) as count FROM students');
    const [gradesAfter] = await connection.execute('SELECT COUNT(*) as count FROM grades');
    const [assignmentsAfter] = await connection.execute('SELECT COUNT(*) as count FROM student_assignment');
    const [subjectsAfter] = await connection.execute('SELECT COUNT(*) as count FROM subjects');
    
    console.log(`   Students: ${studentsAfter[0].count}`);
    console.log(`   Grades: ${gradesAfter[0].count}`);
    console.log(`   Assignments: ${assignmentsAfter[0].count}`);
    console.log(`   Subjects: ${subjectsAfter[0].count}`);
    
    console.log('\n🎉 All test data has been successfully deleted!');
    console.log('💡 Your database is now clean and ready for fresh data.');
    
  } catch (error) {
    console.error('❌ Error deleting test data:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

deleteTestData().catch(console.error);
