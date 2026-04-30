import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../css/ReturnBookPage.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function ReturnBookPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"book" | "student">("book");
  const [bookRFID, setBookRFID] = useState("");
  const [studentRFID, setStudentRFID] = useState("");
  const [bookInfo, setBookInfo] = useState<any>(null);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [borrowingInfo, setBorrowingInfo] = useState<any>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastScanned, setLastScanned] = useState<{ type: string; name: string; uid: string } | null>(null);
  const lastScannedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastReturnedIdRef = useRef<number | null>(null);

  // Poll for last scanned card every second
  useEffect(() => {
    const scanInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/api/last-scan`);
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

  // Tell ESP32 to switch to return mode when page loads
  useEffect(() => {
    fetch(`${API_BASE}/api/esp/mode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "return" })
    }).catch(err => console.error("Failed to switch mode:", err));

    // Get initial borrowings to track returns
    fetch(`${API_BASE}/api/borrowings`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          lastReturnedIdRef.current = data[0].borrowing_id;
        }
      })
      .catch(err => console.error("Error:", err));

    // Poll for returns every 2 seconds
    const interval = setInterval(checkNewReturns, 2000);

    return () => {
      clearInterval(interval);
      fetch(`${API_BASE}/api/esp/mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "student" })
      }).catch(err => console.error("Failed to reset mode:", err));
    };
  }, []);

  const checkNewReturns = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/borrowings`);
      const borrowings = await response.json();
      
      if (borrowings.length > 0) {
        const latest = borrowings[0];
        
        if (lastReturnedIdRef.current !== latest.borrowing_id && latest.status === "returned") {
          console.log("🎉 NEW return detected!", latest);
          lastReturnedIdRef.current = latest.borrowing_id;
          setShowSuccess(true);
          setMessage({ type: "success", text: `✅ Book returned successfully!` });
          setTimeout(() => navigate("/borrowings"), 3000);
        }
      }
    } catch (err) {
      console.error("Error checking returns:", err);
    }
  };

  const handleRFIDInput = async (rfid: string) => {
    if (step === "book") {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/borrowings/by-book-rfid/${rfid}`);
        if (!response.ok) throw new Error("Book not found or not borrowed");
        
        const data = await response.json();
        
        if (data.status !== "borrowed") {
          setMessage({ type: "error", text: `This book is ${data.status}, not currently borrowed` });
          return;
        }
        
        setBookInfo(data.book);
        setBorrowingInfo(data.borrowing);
        setBookRFID(rfid);
        setMessage({ type: "success", text: `Book: "${data.book.title}" found. Now scan student RFID to verify.` });
        setStep("student");
      } catch (error) {
        setMessage({ type: "error", text: "Invalid book RFID or book not borrowed" });
      } finally {
        setLoading(false);
      }
    } 
    else if (step === "student") {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/students/rfid/${rfid}`);
        if (!response.ok) throw new Error("Student not found");
        
        const student = await response.json();
        
        if (student.student_id !== borrowingInfo.student_id) {
          setMessage({ type: "error", text: `This book was borrowed by a different student!` });
          return;
        }
        
        setStudentInfo(student);
        setStudentRFID(rfid);
        setMessage({ type: "success", text: `Student verified: ${student.name}. Returning book...` });
        
        await completeReturn();
      } catch (error) {
        setMessage({ type: "error", text: "Invalid student RFID" });
      } finally {
        setLoading(false);
      }
    }
  };

  const completeReturn = async () => {
    try {
      const dueDate = new Date(borrowingInfo.due_date);
      const today = new Date();
      let fineAmount = 0;
      
      if (today > dueDate) {
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        fineAmount = daysOverdue * 10;
      }
      
      const response = await fetch(`${API_BASE}/api/return-book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrowing_id: borrowingInfo.borrowing_id,
          copy_id: bookInfo.copy_id,
          student_id: studentInfo.student_id,
          fine_amount: fineAmount,
          return_date: new Date().toISOString().split('T')[0]
        })
      });
      
      if (!response.ok) throw new Error("Failed to return book");
      
      if (fineAmount > 0) {
        setMessage({ type: "success", text: `Book returned! Fine: Rs. ${fineAmount}` });
      } else {
        setMessage({ type: "success", text: "Book returned successfully! ✅" });
      }
      
      setShowSuccess(true);
      setTimeout(() => navigate("/borrowings"), 2000);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to complete return" });
      throw error;
    }
  };

  const reset = () => {
    setStep("book");
    setBookRFID("");
    setStudentRFID("");
    setBookInfo(null);
    setStudentInfo(null);
    setBorrowingInfo(null);
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
    <div className="return-book-page">
      <h2>🔄 Return a Book</h2>
      
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
          <p>1. Scan Book RFID tag on ESP32<br/>2. Scan Student RFID card on ESP32<br/>3. The system will auto-detect and redirect you</p>
        </div>
        
        {/* Steps Indicator */}
        <div className="steps-container">
          <div className={`step ${step === "book" ? "active" : "inactive"}`}>
            Step 1: Scan Book RFID
          </div>
          <div className={`step ${step === "student" ? "active" : "inactive"}`}>
            Step 2: Verify Student RFID
          </div>
        </div>
        
        {/* Manual Input Section */}
        <details className="manual-toggle">
          <summary>📝 Use Manual Input (Copy UID from Serial Monitor)</summary>
          
          <div className="manual-content">
            <div>
              <label className="input-label">
                {step === "book" ? "📖 Book RFID UID:" : "👤 Student RFID UID:"}
              </label>
              <div className="input-group">
                <input
                  type="text"
                  value={step === "book" ? bookRFID : studentRFID}
                  onChange={(e) => {
                    if (step === "book") setBookRFID(e.target.value);
                    else setStudentRFID(e.target.value);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      const value = (e.target as HTMLInputElement).value;
                      if (value) handleRFIDInput(value);
                    }
                  }}
                  placeholder={`Paste ${step === "book" ? "book" : "student"} RFID UID...`}
                />
                <button 
                  className="verify-btn"
                  onClick={() => handleRFIDInput(step === "book" ? bookRFID : studentRFID)} 
                  disabled={loading}
                >
                  Verify
                </button>
              </div>
              <p className="hint-text">Press Enter after typing RFID</p>
            </div>
          </div>
        </details>
        
        {/* Book Info Display */}
        {bookInfo && (
          <div className="info-card book">
            <strong>📖 Book:</strong> {bookInfo.title} by {bookInfo.author}<br/>
            <strong>📅 Borrowed on:</strong> {new Date(borrowingInfo?.borrow_date).toLocaleDateString()}<br/>
            <strong>⏰ Due date:</strong> {new Date(borrowingInfo?.due_date).toLocaleDateString()}
          </div>
        )}
        
        {/* Student Info Display */}
        {studentInfo && (
          <div className="info-card student">
            <strong>👤 Student:</strong> {studentInfo.name} ({studentInfo.registration_no})
          </div>
        )}
        
        {/* Return Button */}
        {bookInfo && studentInfo && (
          <div className="action-buttons">
            <button 
              className="return-btn"
              onClick={completeReturn} 
              disabled={loading}
            >
              {loading ? "Processing..." : "✅ Confirm Return"}
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