import pool from './src/config/db';

async function generateInventoryReserveTableQuantity() {
    try {
        console.log('Connecting to db...');
        const connection = await pool.getConnection();

        console.log('Adding quantity column to sports_inventory_reserved...');
        await connection.query(`
            ALTER TABLE sports_inventory_reserved ADD COLUMN quantity INT NOT NULL DEFAULT 1;
        `);
        console.log('Column added seamlessly');

        connection.release();
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

generateInventoryReserveTableQuantity();
