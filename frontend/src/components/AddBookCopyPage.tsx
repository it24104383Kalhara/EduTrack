import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/AddBookCopyPage.css";

interface Book {
  book_id: number;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  published_year: number;
}

interface BookCopy {
  copy_id: number;
  book_id: number;
  rfid_uid: string;
  status: string;
  added_at: string;
  title?: string;
  author?: string;
}

export default function AddBookCopyPage() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [step, setStep] = useState<"select" | "scan">("select");
  const [rfidUID, setRfidUID] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookCopies, setBookCopies] = useState<BookCopy[]>([]);

  // Fetch all books
  useEffect(() => {
    fetchBooks();
  }, []);

  // Fetch copies when a book is selected
  useEffect(() => {
    if (selectedBook) {
      console.log("Book selected:", selectedBook.title);
      fetchBookCopies(selectedBook.book_id);
      
      // Tell ESP32 to switch to copy mode
      fetch("http://localhost:3000/esp/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "copy", book_id: selectedBook.book_id })
      }).catch(err => console.error("Failed to switch mode:", err));
    }
    
    return () => {
      if (selectedBook) {
        fetch("http://localhost:3000/esp/mode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "student" })
        }).catch(err => console.error("Failed to reset mode:", err));
      }
    };
  }, [selectedBook]);

  const fetchBooks = async () => {
    try {
      const response = await fetch("http://localhost:3000/books");
      const data = await response.json();
      setBooks(data);
    } catch (err) {
      console.error("Error fetching books:", err);
      setMessage({ type: "error", text: "Failed to load books" });
    }
  };

  const fetchBookCopies = async (bookId: number) => {
    try {
      console.log("Fetching copies for book:", bookId);
      const response = await fetch(`http://localhost:3000/esp/book/${bookId}`);
      const data = await response.json();
      console.log("Copies received:", data);
      setBookCopies(data);
    } catch (err) {
      console.error("Error fetching copies:", err);
    }
  };

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
    setStep("scan");
    setMessage({ type: "success", text: `Selected: ${book.title}. Now scan RFID tags.` });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfidUID.trim() || !selectedBook) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/esp/copy?uid=${rfidUID.trim().toUpperCase()}&book_id=${selectedBook.book_id}`
      );
      const data = await response.json();
      
      if (data.status === "success") {
        setMessage({ type: "success", text: `Copy added! RFID: ${rfidUID}` });
        setRfidUID("");
        await fetchBookCopies(selectedBook.book_id);
      } else if (data.status === "duplicate") {
        setMessage({ type: "error", text: "This RFID is already assigned!" });
      } else {
        setMessage({ type: "error", text: "Failed to add copy" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error adding copy" });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSelect = () => {
    setStep("select");
    setSelectedBook(null);
    setRfidUID("");
    setMessage(null);
    setBookCopies([]);
  };

  return (
    <div className="add-book-copy-page">
      <h2>Add Book Copy with RFID</h2>
      
      <div className="add-copy-container">
        {step === "select" && (
          <div className="book-selection">
            <h3>Step 1: Select a Book</h3>
            {books.length === 0 ? (
              <p>Loading books...</p>
            ) : (
              <div className="book-list">
                {books.map((book) => (
                  <div 
                    key={book.book_id} 
                    className="book-card"
                    onClick={() => handleBookSelect(book)}
                  >
                    <h4>{book.title}</h4>
                    <p>by {book.author}</p>
                    <p className="isbn">ISBN: {book.isbn}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {step === "scan" && selectedBook && (
          <div className="rfid-scan-section">
            <div className="selected-book-info">
              <h3>Step 2: Scan RFID Tags</h3>
              <div className="book-details">
                <strong>Book:</strong> {selectedBook.title}<br/>
                <strong>Author:</strong> {selectedBook.author}<br/>
                <strong>ISBN:</strong> {selectedBook.isbn}
              </div>
            </div>
            
            {/* Show existing copies */}
            <div className="copies-list">
              <h4>Existing Copies ({bookCopies.length})</h4>
              {bookCopies.length > 0 ? (
                <ul>
                  {bookCopies.map((copy) => (
                    <li key={copy.copy_id}>
                      RFID: <strong>{copy.rfid_uid}</strong> - Status: <span className={`status-${copy.status}`}>{copy.status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-copies">No copies added yet. Scan RFID tags below.</p>
              )}
            </div>
            
            <div className="rfid-ready">
              <div className="scan-indicator">
                Ready to scan RFID tag
              </div>
              <p className="instruction">
                Place RFID tag on the reader. The ESP32 will detect it automatically.
              </p>
              <p className="instruction success-text">
                When scanned, the copy will appear instantly above!
              </p>
            </div>
            
            <form onSubmit={handleManualSubmit} className="manual-input">
              <label>Manual RFID Input (if scanner not working):</label>
              <input
                type="text"
                value={rfidUID}
                onChange={(e) => setRfidUID(e.target.value.toUpperCase())}
                placeholder="Enter RFID UID manually..."
                className="rfid-input"
                disabled={loading}
              />
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? "Adding..." : "Add Copy"}
              </button>
            </form>
            
            <button 
              onClick={handleBackToSelect} 
              className="back-btn"
              disabled={loading}
            >
              ← Select Different Book
            </button>
          </div>
        )}
        
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
        
        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Adding book copy...</p>
          </div>
        )}
      </div>
    </div>
  );
}