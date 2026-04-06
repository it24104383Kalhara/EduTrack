import pool from './src/config/db';

(async () => {
    try {
        await pool.query("ALTER TABLE sports_achievements ADD COLUMN type ENUM('Match_Award','Season_Award','Special_Recognition','Participation','Attendance') NOT NULL DEFAULT 'Participation'");
        console.log('Added type to sports_achievements');
    } catch(e: any) { console.log('type:', e.message); }

    try {
        await pool.query("ALTER TABLE sports_achievements MODIFY COLUMN merit_points DECIMAL(8,2) NOT NULL DEFAULT 0");
        console.log('Modified merit_points column');
    } catch(e: any) { console.log('merit:', e.message); }

    process.exit(0);
})();
