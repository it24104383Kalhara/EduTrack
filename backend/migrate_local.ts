import pool from './src/config/db';

(async () => {
    console.log('Starting migration...');
    const sqls = [
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
      `CREATE TABLE IF NOT EXISTS sports_match_participants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        match_id INT NOT NULL,
        student_id INT NOT NULL,
        UNIQUE KEY uq_match_student (match_id, student_id)
      )`,
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
      `ALTER TABLE sports_matches ADD COLUMN IF NOT EXISTS level ENUM('School','Zonal','District','Provincial','National') NOT NULL DEFAULT 'School'`
    ];

    for (const sql of sqls) {
        try {
            await pool.query(sql);
            console.log('OK:', sql.trim().slice(0, 50));
        } catch (e: any) {
            console.log('SKIP:', e.message);
        }
    }
    console.log('Migration done.');
    process.exit(0);
})();
