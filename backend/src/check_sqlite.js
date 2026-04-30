const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbFiles = ['backend/src/hostel.db', 'backend/src/hostel_v2.db'];

dbFiles.forEach(dbFile => {
    const fullPath = path.join('c:/Users/USER/OneDrive/Desktop/EduTrack/EduTrack/', dbFile);
    const db = new sqlite3.Database(fullPath, (err) => {
        if (err) {
            console.log(`Error opening ${dbFile}: ${err.message}`);
            return;
        }
        db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
            if (err) {
                console.log(`Error reading tables from ${dbFile}: ${err.message}`);
                return;
            }
            console.log(`Tables in ${dbFile}:`, tables.map(t => t.name));
            
            tables.forEach(t => {
                if (t.name === 'email_logs' || t.name === 'email_log') {
                   db.all(`PRAGMA table_info(${t.name})`, (err, columns) => {
                       console.log(`Columns in ${dbFile} -> ${t.name}:`, columns.map(c => c.name));
                   });
                }
            });
        });
    });
});
