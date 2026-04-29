import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../css/BorrowingsSection.css";

interface Borrowing {
  borrowing_id: number;
  student_id: number;
  copy_id: number;
  borrow_date: string;
  due_date: string;
  return_date?: string;
  fine_amount: number;
  status: string;
  student_name?: string;
  book_title?: string;
  book_author?: string;
}

export default function BorrowingsSection() {
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [filteredBorrowings, setFilteredBorrowings] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/borrowings")
      .then((res) => {
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setBorrowings(data);
        setFilteredBorrowings(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to fetch borrowings");
        setLoading(false);
      });
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredBorrowings(borrowings);
    } else {
      const filtered = borrowings.filter(
        (borrowing) =>
          borrowing.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          borrowing.book_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          borrowing.book_author?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBorrowings(filtered);
    }
  }, [searchTerm, borrowings]);

  return (
    <div className="borrowings-section">
      <h2>⏳ Borrowings</h2>

      {/* Search Bar */}
      <div className="search-container" style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="🔍 Search by student name or book title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          style={{
            padding: "10px",
            width: "100%",
            maxWidth: "400px",
            borderRadius: "5px",
            border: "1px solid #ddd",
            fontSize: "14px"
          }}
        />
      </div>

      {/* Action Buttons */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "10px" }}>
        <Link to="/borrow-book">
          <button className="borrow-btn" style={{
            backgroundColor: "#4CAF50",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "16px"
          }}>
            ➕ Borrow a Book
          </button>
        </Link>
        
        <Link to="/return-book">
          <button className="return-btn" style={{
            backgroundColor: "#ff9800",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "16px"
          }}>
            🔄 Return a Book
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
              <th>Student Name</th>
              <th>Book Title</th>
              <th>Copy ID</th>
              <th>Borrow Date</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Fine</th>
            </tr>
          </thead>
          <tbody>
            {filteredBorrowings.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center" }}>
                  {searchTerm ? "No matching borrowings found" : "No borrowings found"}
                </td>
              </tr>
            ) : (
              filteredBorrowings.map((b) => (
                <tr key={b.borrowing_id}>
                  <td>{b.borrowing_id}</td>
                  <td>{b.student_name || b.student_id}</td>
                  <td>{b.book_title || b.copy_id}</td>
                  <td>{b.copy_id}</td>
                  <td>{new Date(b.borrow_date).toLocaleDateString()}</td>
                  <td>{new Date(b.due_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge status-${b.status.toLowerCase()}`}>
                      {b.status}
                    </span>
                  </td>
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