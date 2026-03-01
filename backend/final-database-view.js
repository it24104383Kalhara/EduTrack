// FINAL DATABASE VIEW - Shows exactly what you wanted
const mysql = require('mysql2/promise');

async function showFinalResult() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'ishani',
            database: 'edutrack'
        });

        console.log('🎉 FINAL RESULT - Updated student_assignments table');
        console.log('=====================================================\n');

        // Show the exact columns you wanted
        const [result] = await connection.execute(`
            SELECT 
                student_id,
                student_name,
                grade,
                section,
                assigned_at,
                updated_at
            FROM student_assignments
            ORDER BY grade, section, student_name
        `);

        console.log('✅ YOUR DATA IS NOW IN THE TABLE AS YOU REQUESTED:');
        console.log('Student ID | Student Name        | Grade | Section | Assigned At         | Updated At');
        console.log('------------|---------------------|-------|---------|---------------------|------------');
        
        result.forEach(row => {
            const studentId = row.student_id.toString().padEnd(11);
            const studentName = (row.student_name || '').padEnd(20);
            const grade = row.grade.toString().padEnd(6);
            const section = (row.section || '').padEnd(8);
            const assignedAt = new Date(row.assigned_at).toLocaleString();
            const updatedAt = new Date(row.updated_at).toLocaleString();
            
            console.log(`${studentId} | ${studentName} | ${grade} | ${section} | ${assignedAt} | ${updatedAt}`);
        });

        console.log('\n📋 TABLE STRUCTURE:');
        console.log('==================');
        
        const [structure] = await connection.execute('DESCRIBE student_assignments');
        structure.forEach(column => {
            console.log(`${column.Field} (${column.Type})`);
        });

        console.log('\n🔗 API ENDPOINT:');
        console.log('================');
        console.log('GET http://localhost:5000/api/grades/assignments');
        
        console.log('\n🌐 WEBSITE:');
        console.log('===========');
        console.log('Go to: http://localhost:5173/');
        console.log('Click: "📋 View All Assignments"');

        await connection.end();
        
        console.log('\n✅ SUCCESS! Your student_assignments table now contains:');
        console.log('   • Student ID');
        console.log('   • Student Name');
        console.log('   • Grade');
        console.log('   • Section');
        console.log('   • Assigned At');
        console.log('   • Updated At');
        console.log('\n🎯 All data is now stored directly in the student_assignments table!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

showFinalResult();
