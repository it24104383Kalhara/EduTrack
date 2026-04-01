const mysql = require('mysql2/promise');

async function reindexStudentAssignments() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'ishani',
    database: 'edutrack'
  });

  try {
    console.log('--- Starting Student Assignment Re-indexing ---');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Get all records sorted by current ID
    const [assignments] = await connection.execute('SELECT id FROM student_assignment ORDER BY id ASC');
    console.log(`📊 Found ${assignments.length} assignments to re-index.`);

    for (let i = 0; i < assignments.length; i++) {
        const oldId = assignments[i].id;
        const newId = i + 1;

        if (oldId === newId) continue;

        console.log(`🔄 Updating assignment ${oldId} -> ${newId}`);
        await connection.execute('UPDATE student_assignment SET id = ? WHERE id = ?', [newId, oldId]);
    }

    // Reset auto-increment
    const nextId = assignments.length + 1;
    await connection.execute(`ALTER TABLE student_assignment AUTO_INCREMENT = ${nextId}`);
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

reindexStudentAssignments();
