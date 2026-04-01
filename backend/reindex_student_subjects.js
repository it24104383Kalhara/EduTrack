const mysql = require('mysql2/promise');

async function reindexStudentSubjects() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'ishani',
    database: 'edutrack'
  });

  try {
    console.log('--- Starting Student Subjects Re-indexing ---');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Get all records sorted by current ID
    const [records] = await connection.execute('SELECT id FROM student_subjects ORDER BY id ASC');
    console.log(`📊 Found ${records.length} records to re-index.`);

    for (let i = 0; i < records.length; i++) {
        const oldId = records[i].id;
        const newId = i + 1;

        if (oldId === newId) continue;

        console.log(`🔄 Updating record ${oldId} -> ${newId}`);
        await connection.execute('UPDATE student_subjects SET id = ? WHERE id = ?', [newId, oldId]);
        
        // No related tables use student_subjects id as a foreign key based on schema
    }

    // Reset auto-increment
    const nextId = records.length + 1;
    await connection.execute(`ALTER TABLE student_subjects AUTO_INCREMENT = ${nextId}`);
    console.log(`✅ Reset AUTO_INCREMENT to ${nextId}`);

    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('--- Re-indexing Complete ---');

  } catch (error) {
    console.error('❌ Re-indexing failed:', error);
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
  } finally {
    await connection.end();
  }
}

reindexStudentSubjects();
