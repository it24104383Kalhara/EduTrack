import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const dbName = process.env.DB_NAME || 'edutrack_v2';

// Create pool WITHOUT a default database to avoid connection errors if DB doesn't exist yet
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'navodya@2004',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Mocking SQLite's API but providing MySQL's result structure
export const db = {
    run: (sql: string, params: any[] | any = [], callback?: (err: Error | null, result?: any) => void) => {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        pool.getConnection((err, conn) => {
            if (err) return callback ? callback(err) : null;
            conn.query(`USE \`${dbName}\``, (err) => {
                if (err) {
                    conn.release();
                    return callback ? callback(err) : null;
                }
                conn.query(sql, params, function(err, result: any) {
                    conn.release();
                    if (callback) {
                        callback.call({ 
                            lastID: result ? result.insertId : null, 
                            changes: result ? result.affectedRows : 0 
                        }, err, result);
                    }
                });
            });
        });
    },
    all: (sql: string, params: any[] | any = [], callback?: (err: Error | null, rows?: any[]) => void) => {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        pool.getConnection((err, conn) => {
            if (err) return callback ? callback(err) : null;
            conn.query(`USE \`${dbName}\``, (err) => {
                if (err) {
                    conn.release();
                    return callback ? callback(err) : null;
                }
                conn.query(sql, params, (err, rows: any) => {
                    conn.release();
                    if (callback) callback(err, rows);
                });
            });
        });
    },
    get: (sql: string, params: any[] | any = [], callback?: (err: Error | null, row?: any) => void) => {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        pool.getConnection((err, conn) => {
            if (err) return callback ? callback(err) : null;
            conn.query(`USE \`${dbName}\``, (err) => {
                if (err) {
                    conn.release();
                    return callback ? callback(err) : null;
                }
                conn.query(sql, params, (err, rows: any) => {
                    conn.release();
                    if (callback) callback(err, rows && rows[0]);
                });
            });
        });
    },
    prepare: (sql: string) => {
        return {
            run: (params: any[], callback?: (err: Error | null) => void) => {
                pool.getConnection((err, conn) => {
                    if (err) return callback ? callback(err) : null;
                    conn.query(`USE \`${dbName}\``, (err) => {
                        if (err) {
                            conn.release();
                            return callback ? callback(err) : null;
                        }
                        conn.query(sql, params, (err) => {
                            conn.release();
                            if (callback) callback(err);
                        });
                    });
                });
            },
            finalize: () => {}
        };
    },
    serialize: (fn: () => void) => {
        fn();
    }
};

const initDb = () => {
    const conn = mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'navodya@2004'
    });

    conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``, (err) => {
        if (err) {
            console.error('Error creating database:', err.message);
        } else {
            console.log(`Using database '${dbName}'.`);
            
            // Define tables with qualified names
            const queries = [
                `CREATE TABLE IF NOT EXISTS \`${dbName}\`.rooms (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    room_number VARCHAR(50) UNIQUE NOT NULL,
                    capacity INT DEFAULT 4,
                    occupied INT DEFAULT 0
                )`,
                `CREATE TABLE IF NOT EXISTS \`${dbName}\`.students (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    first_name VARCHAR(100) NOT NULL,
                    last_name VARCHAR(100) NOT NULL,
                    dob VARCHAR(50),
                    gender VARCHAR(20),
                    nationality VARCHAR(100),
                    religion VARCHAR(100),
                    ethnicity VARCHAR(100),
                    address TEXT,
                    parent_type VARCHAR(50),
                    parent_name VARCHAR(200),
                    parent_phone VARCHAR(20),
                    parent_email VARCHAR(100),
                    parent_gender VARCHAR(20),
                    parent_religion VARCHAR(100),
                    parent_ethnicity VARCHAR(100),
                    parent_nationality VARCHAR(100),
                    parent_address TEXT,
                    room_id INT,
                    rfid_tag VARCHAR(50) UNIQUE,
                    FOREIGN KEY(room_id) REFERENCES \`${dbName}\`.rooms(id) ON DELETE SET NULL
                )`,
                `CREATE TABLE IF NOT EXISTS \`${dbName}\`.payments (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    student_id INT,
                    amount DECIMAL(10, 2) NOT NULL,
                    due_date VARCHAR(50) NOT NULL,
                    status VARCHAR(20) DEFAULT 'pending',
                    FOREIGN KEY(student_id) REFERENCES \`${dbName}\`.students(id) ON DELETE CASCADE
                )`,
                `CREATE TABLE IF NOT EXISTS \`${dbName}\`.email_logs (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    student_id INT,
                    parent_email VARCHAR(100) NOT NULL,
                    email_type VARCHAR(50) NOT NULL,
                    status VARCHAR(20) DEFAULT 'sent',
                    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    error_message TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS \`${dbName}\`.attendance (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    student_id INT,
                    check_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    check_out TIMESTAMP NULL,
                    scan_date DATE DEFAULT (CURRENT_DATE),
                    FOREIGN KEY(student_id) REFERENCES \`${dbName}\`.students(id) ON DELETE CASCADE
                )`,
                `CREATE TABLE IF NOT EXISTS \`${dbName}\`.users (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`
            ];

            // Execute using naked connection to ensure path is correct
            let completed = 0;
            queries.forEach(q => {
                conn.query(q, (err) => {
                    if (err) console.error('Table init error:', err.message);
                    completed++;
                    
                    // Once all tables are initialized, seed rooms
                    if (completed === queries.length) {
                        conn.query(`SELECT COUNT(*) as count FROM \`${dbName}\`.rooms`, (err, rows: any) => {
                            if (!err && rows[0].count === 0) {
                                const roomsData = [];
                                for (let i = 1; i <= 15; i++) {
                                    roomsData.push([`Room-${i}`, 4]);
                                }
                                conn.query(`INSERT INTO \`${dbName}\`.rooms (room_number, capacity) VALUES ?`, [roomsData], (err) => {
                                    if (!err) console.log('15 rooms initialized.');
                                    conn.end();
                                });
                            } else {
                                conn.end();
                            }
                        });
                    }
                });
            });
        }
    });
};

initDb();
