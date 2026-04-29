import { Router } from "express";
import type { OkPacket, RowDataPacket } from "mysql2";
import db from "../config/db";

interface Student extends RowDataPacket {
  student_id: number;
  rfid_card_uid: string;
  registration_no: string;
  name: string;
  email: string;
  class: string;
  has_unpaid_fine: boolean;
}

interface BookCopy extends RowDataPacket {
  copy_id: number;
  book_id: number;
  rfid_uid: string;
  status: string;
  added_at: string;
  title: string;
  author: string;
  isbn: string;
  publisher: string;
}

interface Borrowing extends RowDataPacket {
  borrowing_id: number;
  student_id: number;
  copy_id: number;
  borrow_date: string;
  due_date: string;
  return_date?: string;
  fine_amount: number;
  status: string;
  student_name?: string;
  book_title?: string;
  book_author?: string;
}

const router = Router();

// =============================================================
// ESP32 MODE CONTROL
// =============================================================

router.get("/esp/mode", async (req, res) => {
  try {
    const [rows]: any = await db.query(
      "SELECT mode FROM esp_mode ORDER BY updated_at DESC LIMIT 1"
    );
    
    if (rows.length === 0) {
      return res.json({ mode: "student" });
    }
    
    return res.json({ mode: rows[0].mode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error" });
  }
});

router.post("/esp/mode", async (req, res) => {
  const { mode } = req.body;
  
  try {
    await db.query(
      "INSERT INTO esp_mode (mode, active, updated_at) VALUES (?, 1, NOW())",
      [mode]
    );
    
    console.log(`ESP32 mode changed to: ${mode}`);
    res.json({ message: `Mode set to ${mode}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error" });
  }
});

// =============================================================
// BORROWING
// =============================================================

router.get("/students/rfid/:rfid", async (req, res) => {
  const { rfid } = req.params;

  try {
    const [rows] = await db.query<Student[]>(
      `SELECT student_id, name, registration_no, has_unpaid_fine 
       FROM students WHERE rfid_card_uid = ?`,
      [rfid]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error" });
  }
});

router.get("/books/rfid/:rfid", async (req, res) => {
  const { rfid } = req.params;

  try {
    const [rows] = await db.query<BookCopy[]>(
      `SELECT bc.copy_id, bc.status, b.title, b.author
       FROM book_copies bc
       JOIN books b ON bc.book_id = b.book_id
       WHERE bc.rfid_uid = ?`,
      [rfid]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error" });
  }
});

// GET all borrowings
router.get("/borrowings", async (req, res) => {
  try {
    const [rows] = await db.query<Borrowing[]>(
      `SELECT b.*, s.name as student_name, bk.title as book_title
       FROM borrowings b
       JOIN students s ON b.student_id = s.student_id
       JOIN book_copies bc ON b.copy_id = bc.copy_id
       JOIN books bk ON bc.book_id = bk.book_id
       ORDER BY b.borrowing_id DESC`  // Changed from borrow_date to borrowing_id
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error" });
  }
});

// POST create borrowing (for ESP32)
router.post("/borrowings", async (req, res) => {
  const { student_id, copy_id, borrow_date, due_date } = req.body;

  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const [students] = await connection.query<Student[]>(
      "SELECT has_unpaid_fine FROM students WHERE student_id = ?",
      [student_id]
    );

    if (students[0]?.has_unpaid_fine) {
      await connection.rollback();
      return res.status(400).json({ message: "Student has unpaid fines" });
    }

    const [bookCopies] = await connection.query<BookCopy[]>(
      "SELECT status FROM book_copies WHERE copy_id = ?",
      [copy_id]
    );

    if (bookCopies[0]?.status !== "available") {
      await connection.rollback();
      return res.status(400).json({ message: "Book not available" });
    }

    const [result] = await connection.query<OkPacket>(
      `INSERT INTO borrowings (student_id, copy_id, borrow_date, due_date, status) 
       VALUES (?, ?, ?, ?, 'borrowed')`,
      [student_id, copy_id, borrow_date, due_date]
    );

    await connection.query(
      "UPDATE book_copies SET status = 'borrowed' WHERE copy_id = ?",
      [copy_id]
    );

    await connection.commit();

    res.json({ 
      message: "Book borrowed successfully",
      borrowing_id: result.insertId
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Error" });
  } finally {
    connection.release();
  }
});

// POST borrow a book (alternative endpoint)
router.post("/borrow", async (req, res) => {
  const { student_id, copy_id, borrow_date, due_date } = req.body;

  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const [students] = await connection.query<Student[]>(
      "SELECT has_unpaid_fine FROM students WHERE student_id = ?",
      [student_id]
    );

    if (students[0]?.has_unpaid_fine) {
      await connection.rollback();
      return res.status(400).json({ message: "Student has unpaid fines" });
    }

    const [bookCopies] = await connection.query<BookCopy[]>(
      "SELECT status FROM book_copies WHERE copy_id = ?",
      [copy_id]
    );

    if (bookCopies[0]?.status !== "available") {
      await connection.rollback();
      return res.status(400).json({ message: "Book not available" });
    }

    const [result] = await connection.query<OkPacket>(
      `INSERT INTO borrowings (student_id, copy_id, borrow_date, due_date, status) 
       VALUES (?, ?, ?, ?, 'borrowed')`,
      [student_id, copy_id, borrow_date, due_date]
    );

    await connection.query(
      "UPDATE book_copies SET status = 'borrowed' WHERE copy_id = ?",
      [copy_id]
    );

    await connection.commit();

    res.json({ 
      message: "Book borrowed successfully",
      borrowing_id: result.insertId
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Error" });
  } finally {
    connection.release();
  }
});

// =============================================================
// RETURNING
// =============================================================

// GET borrowing by book RFID (for ESP32 return flow)
router.get("/borrowings/by-book-rfid/:rfid", async (req, res) => {
  const { rfid } = req.params;

  try {
    const [rows] = await db.query<any[]>(
      `SELECT b.borrowing_id, b.copy_id, b.student_id, b.borrow_date, b.due_date,
              bk.title, bk.author, b.status
       FROM borrowings b
       JOIN book_copies bc ON b.copy_id = bc.copy_id
       JOIN books bk ON bc.book_id = bk.book_id
       WHERE bc.rfid_uid = ? AND b.return_date IS NULL`,
      [rfid]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No active borrowing found for this book" });
    }

    res.json({
      borrowing: {
        borrowing_id: rows[0].borrowing_id,
        copy_id: rows[0].copy_id,
        student_id: rows[0].student_id,
        borrow_date: rows[0].borrow_date,
        due_date: rows[0].due_date,
        status: rows[0].status
      },
      book: {
        title: rows[0].title,
        author: rows[0].author
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching borrowing" });
  }
});

// GET verify student borrowed this book
router.get("/borrowings/verify-return", async (req, res) => {
  const { book_rfid, student_rfid } = req.query;

  try {
    const [rows] = await db.query<any[]>(
      `SELECT b.borrowing_id, b.copy_id, s.name as student_name
       FROM borrowings b
       JOIN book_copies bc ON b.copy_id = bc.copy_id
       JOIN students s ON b.student_id = s.student_id
       WHERE bc.rfid_uid = ? AND s.rfid_card_uid = ? AND b.return_date IS NULL`,
      [book_rfid, student_rfid]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Student didn't borrow this book" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error" });
  }
});

// POST return a book
router.post("/return-book", async (req, res) => {
  const { borrowing_id, copy_id, return_date } = req.body;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE borrowings SET return_date = ?, status = 'returned' WHERE borrowing_id = ?`,
      [return_date, borrowing_id]
    );

    await connection.query(
      "UPDATE book_copies SET status = 'available' WHERE copy_id = ?",
      [copy_id]
    );

    await connection.commit();
    res.json({ message: "Book returned successfully" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Error" });
  } finally {
    connection.release();
  }
});

// Track last scanned card (for frontend display)
let lastScannedCard: { uid: string, name: string, type: string, timestamp: number } | null = null;

// GET last scanned card
router.get("/last-scan", async (req, res) => {
  res.json(lastScannedCard || { uid: null, name: null, type: null });
});

// POST update last scanned (called by ESP32 when scanning)
router.post("/last-scan", async (req, res) => {
  const { uid, name, type } = req.body;
  lastScannedCard = { uid, name, type, timestamp: Date.now() };
  res.json({ success: true });
});

export default router;