const mysql = require('mysql2/promise');
require('dotenv').config();
(async () => {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      ssl: { rejectUnauthorized: false },
      connectTimeout: 20000
    });
    console.log('Connected!');

    const sqls = [
      // Create sports_matches if not exists
      `CREATE TABLE IF NOT EXISTS sports_matches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        activity_id INT NOT NULL,
        date DATE NOT NULL,
        opponent VARCHAR(255) NOT NULL,
        result ENUM('Won','Lost','Draw','Participation') NOT NULL DEFAULT 'Won',
        level ENUM('School','Zonal','District','Provincial','National') NOT NULL DEFAULT 'School',
        score_team INT NULL,
        score_opponent INT NULL,
        location VARCHAR(255) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      // Create sports_achievements if not exists
      `CREATE TABLE IF NOT EXISTS sports_achievements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        activity_id INT NULL,
        match_id INT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        date DATE NOT NULL,
        merit_points DECIMAL(8,2) NOT NULL DEFAULT 0,
        type ENUM('Match_Award','Season_Award','Special_Recognition','Participation','Attendance') NOT NULL DEFAULT 'Participation',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      // Create participants table
      `CREATE TABLE IF NOT EXISTS sports_match_participants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        match_id INT NOT NULL,
        student_id INT NOT NULL,
        UNIQUE KEY uq_match_student (match_id, student_id)
      )`,
      // Add level column if sports_matches already existed without it
      `ALTER TABLE sports_matches ADD COLUMN IF NOT EXISTS level ENUM('School','Zonal','District','Provincial','National') NOT NULL DEFAULT 'School'`,
    ];

    for (const sql of sqls) {
      try {
        await conn.query(sql);
        console.log('OK:', sql.trim().slice(0, 60));
      } catch (e) {
        console.log('SKIP:', e.message.slice(0, 100));
      }
    }
    console.log('Migration complete!');
  } catch (e) {
    console.error('Connection error:', e.message);
  } finally {
    if (conn) await conn.end();
  }
})();
