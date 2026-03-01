const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugGradeQuery() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'edutrack'
  });

  try {
    console.log('🔍 Debugging Grade Query...\n');
    
    // Test the problematic query from GradeModel.findAll()
    const query = `
      SELECT 
        g.id,
        g.grade,
        g.grade_part,
        g.created_at,
        g.updated_at,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', sa.student_id,
              'first_name', SUBSTRING_INDEX(sa.student_name, ' ', 1),
              'last_name', SUBSTRING_INDEX(sa.student_name, ' ', -1),
              'parent_phone', '',
              'assigned_at', sa.assigned_at
            )
          )
          FROM student_assignment sa
          WHERE sa.grade = g.grade AND sa.section = g.grade_part
        ) as students
      FROM grades g
      ORDER BY g.grade, g.grade_part
    `;
    
    console.log('📝 Testing query...');
    console.log(query);
    
    try {
      const [rows] = await connection.execute(query);
      console.log('✅ Query successful!');
      console.table(rows);
    } catch (queryError) {
      console.log('❌ Query failed:', queryError.message);
      
      // Try a simpler query first
      console.log('\n🔄 Testing simpler query...');
      const simpleQuery = 'SELECT * FROM grades ORDER BY grade, grade_part';
      try {
        const [simpleRows] = await connection.execute(simpleQuery);
        console.log('✅ Simple query works:');
        console.table(simpleRows);
      } catch (simpleError) {
        console.log('❌ Even simple query failed:', simpleError.message);
      }
      
      // Test the subquery separately
      console.log('\n🔄 Testing subquery...');
      const subQuery = `
        SELECT 
          sa.student_id,
          sa.student_name,
          sa.grade,
          sa.section,
          sa.assigned_at
        FROM student_assignment sa
        WHERE sa.grade = 6 AND sa.section = 'A'
      `;
      try {
        const [subRows] = await connection.execute(subQuery);
        console.log('✅ Subquery works:');
        console.table(subRows);
      } catch (subError) {
        console.log('❌ Subquery failed:', subError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await connection.end();
  }
}

debugGradeQuery();
