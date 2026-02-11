import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db";

dotenv.config();

const app = express();
const port = 5000;

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
  const { name, age, date, symptoms, parentEmail } = req.body;
  try {
    await pool.query(
      "INSERT INTO students (name, age, date, symptoms, parent_email) VALUES (?, ?, ?, ?, ?)",
      [name, age, date, symptoms, parentEmail],
    );
    res.json({ success: true, message: "Student added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/students", async (req, res) => {
  console.log("GET /api/students called");
  try {
    const [rows] = await pool.query("SELECT * FROM students ORDER BY id DESC");
    console.log("Rows from DB:", rows);
    res.json(rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json([]);
  }
});

app.post("/api/reset-password", async (req, res) => {
  const { oldPassword, newPassword, username } = req.body;
  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM users WHERE username = ? AND password = ?",
      [username, oldPassword],
    );

    if (rows.length === 0) {
      return res.json({ success: false, message: "Old password is incorrect" });
    }

    await pool.query("UPDATE users SET password = ? WHERE username = ?", [
      newPassword,
      username,
    ]);

    res.json({ success: true, message: "Password reset successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
