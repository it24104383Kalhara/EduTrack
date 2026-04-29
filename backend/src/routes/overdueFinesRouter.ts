import { Router } from "express";
import db from "../config/db";

const router = Router();

// =============================================================
// OVERDUE & FINES
// =============================================================

// GET all overdue borrowings with calculated fines
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, s.name as student_name, s.registration_no, bk.title as book_title
       FROM borrowings b
       JOIN students s ON b.student_id = s.student_id
       JOIN book_copies bc ON b.copy_id = bc.copy_id
       JOIN books bk ON bc.book_id = bk.book_id
       WHERE b.due_date < CURDATE() 
       AND b.return_date IS NULL
       AND b.status = 'borrowed'
       ORDER BY b.due_date ASC`
    );

    const overduesWithFines = (rows as any[]).map(borrowing => {
      const dueDate = new Date(borrowing.due_date);
      const today = new Date();
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const calculatedFine = daysOverdue * 10;
      
      return {
        ...borrowing,
        days_overdue: daysOverdue,
        calculated_fine: calculatedFine
      };
    });

    res.json(overduesWithFines);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching overdue borrowings" });
  }
});

// POST pay fine
router.post("/pay", async (req, res) => {
  const { borrowing_id, amount } = req.body;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Update borrowing: mark as returned, fine paid, set return date
    await connection.query(
      `UPDATE borrowings 
       SET fine_amount = ?, fine_paid = TRUE, return_date = CURDATE(), status = 'returned'
       WHERE borrowing_id = ?`,
      [amount, borrowing_id]
    );

    // Get student_id and copy_id
    const [borrowing] = await connection.query(
      "SELECT student_id, copy_id FROM borrowings WHERE borrowing_id = ?",
      [borrowing_id]
    );

    const student_id = (borrowing as any[])[0]?.student_id;
    const copy_id = (borrowing as any[])[0]?.copy_id;

    // Record the payment in fine_payments table
    await connection.query(
      `INSERT INTO fine_payments (student_id, borrowing_id, amount) 
       VALUES (?, ?, ?)`,
      [student_id, borrowing_id, amount]
    );

    // Update book copy status to available
    await connection.query(
      "UPDATE book_copies SET status = 'available' WHERE copy_id = ?",
      [copy_id]
    );

    // Check if student has any other unpaid fines
    const [unpaidFines] = await connection.query(
      `SELECT COUNT(*) as count FROM borrowings 
       WHERE student_id = ? AND fine_paid = FALSE AND fine_amount > 0`,
      [student_id]
    );

    // Update student's has_unpaid_fine flag
    if ((unpaidFines as any[])[0].count === 0) {
      await connection.query(
        "UPDATE students SET has_unpaid_fine = FALSE WHERE student_id = ?",
        [student_id]
      );
    }

    await connection.commit();
    res.json({ message: "Fine paid successfully" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Error processing fine payment" });
  } finally {
    connection.release();
  }
});

// GET fines for a specific student
router.get("/student/:student_id", async (req, res) => {
  const { student_id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT b.borrowing_id, b.due_date, b.fine_amount, b.fine_paid, 
              bk.title as book_title
       FROM borrowings b
       JOIN book_copies bc ON b.copy_id = bc.copy_id
       JOIN books bk ON bc.book_id = bk.book_id
       WHERE b.student_id = ? AND b.fine_amount > 0
       ORDER BY b.due_date DESC`,
      [student_id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching student fines" });
  }
});

export default router;