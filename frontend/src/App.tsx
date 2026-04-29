import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./components/LandingPage";
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
import HealthApp from "./components/health/HealthApp";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const isAuth = localStorage.getItem("libAuth") === "true";
  return isAuth ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/health" element={<HealthApp />} />
        <Route path="/books" element={<BookSection />} />
        <Route path="/roomsBooking" element={<RoomsBooking />} />
        <Route path="/borrowings" element={<BorrowingsSection />} />
        <Route path="/analytics" element={<Analytics/>} />

        {/* These get sidebar */}
        <Route path="/scan-book" element={<ProtectedRoute><Dashboard><BookScanPage /></Dashboard></ProtectedRoute>} />
        <Route path="/borrow-book" element={<ProtectedRoute><Dashboard><BorrowBookPage /></Dashboard></ProtectedRoute>} />
        <Route path="/return-book" element={<ProtectedRoute><Dashboard><ReturnBookPage /></Dashboard></ProtectedRoute>} />
        <Route path="/add-book-copy" element={<ProtectedRoute><Dashboard><AddBookCopyPage /></Dashboard></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}