import { Router } from "express";
import type { OkPacket } from "mysql2";
import db from "../config/db";

const router = Router();

// ✅ GET all books
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM books");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching books" });
  }
});

// ✅ POST new book
router.post("/", async (req, res) => {
  const bookData = req.body;

  try {
    const [result] = await db.query<OkPacket>(
      `INSERT INTO books 
      (isbn, title, author, publisher, published_year, category, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        bookData.isbn,
        bookData.title,
        bookData.author || null,
        bookData.publisher || null,
        bookData.published_year || null,
        bookData.category || null,
        bookData.description || null,
      ]
    );

    res.json({ message: "Book saved!", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving book" });
  }
});

// ✅ UPDATE book
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, author, publisher, published_year } = req.body;

  try {
    const [result] = await db.query<OkPacket>(
      `UPDATE books 
       SET title = ?, author = ?, publisher = ?, published_year = ?
       WHERE book_id = ?`,
      [title, author || null, publisher || null, published_year || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({ message: "Book updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating book" });
  }
});

// ✅ DELETE book
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query<OkPacket>("DELETE FROM books WHERE book_id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting book" });
  }
});

export default router;