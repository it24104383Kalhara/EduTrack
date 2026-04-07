import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./components/Dashboard";
import BookSection from "./components/BookSection";
import BookScanPage from "./components/BookScanPage";
import RoomsBooking from "./components/RoomsBooking";
import BorrowingsSection from "./components/BorrowingsSection";
import BorrowBookPage from "./components/BorrowBookPage";
import ReturnBookPage from "./components/ReturnBookPage";
import AddBookCopyPage from "./components/AddBookCopyPage";
import Analytics from "./components/Analytics";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/books" element={<BookSection />} />
        <Route path="/roomsBooking" element={<RoomsBooking />} />
        <Route path="/borrowings" element={<BorrowingsSection />} />
        <Route path="/analytics" element={<Analytics/>} />
         
        {/* These get sidebar */}
        <Route path="/scan-book" element={<Dashboard><BookScanPage /></Dashboard>} />
        <Route path="/borrow-book" element={<Dashboard><BorrowBookPage /></Dashboard>} />
        <Route path="/return-book" element={<Dashboard><ReturnBookPage /></Dashboard>} />
        <Route path="/add-book-copy" element={<Dashboard><AddBookCopyPage /></Dashboard>} />
        
        
      </Routes>

    </BrowserRouter>
  );
}