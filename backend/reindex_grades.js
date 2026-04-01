const mysql = require('mysql2/promise');

async function reindexGrades() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'ishani',
    database: 'edutrack'
  });

  try {
    console.log('--- Starting Grade Re-indexing ---');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    console.log('✅ Disabled foreign key checks');

    // Get all grades sorted by their current ID
    const [grades] = await connection.execute('SELECT id FROM grades ORDER BY id ASC');
    console.log(`📊 Found ${grades.length} grades to re-index.`);

    for (let i = 0; i < grades.length; i++) {
        const oldId = grades[i].id;
        const newId = i + 1;

        if (oldId === newId) continue;

        console.log(`🔄 Updating grade ${oldId} -> ${newId}`);

        // Update main table
        await connection.execute('UPDATE grades SET id = ? WHERE id = ?', [newId, oldId]);

        // Update related tables
        const relatedTables = [
            'student_subjects',
            'student_assignment',
            'marks'
        ];

        for (const table of relatedTables) {
            await connection.execute(`UPDATE ${table} SET grade_id = ? WHERE grade_id = ?`, [newId, oldId]);
        }
    }

    // Reset auto-increment
    const nextId = grades.length + 1;
    await connection.execute(`ALTER TABLE grades AUTO_INCREMENT = ${nextId}`);
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

reindexGrades();
