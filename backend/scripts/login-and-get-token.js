const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function loginAndGetToken() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'ishani',
    database: process.env.DB_NAME || 'edutrack'
  });
  
  try {
    console.log('🔑 Logging in admin user...');
    
    const username = 'admin';
    const password = 'admin123';
    const JWT_SECRET = process.env.JWT_SECRET || 'edutrack_secret_key_2026';
    
    // Find user
    const [users] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
    
    if (users.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = users[0];
    
    // Check status
    if (user.status !== 'approved') {
      console.log('❌ Account not approved. Status:', user.status);
      return;
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      console.log('❌ Invalid password');
      return;
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('✅ Login successful!');
    console.log('\n📋 Login Details:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    
    console.log('\n🎫 JWT Token:');
    console.log(token);
    
    console.log('\n📝 Instructions:');
    console.log('1. Go to the frontend application');
    console.log('2. Log in with:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log('3. Once logged in, you can create subjects');
    
    console.log('\n🔧 For testing with curl:');
    console.log(`curl -X POST http://localhost:5005/api/subjects -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" -d '{"name":"Test Subject","code":"TEST","grades":["6","7"],"type":"6-11","category":"Test","is_optional":true}'`);
    
  } catch (error) {
    console.error('❌ Login error:', error);
  } finally {
    await connection.end();
  }
}

loginAndGetToken();
