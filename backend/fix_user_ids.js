const mysql = require('mysql2/promise');

async function fixUserIdsExplicitly() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'ishani',
    database: 'edutrack'
  });

  try {
    console.log('--- Fixing User IDs to Exact Sequence (1=admin, 2=ishani, 3=iresha) ---');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

    // Create a temporary mapping of what we want
    const desired = [
        { username: 'admin', newId: 1 },
        { username: 'ishani', newId: 2 },
        { username: 'iresha', newId: 3 }
    ];

    for (const user of desired) {
        // Find the current ID for this username
        const [rows] = await connection.execute('SELECT id FROM users WHERE username = ?', [user.username]);
        if (rows.length > 0) {
            const oldId = rows[0].id;
            const newId = user.newId;

            if (oldId !== newId) {
                console.log(`🔄 Moving ${user.username}: ${oldId} -> ${newId}`);
                
                // Update users table
                await connection.execute('UPDATE users SET id = ? WHERE id = ?', [newId, oldId]);
                
                // Update related tables
                await connection.execute('UPDATE teachers SET user_id = ? WHERE user_id = ?', [newId, oldId]);
                await connection.execute('UPDATE grades SET teacher_id = ? WHERE teacher_id = ?', [newId, oldId]);
            }
        }
    }

    await connection.execute('ALTER TABLE users AUTO_INCREMENT = 4');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Success! IDs are now admin=1, ishani=2, iresha=3.');

  } catch (error) {
    console.error('❌ Error:', error);
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
  } finally {
    await connection.end();
  }
}

fixUserIdsExplicitly();
