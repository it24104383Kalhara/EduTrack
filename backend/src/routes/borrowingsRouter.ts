import { Router } from "express";
import type { OkPacket } from "mysql2";
import db from "../config/db";

const router = Router();

// GET all borrowings
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT b.*, s.name AS student_name, bc.copy_id
      FROM borrowings b
      JOIN students s ON b.student_id = s.student_id
      JOIN book_copies bc ON b.copy_id = bc.copy_id
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching borrowings" });
  }
});

// POST new borrowing
router.post("/", async (req, res) => {
  const { student_id, copy_id, borrow_date, due_date } = req.body;

  try {
    const [result] = await db.query<OkPacket>(
      `INSERT INTO borrowings 
      (student_id, copy_id, borrow_date, due_date)
      VALUES (?, ?, ?, ?)`,
      [student_id, copy_id, borrow_date, due_date]
    );

    res.json({ message: "Borrowing recorded ✅", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating borrowing" });
  }
});

export default router;