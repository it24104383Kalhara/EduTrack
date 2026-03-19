import { Router } from "express";
import db from "../config/db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM rooms");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch rooms" });
  }
});

export default router;