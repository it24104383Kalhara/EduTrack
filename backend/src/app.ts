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




app.listen(3000, () => console.log("Server running on port 3000"));