import express from "express";
import cors from "cors";
import authRouter from "./Imesha/routes/authRouter";
import db from "./Imesha/config/db";
import bookRouter from "./Imesha/routes/bookRouter";
//import borrowingsRouter from "./routes/borrowingsRouter";
import libraryLogsRouter from "./Imesha/routes/libraryLogs";
import roomsRouter from "./Imesha/routes/rooms";
import libraryEntryRouter from "./Imesha/routes/libraryEntryRouter";
//const libraryEntryRouter = require("./routes/libraryEntryRouter").default;
import borrowReturnRouter from "./Imesha/routes/borrowReturnRouter";
import bookCopyRouter from "./Imesha/routes/bookCopyRouter";
import espModeRouter from "./Imesha/routes/espModeRouter";
import analyticsRouter from "./Imesha/routes/analyticsRouter";
import overdueFinesRouter from "./Imesha/routes/overdueFinesRouter";

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