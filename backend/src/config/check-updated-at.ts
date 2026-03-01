import pool from './database';

async function checkUpdatedAt() {
  try {
    console.log('🔍 Checking updated_at values in students table...');
    
    // Check current updated_at values
    const [students] = await pool.execute(`
      SELECT id, first_name, last_name, created_at, updated_at 
      FROM students 
      ORDER BY id 
      LIMIT 5
    `);
    
    console.log('📋 Current student records with timestamps:');
    console.table(students);
    
    // Test update on first student
    if (Array.isArray(students) && students.length > 0) {
      const firstStudent = students[0] as any;
      console.log(`\n🧪 Testing update on student: ${firstStudent.first_name} ${firstStudent.last_name} (ID: ${firstStudent.id})`);
      
      const oldUpdatedAt = firstStudent.updated_at;
      console.log(`⏰ Old updated_at: ${oldUpdatedAt}`);
      
      // Update the student
      await pool.execute(
        'UPDATE students SET first_name = ? WHERE id = ?',
        [firstStudent.first_name, firstStudent.id]
      );
      
      // Check the new updated_at
      const [updated] = await pool.execute(
        'SELECT updated_at FROM students WHERE id = ?',
        [firstStudent.id]
      );
      
      const newUpdatedAt = (updated as any[])[0].updated_at;
      console.log(`⏰ New updated_at: ${newUpdatedAt}`);
      
      if (oldUpdatedAt !== newUpdatedAt) {
        console.log('✅ updated_at is working correctly!');
      } else {
        console.log('❌ updated_at did not change - there might be an issue');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking updated_at:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the check
checkUpdatedAt()
  .then(() => {
    console.log('✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
