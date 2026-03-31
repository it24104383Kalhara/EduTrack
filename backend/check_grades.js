const mysql = require('mysql2/promise');

async function checkGrades() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root', // assuming default or standard setup
    password: 'ishani',
    database: 'edutrack' // from schemas
  });

  const [rows] = await connection.execute('SELECT DISTINCT grade_part FROM grades WHERE grade IN (12, 13)');
  console.log(rows);
  await connection.end();
}

checkGrades().catch(console.error);
