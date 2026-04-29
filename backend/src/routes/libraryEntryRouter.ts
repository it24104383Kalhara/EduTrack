import express, { Request, Response } from "express";
import db from "../config/db";

const router = express.Router();

// ESP32 calls: GET /library/log?uid=XXXX
router.get("/log", async (req: Request, res: Response) => {
  const uid = req.query.uid as string;

  if (!uid) {
    return res.json({ status: "error", message: "No UID provided" });
  }

  try {
    // ── Step 1: Find student by RFID UID ──────────────────
    const [students]: any = await db.query(
      "SELECT student_id, name, has_unpaid_fine FROM students WHERE rfid_card_uid = ?",
      [uid]
    );

    if (students.length === 0) {
      console.log(`❌ Unknown card: ${uid}`);
      return res.json({ status: "unknown", message: "Unknown Card" });
    }

    const student   = students[0];
    const studentId = student.student_id;
    const name      = student.name;
    const hasFine   = student.has_unpaid_fine;

    // ── Step 2: Check for open log row (exit_time IS NULL) ─
    const [openLogs]: any = await db.query(
      `SELECT log_id FROM library_entry_logs 
       WHERE student_id = ? AND exit_time IS NULL 
       ORDER BY entry_time DESC LIMIT 1`,
      [studentId]
    );

    if (openLogs.length > 0) {
      // ── Open row found → fill exit_time ─────────────────
      const logId = openLogs[0].log_id;
      await db.query(
        "UPDATE library_entry_logs SET exit_time = NOW() WHERE log_id = ?",
        [logId]
      );
      console.log(`🚪 Exit logged: ${name}`);
      return res.json({ status: "exit", name, has_fine: hasFine });

    } else {
      // ── No open row → INSERT new entry ───────────────────
      await db.query(
        "INSERT INTO library_entry_logs (student_id, entry_time) VALUES (?, NOW())",
        [studentId]
      );
      console.log(`✅ Entry logged: ${name}${hasFine ? " ⚠️ HAS FINE" : ""}`);
      return res.json({ status: "entry", name, has_fine: hasFine });
    }

  } catch (error) {
    console.error("DB error:", error);
    return res.status(500).json({ status: "error", message: "Database error" });
  }
});

export default router;