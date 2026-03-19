import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import QRScanner from "./QRScanner";
import type { Book } from "../types/Book";
import "./BookScanPage.css";

const BookScanPage: React.FC = () => {
  const [scannedIsbn, setScannedIsbn] = useState<string | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const navigate = useNavigate();

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
        published_year: data.publish_date || "N/A",
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
  };

  const saveToDatabase = async () => {
    if (!book) return;
    try {
      const res = await fetch("http://localhost:3000/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(book),
      });

      if (!res.ok) {
        alert("Failed to save book");
        return;
      }

      const data = await res.json();
      alert(`Book saved! Database ID: ${data.id}`);
      resetScan();
    } catch (err) {
      console.error(err);
      alert("Error saving book");
    }
  };

  return (
    <div className="book-scan-page">
      <h2>Scan Book ISBN</h2>

      {/* Scanner rendered immediately */}
      {!book && <QRScanner onScan={handleScan} />}

      {/* Show scanning ISBN */}
      {scannedIsbn && !book && <p>Scanning ISBN: {scannedIsbn}…</p>}

      {/* Show book details */}
      {book && (
        <div className="book-details">
          <h3>Book Details</h3>
          <p><b>Title:</b> {book.title}</p>
          <p><b>Author:</b> {book.author}</p>
          <p><b>Publisher:</b> {book.publisher}</p>
          <p><b>Year:</b> {book.published_year}</p>
          <p><b>Category:</b> {book.category}</p>
          <p><b>Description:</b> {book.description}</p>

          <div className="book-buttons">
            <button onClick={resetScan}>Scan Again</button>
            <button onClick={saveToDatabase}>Save to Database</button>
            <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>

          </div>
        </div>
      )}
    </div>
  );
};

export default BookScanPage;