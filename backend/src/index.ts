import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import crypto from 'crypto';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── MySQL Connection Pool ────────────────────────────────────────────────────
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edutrack_transport',
    waitForConnections: true,
    connectionLimit: 10,
});

// ── Auto-create tables on startup ───────────────────────────────────────────
async function initDB() {
    const conn = await pool.getConnection();
    try {
        await conn.execute(`
            CREATE TABLE IF NOT EXISTS drivers (
                driver_id      INT AUTO_INCREMENT PRIMARY KEY,
                first_name     VARCHAR(100) NOT NULL,
                last_name      VARCHAR(100) NOT NULL,
                phone          VARCHAR(10)  NOT NULL,
                nic_number     VARCHAR(12)  NOT NULL,
                license_number VARCHAR(50)  DEFAULT NULL,
                bus_plate      VARCHAR(20)  DEFAULT NULL,
                bus_number     VARCHAR(20)  DEFAULT NULL,
                username       VARCHAR(50)  UNIQUE NOT NULL,
                password_hash  VARCHAR(255) NOT NULL,
                status         VARCHAR(20)  DEFAULT 'active',
                created_at     DATETIME     DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('[DB] drivers table ready');
    } finally {
        conn.release();
    }
}

initDB().catch(err => console.error('[DB] init error:', err.message));

// Simple SHA-256 password hash (for production replace with bcrypt)
function hashPassword(plain: string): string {
    return crypto.createHash('sha256').update(plain).digest('hex');
}

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
    res.json({ status: 'EduTrack Backend is running!' });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/drivers/register
// Body: { first_name, last_name, phone, nic_number, bus_plate, bus_number, username, password }
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/drivers/register', async (req, res) => {
    const {
        first_name, last_name, phone, nic_number,
        bus_plate, bus_number, username, password,
    } = req.body as Record<string, string>;

    // ── Server-side validation ──────────────────────────────────────────────
    if (!first_name || !last_name)
        return res.status(400).json({ message: 'First name and last name are required.' });

    if (!/^\d{10}$/.test(phone))
        return res.status(400).json({ message: 'Phone must be exactly 10 digits.' });

    if (!/^(\d{9}[Vv]|\d{12})$/.test(nic_number))
        return res.status(400).json({ message: 'NIC must be 9 digits + V/v or exactly 12 digits.' });

    if (!username || !password)
        return res.status(400).json({ message: 'Username and password are required.' });

    if (password.length < 6)
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    try {
        const password_hash = hashPassword(password);
        await pool.execute(
            `INSERT INTO drivers
             (first_name, last_name, phone, nic_number, bus_plate, bus_number, username, password_hash)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [first_name, last_name, phone, nic_number, bus_plate || '', bus_number || '', username, password_hash],
        );
        return res.status(201).json({ message: 'Driver registered successfully.' });
    } catch (err: unknown) {
        const e = err as { code?: string };
        if (e.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ message: 'Username already taken. Choose another.' });
        console.error('[register]', err);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/drivers
// Returns all registered drivers (passwords excluded)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/drivers', async (_req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT driver_id, first_name, last_name, phone, nic_number,
                    bus_plate, bus_number, username, status, created_at
             FROM drivers ORDER BY created_at DESC`,
        );
        return res.json(rows);
    } catch (err) {
        console.error('[get drivers]', err);
        return res.status(500).json({ message: 'Server error.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
