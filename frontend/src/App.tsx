import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Imesha/components/Dashboard";
import BookSection from "./Imesha/components/BookSection";
import BookScanPage from "./Imesha/components/BookScanPage";
import RoomsBooking from "./Imesha/components/RoomsBooking";
import BorrowingsSection from "./Imesha/components/BorrowingsSection";
import BorrowBookPage from "./Imesha/components/BorrowBookPage";
import ReturnBookPage from "./Imesha/components/ReturnBookPage";
import AddBookCopyPage from "./Imesha/components/AddBookCopyPage";
import Analytics from "./Imesha/components/Analytics";

// Sethmin health wrapper (manages state and sub-pages)
import HealthDashboardWrapper from "./Sethmin/HealthDashboardWrapper";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/books" element={<BookSection />} />
        <Route path="/roomsBooking" element={<RoomsBooking />} />
        <Route path="/borrowings" element={<BorrowingsSection />} />
        <Route path="/analytics" element={<Analytics />} />

        {/* These get sidebar */}
        <Route path="/scan-book" element={<Dashboard><BookScanPage /></Dashboard>} />
        <Route path="/borrow-book" element={<Dashboard><BorrowBookPage /></Dashboard>} />
        <Route path="/return-book" element={<Dashboard><ReturnBookPage /></Dashboard>} />
        <Route path="/add-book-copy" element={<Dashboard><AddBookCopyPage /></Dashboard>} />

        {/* Health route – uses wrapper */}
        <Route path="/health" element={<HealthDashboardWrapper />} />
      </Routes>
    </BrowserRouter>
  );
}