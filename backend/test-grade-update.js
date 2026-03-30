const mysql = require('mysql2/promise');
require('dotenv').config();

async function testGradeUpdate() {
  let connection;
  try {
    console.log('🧪 Testing grade update process...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'edutrack'
    });

    const teacherId = 31; // Ishani
    const newGradeId = 3; // Grade 10-A

    console.log(`🔄 Testing: Update teacher ${teacherId} to grade ${newGradeId}`);

    // Start transaction
    await connection.beginTransaction();

    try {
      // Step 1: Clear previous assignments
      console.log('Step 1: Clearing previous assignments...');
      const clearResult = await connection.execute('UPDATE grades SET teacher_id = NULL WHERE teacher_id = ?', [teacherId]);
      console.log('Clear result:', clearResult);

      // Step 2: Assign to new grade
      console.log('Step 2: Assigning to new grade...');
      const assignResult = await connection.execute('UPDATE grades SET teacher_id = ? WHERE id = ?', [teacherId, newGradeId]);
      console.log('Assign result:', assignResult);

      // Step 3: Get grade details
      console.log('Step 3: Getting grade details...');
      const [gradeRows] = await connection.execute('SELECT grade, grade_part FROM grades WHERE id = ?', [newGradeId]);
      console.log('Grade rows:', gradeRows);

      let gradeString = "No Class Assigned";
      if (gradeRows.length > 0) {
        const gradeData = gradeRows[0];
        gradeString = `Grade ${gradeData.grade}-${gradeData.grade_part}`;
      }
      console.log('Grade string:', gradeString);

      // Step 4: Update users table
      console.log('Step 4: Updating users table...');
      const userUpdateResult = await connection.execute('UPDATE users SET grade = ? WHERE id = ?', [gradeString, teacherId]);
      console.log('User update result:', userUpdateResult);

      // Step 5: Update teachers table
      console.log('Step 5: Updating teachers table...');
      const teacherUpdateResult = await connection.execute('UPDATE teachers SET grade = ? WHERE user_id = ?', [gradeString, teacherId]);
      console.log('Teacher update result:', teacherUpdateResult);

      // Commit transaction
      await connection.commit();
      console.log('✅ Transaction committed successfully!');

      // Verify the changes
      console.log('\n🔍 Verifying changes...');
      const [userCheck] = await connection.execute('SELECT id, username, grade FROM users WHERE id = ?', [teacherId]);
      const [teacherCheck] = await connection.execute('SELECT user_id, grade FROM teachers WHERE user_id = ?', [teacherId]);
      const [gradeCheck] = await connection.execute('SELECT id, grade, grade_part, teacher_id FROM grades WHERE id = ?', [newGradeId]);

      console.log('User check:', userCheck);
      console.log('Teacher check:', teacherCheck);
      console.log('Grade check:', gradeCheck);

    } catch (error) {
      await connection.rollback();
      console.error('❌ Transaction rolled back:', error);
      throw error;
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testGradeUpdate();
