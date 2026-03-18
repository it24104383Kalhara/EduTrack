import pool from './src/config/db';

(async () => {
    try {
        await pool.query("ALTER TABLE sports_matches ADD COLUMN level ENUM('School','Zonal','District','Provincial','National') NOT NULL DEFAULT 'School'");
        console.log('Added level to sports_matches');
    } catch(e: any) { console.log('level:', e.message); }

    process.exit(0);
})();
