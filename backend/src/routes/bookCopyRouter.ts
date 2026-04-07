import { Router } from "express";
import db from "../config/db";

const router = Router();

// =============================================================
// BOOK COPY REGISTRATION
// =============================================================

// GET - ESP32 calls this when scanning RFID in copy mode
router.get("/copy", async (req, res) => {
  const uid = req.query.uid as string;
  const book_id = parseInt(req.query.book_id as string);

  if (!uid) {
    return res.status(400).json({ 
      status: "error", 
      message: "No UID provided" 
    });
  }

  if (!book_id || isNaN(book_id)) {
    return res.status(400).json({ 
      status: "error", 
      message: "Invalid book_id" 
    });
  }

  try {
    // Check if RFID already exists
    const [existing]: any = await db.query(
      "SELECT copy_id FROM book_copies WHERE rfid_uid = ?",
      [uid]
    );

    if (existing.length > 0) {
      return res.json({ 
        status: "duplicate", 
        message: "RFID already assigned to another book copy" 
      });
    }

    // Check if book exists
    const [book]: any = await db.query(
      "SELECT book_id, title FROM books WHERE book_id = ?",
      [book_id]
    );

    if (book.length === 0) {
      return res.status(404).json({ 
        status: "error", 
        message: "Book not found" 
      });
    }

    // Insert new book copy
    const [result]: any = await db.query(
      "INSERT INTO book_copies (book_id, rfid_uid, status) VALUES (?, ?, 'available')",
      [book_id, uid]
    );

    console.log(`✅ Book copy added: ${book[0].title} (ID: ${book_id}) with RFID: ${uid}`);

    res.json({ 
      status: "success", 
      message: "Book copy added successfully",
      copy_id: result.insertId,
      book_title: book[0].title
    });

  } catch (error) {
    console.error("Error adding book copy:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Database error" 
    });
  }
});

// POST - Alternative endpoint for web interface to add copy manually
router.post("/copy", async (req, res) => {
  const { uid, book_id } = req.body;

  if (!uid || !book_id) {
    return res.status(400).json({ 
      status: "error", 
      message: "Missing uid or book_id" 
    });
  }

  try {
    // Check if RFID already exists
    const [existing]: any = await db.query(
      "SELECT copy_id FROM book_copies WHERE rfid_uid = ?",
      [uid]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        status: "duplicate", 
        message: "RFID already assigned" 
      });
    }

    // Insert new book copy
    await db.query(
      "INSERT INTO book_copies (book_id, rfid_uid, status) VALUES (?, ?, 'available')",
      [book_id, uid]
    );

    res.json({ 
      status: "success", 
      message: "Book copy added successfully" 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: "error", 
      message: "Database error" 
    });
  }
});

// GET - Get all copies of a book
router.get("/book/:book_id", async (req, res) => {
  const { book_id } = req.params;

  try {
    const [rows]: any = await db.query(
      `SELECT bc.*, b.title, b.author 
       FROM book_copies bc
       JOIN books b ON bc.book_id = b.book_id
       WHERE bc.book_id = ?`,
      [book_id]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching book copies" });
  }
});

// DELETE - Remove a book copy
router.delete("/copy/:copy_id", async (req, res) => {
  const { copy_id } = req.params;

  try {
    await db.query("DELETE FROM book_copies WHERE copy_id = ?", [copy_id]);
    res.json({ message: "Book copy deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting book copy" });
  }
});

export default router;