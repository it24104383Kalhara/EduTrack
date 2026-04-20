import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

/**
 * Integrated Database Setup Script
 * Correctly initializes both Academic and Sports modules
 */
export const setupDatabase = async () => {
    // Basic connection (without database selected yet)
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true, // Crucial for running the schema script
        ssl: process.env.DB_SSL === 'true' ? {
            rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
        } : undefined
    });

    try {
        const dbName = process.env.DB_NAME || 'edutrack';
        console.log(`🚀 Starting database setup for: ${dbName}...`);

        // 1. Create database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        await connection.query(`USE \`${dbName}\``);
        console.log(`✅ Database ${dbName} is ready.`);

        // 2. Read and execute the full schema
        const schemaPath = path.join(__dirname, '../../sql/full_schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            console.log('📄 Found full_schema.sql, executing...');
            await connection.query(schemaSql);
            console.log('✅ Integrated schema applied successfully.');
        } else {
            console.error('❌ Could not find full_schema.sql at', schemaPath);
            throw new Error('Schema file missing');
        }

        console.log('\n✨ Database setup completed successfully!');
        console.log('Integrated Modules:');
        console.log(' - Student Progress (Academics, Marks, Attendance)');
        console.log(' - Sport Management (Activities, Inventory, Facilities)');
        
    } catch (error) {
        console.error('\n❌ Database setup failed:', error);
        throw error;
    } finally {
        await connection.end();
    }
};

// Run setup if this file is executed directly
if (require.main === module) {
    setupDatabase()
        .then(() => {
            console.log('Setup finished.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Setup failed.');
            process.exit(1);
        });
}
