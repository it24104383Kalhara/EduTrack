const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'ishani',
    database: process.env.DB_NAME || 'edutrack'
  });
  
  try {
    console.log('🔍 Checking existing users...');
    
    const [users] = await connection.execute('SELECT id, username, email, role, status FROM users');
    console.log('Existing users:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role}, Status: ${user.status}`);
    });
    
    if (users.length === 0) {
      console.log('❌ No users found. You need to register first.');
      console.log('💡 To create an admin account, you can register via the frontend or use a direct script.');
    } else {
      console.log(`✅ Found ${users.length} user(s)`);
      
      const approvedUsers = users.filter(u => u.status === 'approved');
      if (approvedUsers.length === 0) {
        console.log('⚠️  No approved users found. All accounts are pending approval.');
        console.log('💡 You need an admin to approve the accounts, or create an admin account directly.');
      } else {
        console.log(`✅ Found ${approvedUsers.length} approved user(s) - you can log in with these credentials.`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await connection.end();
  }
}

checkUsers();
