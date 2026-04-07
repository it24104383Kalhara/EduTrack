import { useEffect, useState } from "react";
import "../css/OverdueFinesSection.css";

interface OverdueBorrowing {
  borrowing_id: number;
  student_id: number;
  student_name: string;
  registration_no: string;
  copy_id: number;
  book_title: string;
  borrow_date: string;
  due_date: string;
  days_overdue: number;
  calculated_fine: number;
  fine_amount: number;
  status: string;
}

export default function OverdueFinesSection() {
  const [overdues, setOverdues] = useState<OverdueBorrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalFines, setTotalFines] = useState(0);

  useEffect(() => {
    fetchOverdues();
  }, []);

  const fetchOverdues = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/overdue");
      if (!response.ok) throw new Error("Failed to fetch overdues");
      const data = await response.json();
      setOverdues(data);
      
      // Calculate total fines
      const total = data.reduce((sum: number, item: OverdueBorrowing) => sum + item.calculated_fine, 0);
      setTotalFines(total);
    } catch (err) {
      setError("Failed to load overdue records");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayFine = async (borrowing_id: number, amount: number) => {
    if (!confirm(`Pay fine of Rs. ${amount}?`)) return;
    
    try {
      const response = await fetch("http://localhost:3000/api/overdue/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ borrowing_id, amount })
      });
      
      if (!response.ok) throw new Error("Failed to pay fine");
      
      alert("Fine paid successfully!");
      fetchOverdues(); // Refresh the list
    } catch (err) {
      alert("Error paying fine");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="overdue-section">
        <h2>💸 Overdue & Fines</h2>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading overdue records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overdue-section">
        <h2>💸 Overdue & Fines</h2>
        <div className="error-container">{error}</div>
      </div>
    );
  }

  return (
    <div className="overdue-section">
      <h2>💸 Overdue & Fines</h2>
      
      {/* Summary Card */}
      <div className="summary-card">
        <div className="summary-title">Total Outstanding Fines</div>
        <div className="summary-amount">Rs. {totalFines.toFixed(2)}</div>
        <div className="summary-count">{overdues.length} overdue book(s)</div>
      </div>

      {overdues.length === 0 ? (
        <div className="empty-state">
          No overdue books! Everyone is on time! 🎉
        </div>
      ) : (
        <table className="overdue-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Book</th>
              <th>Due Date</th>
              <th>Days Overdue</th>
              <th>Fine (Rs.)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {overdues.map((b) => (
              <tr key={b.borrowing_id}>
                <td>
                  <strong>{b.student_name}</strong><br/>
                  <small>{b.registration_no}</small>
                </td>
                <td>{b.book_title}</td>
                <td>{new Date(b.due_date).toLocaleDateString()}</td>
                <td className="days-overdue">{b.days_overdue} days</td>
                <td className="fine-amount">Rs. {b.calculated_fine.toFixed(2)}</td>
                <td>
                  <button 
                    className="pay-btn"
                    onClick={() => handlePayFine(b.borrowing_id, b.calculated_fine)}
                  >
                    Pay Fine
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}