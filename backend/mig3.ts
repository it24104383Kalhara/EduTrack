import pool from './src/config/db';

async function run() {
    try {
        await pool.query('ALTER TABLE sports_memberships ADD COLUMN student_name VARCHAR(150) NULL');
        console.log('Added student_name to sports_memberships');
    } catch (e) { }

    await pool.end();
}

run();
