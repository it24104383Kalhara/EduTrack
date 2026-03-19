import { useEffect, useState } from "react";
import { Link } from "react-router-dom";   // ✅ added
import "./BorrowingsSection.css";

interface Borrowing {
  borrowing_id: number;
  student_id: number;
  copy_id: number;
  borrow_date: string;
  due_date: string;
  return_date?: string;
  fine_amount: number;
  status: string;
}

export default function BorrowingsSection() {
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/borrowings")
      .then((res) => {
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setBorrowings(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to fetch borrowings");
        setLoading(false);
      });
  }, []);

  return (
    <div className="borrowings-section">
      <h2>⏳ Borrowings</h2>

      {/* ✅ NEW BUTTON */}
      <div style={{ marginBottom: "1rem" }}>
        <Link to="/borrow-book">
          <button className="borrow-btn">
            ➕ Borrow a Book
          </button>
        </Link>
      </div>

      {loading ? (
        <p>Loading borrowings...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <table className="borrowings-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Student</th>
              <th>Copy ID</th>
              <th>Borrow Date</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Fine</th>
            </tr>
          </thead>
          <tbody>
            {borrowings.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center" }}>
                  No borrowings found
                </td>
              </tr>
            ) : (
              borrowings.map((b) => (
                <tr key={b.borrowing_id}>
                  <td>{b.borrowing_id}</td>
                  <td>{b.student_id}</td>
                  <td>{b.copy_id}</td>
                  <td>{b.borrow_date}</td>
                  <td>{b.due_date}</td>
                  <td>{b.status}</td>
                  <td>Rs. {b.fine_amount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}