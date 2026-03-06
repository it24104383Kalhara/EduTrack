import pool from './src/config/db';

async function run() {
    try {
        console.log('Altering tables...');

        await pool.query('ALTER TABLE sports_memberships ADD COLUMN grade VARCHAR(20) NULL');
        console.log('Added grade to sports_memberships');
    } catch (e) { }

    try {
        await pool.query('ALTER TABLE sports_memberships ADD COLUMN class_teacher_name VARCHAR(100) NULL');
        console.log('Added class_teacher_name to sports_memberships');
    } catch (e) { }

    try {
        await pool.query('ALTER TABLE sports_attendance_reports ADD COLUMN report_details TEXT NULL');
        console.log('Added report_details to sports_attendance_reports');
    } catch (e) { }

    await pool.end();
}

run();
