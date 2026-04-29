import { Router } from "express";
import db from "../config/db";

const router = Router();

// GET - ESP32 checks current mode
router.get("/mode", async (req, res) => {
  try {
    const [rows]: any = await db.query(
      "SELECT mode, book_id FROM esp_mode ORDER BY updated_at DESC LIMIT 1"
    );
    
    if (rows.length === 0) {
      return res.json({ mode: "student" });
    }
    
    return res.json({
      mode: rows[0].mode,
      book_id: rows[0].book_id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching mode" });
  }
});

// POST - Web app changes ESP32 mode
router.post("/mode", async (req, res) => {
  const { mode, book_id } = req.body;
  
  try {
    await db.query(
      "INSERT INTO esp_mode (mode, active, book_id, updated_at) VALUES (?, 1, ?, NOW())",
      [mode, book_id || null]
    );
    
    console.log(`✅ ESP32 mode: ${mode} ${book_id ? `(book_id: ${book_id})` : ""}`);
    res.json({ success: true, mode, book_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error setting mode" });
  }
});

export default router;