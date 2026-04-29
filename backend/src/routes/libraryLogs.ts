import { Router } from "express";
import db from "../config/db"; // your MySQL connection

const router = Router();

// GET all library entry logs
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT l.log_id, l.student_id, s.name, l.entry_time, l.exit_time
      FROM library_entry_logs l
      JOIN students s ON l.student_id = s.student_id
      ORDER BY l.entry_time DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch library entry logs" });
  }
});

export default router;