import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import QRScanner from "./QRScanner";
import type { Book } from "../types/Book";
import "../css/BookScanPage.css";

const BookScanPage: React.FC = () => {
  const [scannedIsbn, setScannedIsbn] = useState<string | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [savedBookId, setSavedBookId] = useState<number | null>(null);
  const [scanning, setScanning] = useState(false);
  const [copiesAdded, setCopiesAdded] = useState(0);
  const navigate = useNavigate();

  const extractYear = (dateStr: string): number | null => {
    if (!dateStr) return null;
    const match = dateStr.match(/\d{4}/);
    return match ? parseInt(match[0]) : null;
  };

  const handleScan = async (isbn: string) => {
    setScannedIsbn(isbn);
    try {
      const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
      if (!res.ok) {
        alert("Book not found in Open Library");
        setBook(null);
        return;
      }
      const data = await res.json();
      setBook({
        isbn,
        title: data.title || "Unknown",
        author: data.authors?.[0]?.name || "Unknown",
        publisher: data.publishers?.[0] || "Unknown",
        published_year: extractYear(data.publish_date),
        category: "N/A",
        description:
          typeof data.notes === "string"
            ? data.notes
            : data.notes?.value || "N/A",
      });
    } catch (err) {
      console.error(err);
      setBook(null);
    }
  };

  const resetScan = () => {
    setScannedIsbn(null);
    setBook(null);
    setSavedBookId(null);
    setScanning(false);
    setCopiesAdded(0);
  };

  const saveToDatabase = async () => {
    if (!book) return;
    try {
      const res = await fetch("http://localhost:5000/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(book),
      });

      if (!res.ok) {
        alert("Failed to save book");
        return;
      }

      const data = await res.json();
      setSavedBookId(data.id);
      alert(`Book saved! You can now scan RFID tags for its copies.`);
    } catch (err) {
      console.error(err);
      alert("Error saving book");
    }
  };

  const activateCopyScan = async () => {
    if (!savedBookId) return;
    try {
      await fetch("http://localhost:5000/esp/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_id: savedBookId }),
      });
      setScanning(true);
      setCopiesAdded(0);
    } catch (err) {
      console.error(err);
      alert("Failed to activate ESP32");
    }
  };

  const cancelCopyScan = async () => {
    try {
      await fetch("http://localhost:5000/esp/mode/cancel", { method: "POST" });
    } catch (err) {
      console.error(err);
    }
    setScanning(false);
    setCopiesAdded(0);
  };

  useEffect(() => {
    if (!scanning) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:5000/esp/mode");
        const data = await res.json();
        if (data.copies_added !== undefined) {
          setCopiesAdded(data.copies_added);
        }
      } catch (err) {
        console.error(err);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [scanning]);

  return (
    <div className="book-scan-page">
      <h2>Scan Book ISBN</h2>

      {!book && <QRScanner onScan={handleScan} />}
      {scannedIsbn && !book && <p className="scanning-info">Scanning ISBN: {scannedIsbn}…</p>}

      {book && (
        <div className="book-details">
          <h3>Book Details</h3>
          <p><b>Title:</b> {book.title}</p>
          <p><b>Author:</b> {book.author}</p>
          <p><b>Publisher:</b> {book.publisher}</p>
          <p><b>Year:</b> {book.published_year ?? "N/A"}</p>
          <p><b>Category:</b> {book.category}</p>
          <p><b>Description:</b> {book.description}</p>

          <div className="book-buttons">
            <button onClick={resetScan}>Scan Again</button>

            {!savedBookId && (
              <button onClick={saveToDatabase}>Save to Database</button>
            )}

            {savedBookId && (
              <div className="copy-scan-section">
                {!scanning ? (
                  <button onClick={activateCopyScan}>
                    📡 Scan Copy RFID
                  </button>
                ) : (
                  <div>
                    <div className="copy-scan-status">
                      <p>
                        ✅ {copiesAdded} {copiesAdded === 1 ? "copy" : "copies"} added — scan next tag now...
                      </p>
                    </div>
                    <div className="copy-scan-buttons">
                      <button className="scan-another-btn" onClick={activateCopyScan}>
                        ➕ Scan Another Copy
                      </button>
                      <button className="done-btn" onClick={cancelCopyScan}>
                        ✅ Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookScanPage;