import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "imesha543",
  database: "library_db",
  waitForConnections: true,
  connectionLimit: 10,
});

export default db;