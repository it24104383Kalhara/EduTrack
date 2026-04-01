const mysql = require('mysql2/promise');

async function convertSubjectIdsToIntegers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'ishani',
    database: 'edutrack'
  });

  try {
    console.log('--- Converting Subject IDs to Sequential Integers ---');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    console.log('✅ Disabled foreign key checks');

    // Get all subjects sorted by creation time
    const [subjects] = await connection.execute('SELECT id, name FROM subjects ORDER BY created_at ASC');
    console.log(`📊 Found ${subjects.length} subjects to convert.`);

    // 1. Drop constraints IF they exist
    console.log('🔗 Dropping existing foreign key constraints...');
    try { await connection.execute('ALTER TABLE student_subjects DROP FOREIGN KEY student_subjects_ibfk_2'); } catch(e) {}
    try { await connection.execute('ALTER TABLE marks DROP FOREIGN KEY marks_ibfk_2'); } catch(e) {}

    // 2. Clear out any previous attempt's temporary column
    try { await connection.execute('ALTER TABLE subjects DROP COLUMN new_id'); } catch(e) {}
    await connection.execute('ALTER TABLE subjects ADD COLUMN new_id INT');
    
    // 3. Update sequences
    for (let i = 0; i < subjects.length; i++) {
        const oldId = subjects[i].id;
        const newId = i + 1;
        console.log(`🔄 Mapping "${subjects[i].name}": ${oldId} -> ${newId}`);
        
        await connection.execute('UPDATE subjects SET new_id = ? WHERE id = ?', [newId, oldId]);
        await connection.execute('UPDATE student_subjects SET subject_id = ? WHERE subject_id = ?', [newId.toString(), oldId]);
        await connection.execute('UPDATE marks SET subject_id = ? WHERE subject_id = ?', [newId.toString(), oldId]);
    }

    // 4. Update column types
    console.log('🛠 Converting column types to INT...');
    await connection.execute('ALTER TABLE student_subjects MODIFY subject_id INT');
    await connection.execute('ALTER TABLE marks MODIFY subject_id INT');

    // 5. Replace ID column with INT
    await connection.execute('ALTER TABLE subjects DROP PRIMARY KEY');
    await connection.execute('ALTER TABLE subjects DROP COLUMN id');
    await connection.execute('ALTER TABLE subjects CHANGE COLUMN new_id id INT');
    await connection.execute('ALTER TABLE subjects ADD PRIMARY KEY (id)');
    await connection.execute('ALTER TABLE subjects MODIFY id INT AUTO_INCREMENT');
    await connection.execute(`ALTER TABLE subjects AUTO_INCREMENT = ${subjects.length + 1}`);

    // 6. Restore constraints
    console.log('🔗 Re-adding foreign key constraints...');
    await connection.execute('ALTER TABLE student_subjects ADD CONSTRAINT student_subjects_ibfk_2 FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE');
    await connection.execute('ALTER TABLE marks ADD CONSTRAINT marks_ibfk_2 FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE');

    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Success! Subject IDs are now integers starting from 1.');

  } catch (error) {
    console.error('❌ Error during conversion:', error.message);
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
  } finally {
    await connection.end();
  }
}

convertSubjectIdsToIntegers();
