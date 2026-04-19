const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'navodya@2004',
  database: process.env.DB_NAME || 'edutrack_hostel'
};

async function viewDatabase() {
  let connection;
  
  try {
    console.log('🔗 Connecting to MySQL database...');
    console.log(`📊 Database: ${dbConfig.database}`);
    console.log(`👤 User: ${dbConfig.user}`);
    console.log(`🏠 Host: ${dbConfig.host}`);
    console.log('');

    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL successfully!');
    console.log('');

    // Show tables
    console.log('📋 Available Tables:');
    const [tables] = await connection.execute('SHOW TABLES');
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`  ${index + 1}. ${tableName}`);
    });
    console.log('');

    // Show table contents
    const tableNames = tables.map(table => Object.values(table)[0]);
    
    for (const tableName of tableNames) {
      console.log(`📄 Table: ${tableName}`);
      console.log('─'.repeat(50));
      
      try {
        // Get table structure
        const [structure] = await connection.execute(`DESCRIBE ${tableName}`);
        console.log('🏗️  Structure:');
        structure.forEach(column => {
          console.log(`  • ${column.Field} (${column.Type}) ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key ? 'KEY' : ''}`);
        });
        console.log('');
        
        // Get table data
        const [rows] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 10`);
        
        if (rows.length > 0) {
          console.log(`📊 Sample Data (first 10 rows):`);
          console.table(rows);
        } else {
          console.log('📊 No data in this table');
        }
        
        // Get row count
        const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`📈 Total Records: ${count[0].count}`);
        console.log('');
        console.log('='.repeat(60));
        console.log('');
        
      } catch (error) {
        console.error(`❌ Error viewing table ${tableName}:`, error.message);
        console.log('');
      }
    }

    // Show summary statistics
    console.log('📈 Database Summary:');
    console.log('─'.repeat(50));
    
    try {
      const [roomStats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_rooms,
          SUM(current_occupancy) as total_occupancy,
          SUM(capacity) as total_capacity
        FROM rooms
      `);
      
      const [studentStats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_students,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_students,
          COUNT(CASE WHEN assigned_room IS NOT NULL THEN 1 END) as assigned_students
        FROM students
      `);
      
      const [paymentStats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_payments,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_payments,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
          COUNT(CASE WHEN status = 'pending' AND due_date < CURDATE() THEN 1 END) as overdue_payments,
          COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_collected
        FROM payments
      `);
      
      console.log('🏠 Rooms:');
      console.log(`  • Total Rooms: ${roomStats[0].total_rooms}`);
      console.log(`  • Total Capacity: ${roomStats[0].total_capacity}`);
      console.log(`  • Current Occupancy: ${roomStats[0].total_occupancy}`);
      console.log(`  • Available Spaces: ${roomStats[0].total_capacity - roomStats[0].total_occupancy}`);
      console.log('');
      
      console.log('👥 Students:');
      console.log(`  • Total Students: ${studentStats[0].total_students}`);
      console.log(`  • Active Students: ${studentStats[0].active_students}`);
      console.log(`  • Assigned to Rooms: ${studentStats[0].assigned_students}`);
      console.log('');
      
      console.log('💳 Payments:');
      console.log(`  • Total Payments: ${paymentStats[0].total_payments}`);
      console.log(`  • Paid Payments: ${paymentStats[0].paid_payments}`);
      console.log(`  • Pending Payments: ${paymentStats[0].pending_payments}`);
      console.log(`  • Overdue Payments: ${paymentStats[0].overdue_payments}`);
      console.log(`  • Total Collected: $${paymentStats[0].total_collected.toLocaleString()}`);
      console.log('');
      
    } catch (error) {
      console.error('❌ Error generating summary:', error.message);
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('  1. Make sure MySQL is running');
    console.log('  2. Check your credentials in .env file');
    console.log('  3. Verify database name: edutrack_hostel');
    console.log('  4. Try: mysql -u root -pnavodya@2004');
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Interactive menu
async function showMenu() {
  console.log('🗄️ EduTrack MySQL Database Viewer');
  console.log('='.repeat(40));
  console.log('1. View all tables and data');
  console.log('2. View rooms only');
  console.log('3. View students only');
  console.log('4. View payments only');
  console.log('5. View summary statistics');
  console.log('6. Exit');
  console.log('');
  
  // For now, just run full view
  await viewDatabase();
}

// Run the viewer
if (require.main === module) {
  showMenu();
}

module.exports = { viewDatabase };
