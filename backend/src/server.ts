import express from "express";
import db from "./config/db";
import cors from "cors";
import booksRouter from "./routes/bookRouter";
import libraryEntryRouter from "./routes/libraryEntryRouter";   

const app = express();

app.use(cors());
app.use(express.json());

app.get("/test", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1");
    res.json({ message: "Database connected ✅", rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "DB connection failed ❌" });
  }
});

app.use("/books", booksRouter);
app.use("/library", libraryEntryRouter);   

app.listen(3000, () => {
  console.log("Server running on port 3000");
});