// MySQL Setup Helper
const fs = require('fs');
const path = require('path');

console.log('🔧 MySQL Setup Helper');
console.log('====================\n');

console.log('📋 To connect your website to MySQL, follow these steps:\n');

console.log('1️⃣  Install MySQL if not already installed:');
console.log('   - Download from: https://dev.mysql.com/downloads/mysql/');
console.log('   - During installation, set a root password\n');

console.log('2️⃣  Update your .env file with your MySQL credentials:');
console.log('   - Open: backend/.env');
console.log('   - Set DB_PASSWORD to your MySQL root password');
console.log('   - Update DB_USER if you created a different user\n');

console.log('3️⃣  Create the database (optional - server will auto-create):');
console.log('   - Open MySQL Command Line Client');
console.log('   - Run: CREATE DATABASE edutrack_hostel;\n');

console.log('4️⃣  Start the MySQL server:');
console.log('   - Run: node mysql-server.js\n');

console.log('🔍 Example .env configuration:');
console.log('```\n');
console.log('DB_HOST=localhost');
console.log('DB_USER=root');
console.log('DB_PASSWORD=your_mysql_password');
console.log('DB_NAME=edutrack_hostel');
console.log('PORT=5005');
console.log('```\n');

console.log('🚀 After setup, your website will connect to MySQL and:');
console.log('   ✅ Store data persistently');
console.log('   ✅ Handle multiple users simultaneously');
console.log('   ✅ Support complex queries and relationships');
console.log('   ✅ Provide data backup and recovery\n');

// Check current .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('📄 Current .env file:');
  console.log(envContent);
} else {
  console.log('❌ .env file not found');
}

console.log('\n🎯 Next Steps:');
console.log('1. Install/configure MySQL');
console.log('2. Update .env with your credentials');
console.log('3. Run: node mysql-server.js');
console.log('4. Test the connection at: http://localhost:5005/api/test');
