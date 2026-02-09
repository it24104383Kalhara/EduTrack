import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("EduTrack Backend is running!");
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM users WHERE username = ? AND password = ?",
      [username, password],
    );
    if (rows.length > 0) {
      res.json({ success: true, message: "Login successful" });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
app.post("/api/students", async (req, res) => {
  const { name, age, date, symptoms } = req.body;
  try {
    await pool.query(
      "INSERT INTO students (name, age, date, symptoms) VALUES (?, ?, ?, ?)",
      [name, age, date, symptoms],
    );
    res.json({ success: true, message: "Student added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
