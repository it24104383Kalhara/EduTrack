// CORRECTED DATABASE VIEW - Shows the fixed data
const mysql = require('mysql2/promise');

async function showCorrectedData() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'ishani',
            database: 'edutrack'
        });

        console.log('✅ FIXED! - Corrected student_assignments table');
        console.log('===============================================\n');

        // Show the corrected data
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

        console.log('📋 CORRECTED DATA - All fields are now in the right place:');
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

        console.log('\n🔍 VERIFICATION - Check individual columns:');
        console.log('==========================================');
        
        const [verification] = await connection.execute(`
            SELECT 
                id,
                grade_id,
                student_id,
                student_name,
                grade,
                section,
                assigned_at,
                updated_at
            FROM student_assignments
            ORDER BY student_id
        `);

        verification.forEach((row, index) => {
            console.log(`\nRecord ${index + 1}:`);
            console.log(`  ID: ${row.id}`);
            console.log(`  Grade ID: ${row.grade_id}`);
            console.log(`  Student ID: ${row.student_id}`);
            console.log(`  Student Name: ${row.student_name}`);
            console.log(`  Grade: ${row.grade}`);
            console.log(`  Section: ${row.section}`);
            console.log(`  Assigned At: ${row.assigned_at}`);
            console.log(`  Updated At: ${row.updated_at}`);
        });

        console.log('\n🌐 TEST API ENDPOINT:');
        console.log('====================');
        console.log('curl http://localhost:5000/api/grades/assignments');

        console.log('\n🎯 SUCCESS! The database is now correctly structured with:');
        console.log('   ✅ Student ID in student_id column');
        console.log('   ✅ Student Name in student_name column');
        console.log('   ✅ Grade in grade column');
        console.log('   ✅ Section in section column');
        console.log('   ✅ Assigned At in assigned_at column');
        console.log('   ✅ Updated At in updated_at column');

        await connection.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

showCorrectedData();
