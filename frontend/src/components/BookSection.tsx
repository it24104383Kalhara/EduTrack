import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../css/BookSection.css";
import type { Book } from "../types/Book";

interface BookWithCopies extends Book {
  copy_count?: number;
}

export default function ManageBooks() {
  const [books, setBooks] = useState<BookWithCopies[]>([]);
  const [search, setSearch] = useState("");
  const [editingBook, setEditingBook] = useState<BookWithCopies | null>(null);
  const [updatedTitle, setUpdatedTitle] = useState("");
  const [updatedAuthor, setUpdatedAuthor] = useState("");
  const [updatedPublisher, setUpdatedPublisher] = useState("");
  const [updatedYear, setUpdatedYear] = useState("");
  const [loadingCopies, setLoadingCopies] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch("http://localhost:5000/books");
      const data: Book[] = await res.json();
      setBooks(data);
      
      // Fetch copy counts for each book
      fetchCopyCounts(data);
    } catch (err) {
      console.error("Error fetching books:", err);
    }
  };

  const fetchCopyCounts = async (books: Book[]) => {
    setLoadingCopies(true);
    try {
      const booksWithCounts = await Promise.all(
        books.map(async (book) => {
          try {
            const res = await fetch(`http://localhost:5000/esp/book/${book.book_id}`);
            const copies = await res.json();
            return { ...book, copy_count: copies.length };
          } catch (err) {
            return { ...book, copy_count: 0 };
          }
        })
      );
      setBooks(booksWithCounts);
    } catch (err) {
      console.error("Error fetching copy counts:", err);
    } finally {
      setLoadingCopies(false);
    }
  };

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(search.toLowerCase()) ||
    book.author?.toLowerCase().includes(search.toLowerCase()) ||
    book.isbn.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditClick = (book: BookWithCopies) => {
    setEditingBook(book);
    setUpdatedTitle(book.title);
    setUpdatedAuthor(book.author || "");
    setUpdatedPublisher(book.publisher || "");
    setUpdatedYear(book.published_year?.toString() || "");
  };

  const handleSaveUpdate = async () => {
    if (!editingBook) return;

    const payload = {
      title: updatedTitle,
      author: updatedAuthor,
      publisher: updatedPublisher,
      published_year: updatedYear ? Number(updatedYear) : null,
    };

    try {
      const res = await fetch(`http://localhost:5000/books/${editingBook.book_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update book");

      setBooks((prev) =>
        prev.map((b) =>
          b.book_id === editingBook.book_id
            ? { ...b, ...payload } as BookWithCopies
            : b
        )
      );

      setEditingBook(null);
    } catch (err) {
      console.error(err);
      alert("Error updating book");
    }
  };

  const handleDelete = async (book: BookWithCopies) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${book.title}"?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:5000/books/${book.book_id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete book");

      setBooks((prev) => prev.filter((b) => b.book_id !== book.book_id));
    } catch (err) {
      console.error(err);
      alert("Error deleting book");
    }
  };

  return (
    <div className="book-section">
      <h2>Manage Books</h2>

      <div className="book-buttons">
        <Link to="/scan-book">
          <button className="add-book-btn">
             Add New Book (Scan ISBN)
          </button>
        </Link>

        <Link to="/add-book-copy">
          <button className="add-copy-btn">
            Add Book Copy (Scan RFID)
          </button>
        </Link>
      </div>

      <input
        type="text"
        placeholder="Search by title, author, ISBN..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="book-search"
      />

      {filteredBooks.length === 0 ? (
        <p>No books found</p>
      ) : (
        <table className="book-table">
          <thead>
            <tr>
              <th>ISBN</th>
              <th>Title</th>
              <th>Author</th>
              <th>Publisher</th>
              <th>Year</th>
              <th>Copies</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBooks.map((book) => (
              <tr key={book.book_id}>
                <td>{book.isbn}</td>
                {editingBook?.book_id === book.book_id ? (
                  <>
                    <td><input value={updatedTitle} onChange={(e) => setUpdatedTitle(e.target.value)} /></td>
                    <td><input value={updatedAuthor} onChange={(e) => setUpdatedAuthor(e.target.value)} /></td>
                    <td><input value={updatedPublisher} onChange={(e) => setUpdatedPublisher(e.target.value)} /></td>
                    <td><input value={updatedYear} onChange={(e) => setUpdatedYear(e.target.value)} /></td>
                  </>
                ) : (
                  <>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.publisher}</td>
                    <td>{book.published_year}</td>
                  </>
                )}
                <td className="copy-count-cell">
                  {loadingCopies ? (
                    <span className="loading-copies">...</span>
                  ) : (
                    <span className={`copy-count ${book.copy_count === 0 ? "no-copies" : "has-copies"}`}>
                      {book.copy_count || 0} {book.copy_count === 1 ? "copy" : "copies"}
                    </span>
                  )}
                </td>
                <td>
                  {editingBook?.book_id === book.book_id ? (
                    <>
                      <button onClick={handleSaveUpdate}>Save</button>
                      <button onClick={() => setEditingBook(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEditClick(book)}>Update</button>
                      <button onClick={() => handleDelete(book)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}