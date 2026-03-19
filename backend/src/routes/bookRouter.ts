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

export default router;