const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkPasswords() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'ishani',
    database: process.env.DB_NAME || 'edutrack'
  });
  
  try {
    console.log('🔍 Checking user passwords...');
    
    const [users] = await connection.execute('SELECT id, username, email, role, status, password_hash FROM users');
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.username} (${user.email})`);
      console.log(`   Role: ${user.role}, Status: ${user.status}`);
      
      // Try some common passwords
      const commonPasswords = ['admin', 'password', '123456', 'admin123', user.username];
      
      for (const pwd of commonPasswords) {
        try {
          const isMatch = await bcrypt.compare(pwd, user.password_hash);
          if (isMatch) {
            console.log(`   ✅ Password found: "${pwd}"`);
            break;
          }
        } catch (error) {
          // Continue trying other passwords
        }
      }
    }
    
    console.log('\n💡 If no password worked, you can:');
    console.log('   1. Use the "Reset Password" feature if available');
    console.log('   2. Create a new admin account with a known password');
    console.log('   3. Update the password directly in the database');
    
  } catch (error) {
    console.error('❌ Error checking passwords:', error);
  } finally {
    await connection.end();
  }
}

checkPasswords();
