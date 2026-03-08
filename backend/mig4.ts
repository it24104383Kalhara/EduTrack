import pool from './src/config/db';

async function generateInventoryReserveTable() {
    try {
        console.log('Connecting to db...');
        const connection = await pool.getConnection();

        console.log('Creating table sports_inventory_reserved...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS sports_inventory_reserved (
              id INT AUTO_INCREMENT PRIMARY KEY,
              item_id INT NOT NULL,
              reserve_student_name VARCHAR(255) NOT NULL,
              class_teacher VARCHAR(255) NOT NULL,
              class_grade VARCHAR(50) NOT NULL,
              reserve_start_time DATETIME NOT NULL,
              reserve_end_time DATETIME NOT NULL,
              reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              returned_at TIMESTAMP NULL,
              return_condition ENUM('New', 'Good', 'Fair', 'Poor', 'Broken') NULL,
              status ENUM('Reserved', 'Returned', 'Cancelled') DEFAULT 'Reserved',
              FOREIGN KEY (item_id) REFERENCES sports_inventory(id) ON DELETE CASCADE
            )
        `);
        console.log('Table sports_inventory_reserved created seamlessly');

        connection.release();
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

generateInventoryReserveTable();
