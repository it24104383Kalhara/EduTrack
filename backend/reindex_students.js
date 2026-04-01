const mysql = require('mysql2/promise');

async function reindexStudents() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'ishani',
    database: 'edutrack'
  });

  try {
    console.log('--- Starting Student Re-indexing ---');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    console.log('✅ Disabled foreign key checks');

    // Get all students sorted by their current ID or created_at
    const [students] = await connection.execute('SELECT id FROM students ORDER BY id ASC');
    console.log(`📊 Found ${students.length} students to re-index.`);

    for (let i = 0; i < students.length; i++) {
        const oldId = students[i].id;
        const newId = i + 1;

        if (oldId === newId) continue;

        console.log(`🔄 Updating student ${oldId} -> ${newId}`);

        // Update main table
        await connection.execute('UPDATE students SET id = ? WHERE id = ?', [newId, oldId]);

        // Update related tables
        const relatedTables = [
            'student_subjects',
            'student_assignment',
            'attendance_mark',
            'marks',
            'email_logs'
        ];

        for (const table of relatedTables) {
            await connection.execute(`UPDATE ${table} SET student_id = ? WHERE student_id = ?`, [newId, oldId]);
        }
    }

    // Reset auto-increment
    const nextId = students.length + 1;
    await connection.execute(`ALTER TABLE students AUTO_INCREMENT = ${nextId}`);
    console.log(`✅ Reset AUTO_INCREMENT to ${nextId}`);

    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Enabled foreign key checks');
    console.log('--- Re-indexing Complete ---');

  } catch (error) {
    console.error('❌ Re-indexing failed:', error);
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
  } finally {
    await connection.end();
  }
}

reindexStudents();
