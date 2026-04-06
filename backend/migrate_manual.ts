import pool from './src/config/db';

(async () => {
    try {
        await pool.query('ALTER TABLE sports_achievements ADD COLUMN match_id INT NULL AFTER activity_id');
        console.log('Added match_id to sports_achievements');
    } catch(e: any) { console.log('match_id:', e.message); }

    try {
        await pool.query("ALTER TABLE sports_achievements MODIFY COLUMN type ENUM('Match_Award','Season_Award','Special_Recognition','Participation','Attendance') NOT NULL DEFAULT 'Participation'");
        console.log('Modified type enum');
    } catch(e: any) { console.log('type:', e.message); }

    process.exit(0);
})();
