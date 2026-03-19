import { Router } from "express";

const router = Router();

// POST /login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Librarian login
  if (username === "lib" && password === "123") {
    return res.json({
      message: "Login successful",
      role: "librarian",
      user: { username }
    });
  }

  // Room booking user
  if (username === "other" && password === "456") {
    return res.json({
      message: "Login successful",
      role: "roomUser",
      user: { username }
    });
  }

  // Invalid credentials
  return res.status(401).json({
    message: "Invalid username or password"
  });
});

export default router;