import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("Test server!");
});

app.get("/api/students", (req, res) => {
  res.json([{ id: 1, name: "Test" }]);
});

app.listen(5001, () => {
  console.log("Test server on port 5001");
});
