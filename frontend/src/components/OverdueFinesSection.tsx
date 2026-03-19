import { useEffect, useState } from "react";
import "./OverdueFinesSection.css";

interface OverdueBorrowing {
  borrowing_id: number;
  student_id: number;
  copy_id: number;
  due_date: string;
  fine_amount: number;
  status: string;
}

export default function OverdueFinesSection() {
  const [overdues, setOverdues] = useState<OverdueBorrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/borrowings")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch borrowings");
        return res.json();
      })
      .then((data) => {
        const overdueOnly = data.filter(
          (b: OverdueBorrowing) => b.status === "overdue"
        );
        setOverdues(overdueOnly);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load overdue fines");
        setLoading(false);
      });
  }, []);

  return (
    <div className="overdue-section">
      <h2>💸 Overdue & Fines</h2>

      {loading ? (
        <p>Loading overdue records...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : overdues.length === 0 ? (
        <p>No overdue books 🎉</p>
      ) : (
        <table className="overdue-table">
          <thead>
            <tr>
              <th>Borrow ID</th>
              <th>Student</th>
              <th>Copy</th>
              <th>Due Date</th>
              <th>Fine (Rs.)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {overdues.map((b) => (
              <tr key={b.borrowing_id}>
                <td>{b.borrowing_id}</td>
                <td>{b.student_id}</td>
                <td>{b.copy_id}</td>
                <td>{b.due_date}</td>
                <td>Rs. {b.fine_amount}</td>
                <td style={{ color: "red", fontWeight: "bold" }}>
                  {b.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}