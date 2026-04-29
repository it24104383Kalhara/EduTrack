import { Router } from "express";
import db from "../config/db";

const router = Router();

// GET /api/analytics
router.get("/analytics", async (req, res) => {
  const { range } = req.query;
  
  try {
    // Total Books
    const [totalBooks]: any = await db.query("SELECT COUNT(*) as count FROM books");
    
    // Total Students
    const [totalStudents]: any = await db.query("SELECT COUNT(*) as count FROM students");
    
    // Active Borrowings
    const [activeBorrowings]: any = await db.query(
      "SELECT COUNT(*) as count FROM borrowings WHERE return_date IS NULL"
    );
    
    // Overdue Borrowings
    const [overdueBorrowings]: any = await db.query(
      "SELECT COUNT(*) as count FROM borrowings WHERE due_date < CURDATE() AND return_date IS NULL"
    );
    
    // Total Unpaid Fines
    const [totalFines]: any = await db.query(
      "SELECT COALESCE(SUM(fine_amount), 0) as total FROM borrowings WHERE fine_paid = FALSE"
    );
    
    // Books by Category
    const [booksByCategory]: any = await db.query(
      "SELECT COALESCE(category, 'Uncategorized') as category, COUNT(*) as count FROM books GROUP BY category ORDER BY count DESC"
    );
    
    // Monthly Borrowings - FIXED: Use subquery to avoid GROUP BY issue
    const [monthlyBorrowings]: any = await db.query(
      `SELECT 
        month,
        COUNT(*) as count 
       FROM (
         SELECT 
           DATE_FORMAT(borrow_date, '%b') as month,
           borrow_date
         FROM borrowings 
         WHERE borrow_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       ) as temp
       GROUP BY month
       ORDER BY MIN(borrow_date) ASC`
    );
    
    // Most Borrowed Books
    const [mostBorrowedBooks]: any = await db.query(
      `SELECT b.title, COUNT(*) as count 
       FROM borrowings br
       JOIN book_copies bc ON br.copy_id = bc.copy_id
       JOIN books b ON bc.book_id = b.book_id
       GROUP BY b.book_id, b.title
       ORDER BY count DESC
       LIMIT 5`
    );
    
    // Students with Unpaid Fines
    const [studentsWithFines]: any = await db.query(
      `SELECT s.name, COALESCE(SUM(b.fine_amount), 0) as fine_amount
       FROM students s
       LEFT JOIN borrowings b ON s.student_id = b.student_id AND b.fine_paid = FALSE
       GROUP BY s.student_id, s.name
       HAVING fine_amount > 0
       ORDER BY fine_amount DESC
       LIMIT 10`
    );
    
    const analyticsData = {
      totalBooks: totalBooks[0]?.count || 0,
      totalStudents: totalStudents[0]?.count || 0,
      activeBorrowings: activeBorrowings[0]?.count || 0,
      overdueBorrowings: overdueBorrowings[0]?.count || 0,
      totalFines: totalFines[0]?.total || 0,
      booksByCategory: booksByCategory || [],
      monthlyBorrowings: monthlyBorrowings || [],
      mostBorrowedBooks: mostBorrowedBooks || [],
      studentsWithFines: studentsWithFines || []
    };
    
    res.json(analyticsData);
    
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ 
      message: "Error fetching analytics", 
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

// GET /api/alerts - Get due and overdue alerts
router.get("/alerts", async (req, res) => {
  try {
    // Books due today
    const [dueToday]: any = await db.query(
      `SELECT b.borrowing_id, s.name as student_name, bk.title as book_title, b.due_date
       FROM borrowings b
       JOIN students s ON b.student_id = s.student_id
       JOIN book_copies bc ON b.copy_id = bc.copy_id
       JOIN books bk ON bc.book_id = bk.book_id
       WHERE b.due_date = CURDATE() AND b.return_date IS NULL`
    );

    // Books due in next 3 days (excluding today)
    const [dueSoon]: any = await db.query(
      `SELECT b.borrowing_id, s.name as student_name, bk.title as book_title, b.due_date,
              DATEDIFF(b.due_date, CURDATE()) as days_left
       FROM borrowings b
       JOIN students s ON b.student_id = s.student_id
       JOIN book_copies bc ON b.copy_id = bc.copy_id
       JOIN books bk ON bc.book_id = bk.book_id
       WHERE b.due_date > CURDATE() 
       AND b.due_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)
       AND b.return_date IS NULL`
    );

    // Overdue books
    const [overdue]: any = await db.query(
      `SELECT b.borrowing_id, s.name as student_name, bk.title as book_title, b.due_date,
              DATEDIFF(CURDATE(), b.due_date) as days_overdue
       FROM borrowings b
       JOIN students s ON b.student_id = s.student_id
       JOIN book_copies bc ON b.copy_id = bc.copy_id
       JOIN books bk ON bc.book_id = bk.book_id
       WHERE b.due_date < CURDATE() AND b.return_date IS NULL`
    );

    res.json({
      dueToday: dueToday,
      dueSoon: dueSoon,
      overdue: overdue,
      counts: {
        dueToday: dueToday.length,
        dueSoon: dueSoon.length,
        overdue: overdue.length,
        total: dueToday.length + dueSoon.length + overdue.length
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching alerts" });
  }
});

export default router;