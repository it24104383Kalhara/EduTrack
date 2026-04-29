import express from "express";
import cors from "cors";
import authRouter from "./routes/authRouter";
import db from "./config/db";
import bookRouter from "./routes/bookRouter";
//import borrowingsRouter from "./routes/borrowingsRouter";
import libraryLogsRouter from "./routes/libraryLogs";
import roomsRouter from "./routes/rooms";
import libraryEntryRouter from "./routes/libraryEntryRouter";
//const libraryEntryRouter = require("./routes/libraryEntryRouter").default;
import borrowReturnRouter from "./routes/borrowReturnRouter";
import bookCopyRouter from "./routes/bookCopyRouter";
import espModeRouter from "./routes/espModeRouter";
import analyticsRouter from "./routes/analyticsRouter";
import overdueFinesRouter from "./routes/overdueFinesRouter";

const app = express();
app.use(cors());
app.use(express.json());



app.get("/", (req, res) => {
  res.send("Library API is running!");
});

app.get("/hello", (req, res) => res.send("Hello World"));

// Add this to app.ts
app.get("/books/test", (req, res) => {
  res.json({ message: "Backend is working ✅" });
});

app.use("/auth", authRouter);
app.use("/books", bookRouter);
//app.use("/borrowings", borrowingsRouter);
app.use("/library_entry_logs", libraryLogsRouter);
app.use("/rooms", roomsRouter);
app.use("/library", libraryEntryRouter);
app.use("/api", borrowReturnRouter);     // For borrowing/returning
app.use("/esp", bookCopyRouter);         // For ESP32 copy scans
app.use("/esp", espModeRouter); 
app.use("/api", analyticsRouter);
app.use("/api/overdue", overdueFinesRouter);

// Health module routes
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    // 1. Check database first
    const [rows]: any = await db.query(
      "SELECT * FROM users WHERE username = ? AND password = ?",
      [username, password]
    );

    if (rows.length > 0) {
      return res.json({ success: true, message: "Login successful" });
    }

    // 2. Fallback for default user if not in DB yet
    if (username === "health" && password === "health123") {
      return res.json({ success: true, message: "Login successful" });
    }

    res.json({ success: false, message: "Invalid credentials" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/students", async (req, res) => {
  const { name, age, date, symptoms, parentEmail } = req.body;
  if (age < 6 || age > 20)
    return res.status(400).json({ success: false, message: "Age must be between 6 and 20." });
  try {
    await db.query(
      "INSERT INTO students (name, age, date, symptoms, parent_email) VALUES (?, ?, ?, ?, ?)",
      [name, age, date, symptoms, parentEmail]
    );
    res.json({ success: true, message: "Student added successfully" });
  } catch (error: any) {
    console.error("Add student error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/students", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM students ORDER BY id DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json([]);
  }
});

app.delete("/api/students/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM students WHERE id = ?", [id]);
    res.json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/reset-password", async (req, res) => {
  const { oldPassword, newPassword, username } = req.body;
  try {
    // Check if user exists in DB
    const [rows]: any = await db.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      // Fallback for default 'health' user
      if (username === "health" && oldPassword === "health123") {
        await db.query(
          "INSERT INTO users (username, password) VALUES (?, ?)",
          [username, newPassword]
        );
        return res.json({ success: true, message: "Password reset successfully!" });
      }
      return res.json({ success: false, message: "Old password is incorrect" });
    }

    // User exists, verify old password
    if (rows[0].password !== oldPassword) {
      return res.json({ success: false, message: "Old password is incorrect" });
    }

    // Update password
    await db.query(
      "UPDATE users SET password = ? WHERE username = ?",
      [newPassword, username]
    );
    res.json({ success: true, message: "Password reset successfully!" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.listen(process.env.PORT || 5000, () => console.log(`Server running on port ${process.env.PORT || 5000}`));