import pool from './src/config/db';
import { RowDataPacket } from 'mysql2';

(async () => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('DESCRIBE sports_achievements');
        console.log(JSON.stringify(rows, null, 2));
    } catch(e: any) { console.log('error:', e.message); }
    process.exit(0);
})();
