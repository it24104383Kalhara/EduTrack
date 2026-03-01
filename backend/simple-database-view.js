// SIMPLE DATABASE VIEWER - This will work!

const mysql = require('mysql2/promise');

async function viewDatabase() {
    let connection;
    
    try {
        console.log('🔗 Connecting to database...');
        
        // Connect to database
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'ishani',
            database: 'edutrack'
        });

        console.log('✅ CONNECTED SUCCESSFULLY!');
        console.log('Database: edutrack');
        console.log('User: root');
        console.log('Host: localhost\n');

        // Show tables
        console.log('📋 Tables in database:');
        const [tables] = await connection.execute('SHOW TABLES');
        tables.forEach((table, index) => {
            const tableName = Object.values(table)[0];
            console.log(`   ${index + 1}. ${tableName}`);
        });
        console.log('');

        // Show student_assignments data
        console.log('📚 Student Assignments Data:');
        console.log('================================');
        
        const [assignments] = await connection.execute('SELECT * FROM student_assignments');
        
        if (assignments.length === 0) {
            console.log('❌ No data found in student_assignments table');
        } else {
            console.log(`Found ${assignments.length} records:\n`);
            
            assignments.forEach((row, index) => {
                console.log(`Record ${index + 1}:`);
                console.log(`  ID: ${row.id}`);
                console.log(`  Grade ID: ${row.grade_id}`);
                console.log(`  Student ID: ${row.student_id}`);
                console.log(`  Assigned At: ${row.assigned_at}`);
                console.log(`  Updated At: ${row.updated_at}`);
                console.log('');
            });
        }

        // Show complete view with names
        console.log('👥 Complete View with Student Names:');
        console.log('=====================================');
        
        const [completeView] = await connection.execute(`
            SELECT 
                sa.student_id,
                s.first_name,
                s.last_name,
                g.grade,
                g.grade_part,
                sa.assigned_at,
                sa.updated_at
            FROM student_assignments sa
            JOIN students s ON sa.student_id = s.id
            JOIN grades g ON sa.grade_id = g.id
            ORDER BY g.grade, g.grade_part
        `);
        
        completeView.forEach((row, index) => {
            console.log(`${index + 1}. Student ID: ${row.student_id}`);
            console.log(`   Name: ${row.first_name} ${row.last_name}`);
            console.log(`   Grade: ${row.grade}-${row.grade_part}`);
            console.log(`   Assigned: ${row.assigned_at}`);
            console.log(`   Updated: ${row.updated_at}`);
            console.log('');
        });

        // Create a simple text file with the data
        const fs = require('fs');
        let report = 'EDUTRACK DATABASE REPORT\n';
        report += 'Generated: ' + new Date().toLocaleString() + '\n\n';
        report += 'STUDENT ASSIGNMENTS:\n';
        report += '==================\n\n';
        
        completeView.forEach((row, index) => {
            report += `${index + 1}. ${row.first_name} ${row.last_name}\n`;
            report += `   Student ID: ${row.student_id}\n`;
            report += `   Grade: ${row.grade}-${row.grade_part}\n`;
            report += `   Assigned: ${row.assigned_at}\n`;
            report += `   Updated: ${row.updated_at}\n\n`;
        });
        
        fs.writeFileSync('database-report.txt', report);
        console.log('📄 Report saved to: database-report.txt');

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.log('\n🔧 SOLUTIONS:');
        console.log('1. Make sure MySQL is running');
        console.log('2. Try: mysql -u root -pishani edutrack');
        console.log('3. Check if MySQL service is started');
        console.log('4. Verify database exists: CREATE DATABASE edutrack;');
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✅ Connection closed');
        }
    }
}

viewDatabase();
