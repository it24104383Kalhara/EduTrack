// Simple MySQL Connection Test
// This will help you connect to the database and see the data

const mysql = require('mysql2');

console.log('🔗 Attempting to connect to MySQL database...\n');

// Create connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'ishani',
  database: 'edutrack'
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Connection failed:', err.message);
    console.log('\n💡 Troubleshooting steps:');
    console.log('1. Make sure MySQL server is running');
    console.log('2. Check if username/password is correct (root/ishani)');
    console.log('3. Verify database name is "edutrack"');
    console.log('4. Check if MySQL is installed on your system');
    return;
  }

  console.log('✅ Successfully connected to MySQL database!');
  console.log('📊 Database: edutrack');
  console.log('👤 User: root');
  console.log('🌐 Host: localhost\n');

  // Show all tables
  connection.query('SHOW TABLES', (err, results) => {
    if (err) {
      console.error('❌ Error showing tables:', err.message);
      return;
    }

    console.log('📋 Available tables in edutrack database:');
    results.forEach((row, index) => {
      console.log(`   ${index + 1}. ${Object.values(row)[0]}`);
    });
    console.log('');

    // Show student_assignments data
    connection.query('SELECT * FROM student_assignments', (err, results) => {
      if (err) {
        console.error('❌ Error querying student_assignments:', err.message);
        return;
      }

      console.log('📚 Student Assignments Data:');
      console.log('=====================================');
      
      if (results.length === 0) {
        console.log('❌ No data found in student_assignments table');
      } else {
        console.log(`✅ Found ${results.length} records:\n`);
        
        // Display column headers
        const headers = Object.keys(results[0]);
        console.log(headers.join(' | '));
        console.log('-'.repeat(headers.join(' | ').length));
        
        // Display each row
        results.forEach(row => {
          const values = headers.map(header => {
            const value = row[header];
            if (value instanceof Date) {
              return value.toISOString().slice(0, 19).replace('T', ' ');
            }
            return value;
          });
          console.log(values.join(' | '));
        });
      }
      
      console.log('\n🎯 To see student names and grades, run this SQL:');
      console.log('SELECT sa.student_id, s.first_name, s.last_name, g.grade, g.grade_part,');
      console.log('sa.assigned_at, sa.updated_at FROM student_assignments sa');
      console.log('JOIN students s ON sa.student_id = s.id');
      console.log('JOIN grades g ON sa.grade_id = g.id;');

      // Close connection
      connection.end((err) => {
        if (err) {
          console.error('❌ Error closing connection:', err.message);
          return;
        }
        console.log('\n✅ Connection closed successfully');
        console.log('\n💡 You can now access this data through:');
        console.log('   1. MySQL Workbench');
        console.log('   2. phpMyAdmin');
        console.log('   3. Command line: mysql -u root -pishani edutrack');
        console.log('   4. Your website at http://localhost:5173');
      });
    });
  });
});
