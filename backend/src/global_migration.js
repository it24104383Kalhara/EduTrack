const mysql = require('mysql2');
require('dotenv').config();

const conn = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
});

conn.connect((err) => {
    if (err) {
        console.log('CONN_ERROR: ' + err.message);
        process.exit(1);
    }
    
    conn.query('SHOW DATABASES', (err, dbRows) => {
        if (err) {
            console.log('SHOW_DATABASES_ERROR: ' + err.message);
            conn.end();
            process.exit(1);
        }
        
        let dbs = dbRows.map(row => row.Database).filter(db => !['information_schema', 'mysql', 'performance_schema', 'sys'].includes(db));
        
        let completedDbs = 0;
        
        dbs.forEach(dbName => {
            conn.query(`USE \`${dbName}\``, (err) => {
                if (err) {
                    completedDbs++;
                    if (completedDbs === dbs.length) { conn.end(); process.exit(0); }
                    return;
                }
                
                conn.query('SHOW TABLES', (err, tableRows) => {
                    if (err) {
                        completedDbs++;
                        if (completedDbs === dbs.length) { conn.end(); process.exit(0); }
                        return;
                    }
                    
                    let tables = tableRows.map(row => Object.values(row)[0]);
                    if (tables.includes('email_logs')) {
                        console.log(`Found email_logs in ${dbName}. Attempting to drop columns...`);
                        conn.query(`ALTER TABLE email_logs DROP COLUMN subject`, (err) => {
                            if (err) console.log(`[${dbName}] subject drop ERROR: ${err.message}`);
                            else console.log(`[${dbName}] subject drop SUCCESS`);
                            
                            conn.query(`ALTER TABLE email_logs DROP COLUMN message`, (err) => {
                                if (err) console.log(`[${dbName}] message drop ERROR: ${err.message}`);
                                else console.log(`[${dbName}] message drop SUCCESS`);
                                
                                completedDbs++;
                                if (completedDbs === dbs.length) { conn.end(); process.exit(0); }
                            });
                        });
                    } else if (tables.includes('email_log')) {
                        console.log(`Found email_log (singular) in ${dbName}. Attempting to drop columns...`);
                         conn.query(`ALTER TABLE email_log DROP COLUMN subject`, (err) => {
                            if (err) console.log(`[${dbName}] subject drop ERROR: ${err.message}`);
                            else console.log(`[${dbName}] subject drop SUCCESS`);
                            
                            conn.query(`ALTER TABLE email_log DROP COLUMN message`, (err) => {
                                if (err) console.log(`[${dbName}] message drop ERROR: ${err.message}`);
                                else console.log(`[${dbName}] message drop SUCCESS`);
                                
                                completedDbs++;
                                if (completedDbs === dbs.length) { conn.end(); process.exit(0); }
                            });
                        });
                    } else {
                        completedDbs++;
                        if (completedDbs === dbs.length) { conn.end(); process.exit(0); }
                    }
                });
            });
        });
    });
});
