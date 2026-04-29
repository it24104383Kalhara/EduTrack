import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../css/BorrowBookPage.css";

export default function BorrowBookPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"student" | "book">("student");
  const [studentRFID, setStudentRFID] = useState("");
  const [bookRFID, setBookRFID] = useState("");
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [bookInfo, setBookInfo] = useState<any>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const lastBorrowingIdRef = useRef<number | null>(null);
  const [lastScanned, setLastScanned] = useState<{ type: string; name: string; uid: string } | null>(null);
  const lastScannedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Poll for last scanned card every second
  useEffect(() => {
    const scanInterval = setInterval(async () => {
      try {
        const response = await fetch("http://10.136.142.116:3000/api/last-scan");
        const data = await response.json();
        if (data.uid) {
          setLastScanned(data);
          if (lastScannedTimeoutRef.current) {
            clearTimeout(lastScannedTimeoutRef.current);
          }
          lastScannedTimeoutRef.current = setTimeout(() => {
            setLastScanned(null);
          }, 3000);
        }
      } catch (err) {
        console.error("Error fetching last scan:", err);
      }
    }, 1000);
    
    return () => {
      clearInterval(scanInterval);
      if (lastScannedTimeoutRef.current) {
        clearTimeout(lastScannedTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetch("http://10.136.142.116:3000/api/esp/mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "borrow" })
    }).catch(err => console.error("Failed to switch mode:", err));

    fetch("http://10.136.142.116:3000/api/borrowings")
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          lastBorrowingIdRef.current = data[0].borrowing_id;
        }
      })
      .catch(err => console.error("Error:", err));

    const interval = setInterval(checkNewBorrowings, 2000);
    
    return () => {
      clearInterval(interval);
      fetch("http://10.136.142.116:3000/api/esp/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "student" })
      }).catch(err => console.error("Failed to reset mode:", err));
    };
  }, []);

  const checkNewBorrowings = async () => {
    try {
      const response = await fetch("http://10.136.142.116:3000/api/borrowings");
      const borrowings = await response.json();
      
      if (borrowings.length > 0) {
        const latest = borrowings[0];
        
        if (lastBorrowingIdRef.current !== latest.borrowing_id && latest.status === "borrowed") {
          setMessage({ 
            type: "success", 
            text: `✅ ${latest.student_name} borrowed "${latest.book_title}"! Due: ${new Date(latest.due_date).toLocaleDateString()}` 
          });
          
          lastBorrowingIdRef.current = latest.borrowing_id;
          setShowSuccess(true);
          
          setTimeout(() => {
            navigate("/borrowings");
          }, 3000);
        }
      }
    } catch (err) {
      console.error("❌ Error checking borrowings:", err);
    }
  };

  const handleManualStudent = async () => {
    if (!studentRFID.trim()) {
      setMessage({ type: "error", text: "Please enter Student RFID" });
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`http://10.136.142.116:3000/api/students/rfid/${studentRFID}`);
      if (!response.ok) throw new Error("Student not found");
      
      const student = await response.json();
      
      if (student.has_unpaid_fine) {
        setMessage({ type: "error", text: `❌ ${student.name} has unpaid fines! Cannot borrow.` });
        setStudentRFID("");
        return;
      }
      
      setStudentInfo(student);
      setMessage({ type: "success", text: `✅ Student: ${student.name} verified! Now scan book.` });
      setStep("book");
    } catch (error) {
      setMessage({ type: "error", text: "❌ Invalid student RFID" });
      setStudentRFID("");
    } finally {
      setLoading(false);
    }
  };

  const handleManualBook = async () => {
    if (!bookRFID.trim()) {
      setMessage({ type: "error", text: "Please enter Book RFID" });
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`http://10.136.142.116:3000/api/books/rfid/${bookRFID}`);
      if (!response.ok) throw new Error("Book not found");
      
      const book = await response.json();
      
      if (book.status !== "available") {
        setMessage({ type: "error", text: `❌ Book is ${book.status}` });
        setBookRFID("");
        return;
      }
      
      setBookInfo(book);
      setMessage({ type: "success", text: `✅ Book: ${book.title} verified! Click borrow to complete.` });
    } catch (error) {
      setMessage({ type: "error", text: "❌ Invalid book RFID" });
      setBookRFID("");
    } finally {
      setLoading(false);
    }
  };

  const completeBorrowing = async () => {
    setLoading(true);
    try {
      const borrowDate = new Date().toISOString().split('T')[0];
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      
      const response = await fetch("http://10.136.142.116:3000/api/borrowings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentInfo.student_id,
          copy_id: bookInfo.copy_id,
          borrow_date: borrowDate,
          due_date: dueDate.toISOString().split('T')[0]
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      const result = await response.json();
      lastBorrowingIdRef.current = result.borrowing_id;
      setShowSuccess(true);
      setMessage({ type: "success", text: "✅ Book borrowed successfully! Redirecting..." });
      setTimeout(() => navigate("/borrowings"), 2000);
    } catch (error: any) {
      setMessage({ type: "error", text: `❌ ${error.message || "Failed to complete borrowing"}` });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("student");
    setStudentRFID("");
    setBookRFID("");
    setStudentInfo(null);
    setBookInfo(null);
    setMessage(null);
    setShowSuccess(false);
  };

  if (showSuccess) {
    return (
      <div className="success-page">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h3>{message?.text}</h3>
          <p>Redirecting to borrowings page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="borrow-book-page">
      <h2>📚 Borrow a Book</h2>
      
      <div className="main-card">
        {/* Last Scanned Card Display */}
        {lastScanned && (
          <div className={`last-scanned-card ${lastScanned.type === "student" ? "student" : "book"}`}>
            <div className="label">
              {lastScanned.type === "student" ? "👤 Student Scanned" : "📖 Book Scanned"}
            </div>
            <div className="content">
              <strong>{lastScanned.name}</strong>
              <span className="uid"> ({lastScanned.uid})</span>
            </div>
          </div>
        )}
        
        {/* Instructions */}
        <div className="instructions-box">
          <strong>📋 Instructions:</strong>
          <p>1. Scan Student RFID card on ESP32<br/>2. Scan Book RFID tag on ESP32<br/>3. The system will auto-detect and redirect you</p>
        </div>
        
        {/* Manual Input Section */}
        <details className="manual-toggle">
          <summary>📝 Use Manual Input (Copy UID from Serial Monitor)</summary>
          
          <div className="manual-content">
            {step === "student" ? (
              <div className="input-wrapper">
                <label className="input-label">📇 Student RFID UID:</label>
                <div className="input-group">
                  <input
                    type="text"
                    value={studentRFID}
                    onChange={(e) => setStudentRFID(e.target.value)}
                    placeholder="Paste student RFID UID..."
                  />
                  <button 
                    className="verify-btn"
                    onClick={handleManualStudent} 
                    disabled={loading}
                  >
                    Verify
                  </button>
                </div>
              </div>
            ) : (
              <div className="input-wrapper">
                <label className="input-label">📖 Book RFID UID:</label>
                <div className="input-group">
                  <input
                    type="text"
                    value={bookRFID}
                    onChange={(e) => setBookRFID(e.target.value)}
                    placeholder="Paste book RFID UID..."
                  />
                  <button 
                    className="verify-btn"
                    onClick={handleManualBook} 
                    disabled={loading}
                  >
                    Verify
                  </button>
                </div>
              </div>
            )}
          </div>
        </details>
        
        {/* Student Info Display */}
        {studentInfo && (
          <div className="info-card student">
            <strong>👤 Student:</strong> {studentInfo.name} ({studentInfo.registration_no})
          </div>
        )}
        
        {/* Book Info Display */}
        {bookInfo && (
          <div className="info-card book">
            <strong>📖 Book:</strong> {bookInfo.title} by {bookInfo.author}<br/>
            <div className="due-date">📅 Due date: {new Date(Date.now() + 14*24*60*60*1000).toLocaleDateString()}</div>
          </div>
        )}
        
        {/* Borrow Button */}
        {studentInfo && bookInfo && (
          <div className="action-buttons">
            <button 
              className="borrow-btn"
              onClick={completeBorrowing} 
              disabled={loading}
            >
              {loading ? "Processing..." : "✅ Confirm Borrowing"}
            </button>
            <button 
              className="reset-btn"
              onClick={reset}
            >
              Reset
            </button>
          </div>
        )}
        
        {/* Message Display */}
        {message && !showSuccess && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
        
        {/* Footer Info */}
        <div className="footer-info">
          <p>
            💡 <strong>How it works:</strong><br/>
            • <strong>Auto:</strong> Scan cards on ESP32 - detects automatically and redirects<br/>
            • <strong>Manual:</strong> Click "Manual Input" and paste UIDs from Serial Monitor
          </p>
        </div>


        <div style={{ marginBottom: "20px" }}>
  <button 
    onClick={() => navigate("/dashboard")}
    style={{ 
      background: "#8f58d7", 
      color: "white", 
      border: "none", 
      padding: "8px 16px", 
      borderRadius: "5px",
      cursor: "pointer",
      fontSize: "14px",
      display: "flex",
      alignItems: "center",
      gap: "5px"
    }}
  >
    ← Back to Dashboard
  </button>
</div>

      </div>
    </div>
  );
}