const mysql = require('mysql2/promise');

async function reindexUsers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'ishani',
    database: 'edutrack'
  });

  try {
    console.log('--- Starting User Re-indexing ---');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    console.log('✅ Disabled foreign key checks');

    // Get all users sorted by current ID
    const [users] = await connection.execute('SELECT id FROM users ORDER BY id ASC');
    console.log(`📊 Found ${users.length} users to re-index.`);

    for (let i = 0; i < users.length; i++) {
        const oldId = users[i].id;
        const newId = i + 1;

        if (oldId === newId) continue;

        console.log(`🔄 Updating user ${oldId} -> ${newId}`);

        // Update main table
        await connection.execute('UPDATE users SET id = ? WHERE id = ?', [newId, oldId]);

        // Update related tables
        // Based on previous check: teachers (user_id), grades (teacher_id)
        await connection.execute('UPDATE teachers SET user_id = ? WHERE user_id = ?', [newId, oldId]);
        await connection.execute('UPDATE grades SET teacher_id = ? WHERE teacher_id = ?', [newId, oldId]);
    }

    // Reset auto-increment
    const nextId = users.length + 1;
    await connection.execute(`ALTER TABLE users AUTO_INCREMENT = ${nextId}`);
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

reindexUsers();
