const mysql = require('mysql2/promise');
require('dotenv').config();

async function diagnose() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: 'edutrack'
  });

  try {
    console.log('=== STEP 1: Check subjects table schema ===');
    const [cols] = await conn.execute('SHOW COLUMNS FROM subjects');
    cols.forEach(c => console.log(` ${c.Field}: ${c.Type}`));

    console.log('\n=== STEP 2: Check existing subjects count & sample ===');
    const [count] = await conn.execute('SELECT COUNT(*) as n FROM subjects');
    console.log('Total subjects:', count[0].n);
    const [sample] = await conn.execute('SELECT id, name, code, grades, stream, type FROM subjects LIMIT 5');
    sample.forEach(s => console.log(` id=${s.id} code=${s.code} grades=${JSON.stringify(s.grades)} stream=${s.stream}`));

    console.log('\n=== STEP 3: Check for duplicate code IT ===');
    const [codeCheck] = await conn.execute("SELECT id FROM subjects WHERE code = ?", ['IT']);
    console.log('Code IT exists:', codeCheck.length > 0 ? `YES (id=${codeCheck[0].id})` : 'NO');

    console.log('\n=== STEP 4: Run findDuplicate query for each grade ===');
    const grades = ['6','7','8','9','10','11'];
    for (const grade of grades) {
      try {
        const [rows] = await conn.execute(
          `SELECT id FROM subjects WHERE LOWER(name) = LOWER(?) AND JSON_CONTAINS(grades, ?) AND stream IS NULL`,
          ['IT', JSON.stringify([grade])]
        );
        console.log(` Grade ${grade}: ${rows.length} duplicates found`);
      } catch (err) {
        console.error(` Grade ${grade}: QUERY FAILED -> ${err.message}`);
      }
    }

    console.log('\n=== STEP 5: Test INSERT directly ===');
    try {
      const [ins] = await conn.execute(
        'INSERT INTO subjects (name, code, grades, stream, type, category, is_optional) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['IT_TEST', 'IT_TEST_CODE', JSON.stringify(['6','7','8','9','10','11']), null, '6-11', 'Category 1', 1]
      );
      console.log('INSERT success! insertId:', ins.insertId);
      await conn.execute('DELETE FROM subjects WHERE code = ?', ['IT_TEST_CODE']);
      console.log('Cleanup done.');
    } catch (err) {
      console.error('INSERT FAILED:', err.message);
    }

  } finally {
    await conn.end();
  }
}

diagnose().catch(console.error);
