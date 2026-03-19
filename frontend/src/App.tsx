import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./components/Dashboard";
import BookSection from "./components/BookSection";
import BookScanPage from "./components/BookScanPage";
import RoomsBooking from "./components/RoomsBooking"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/books" element={<BookSection />} />
        <Route path="/scan-book" element={<BookScanPage />} />
        <Route path="/roomsBooking" element={<RoomsBooking />} />

      </Routes>

    </BrowserRouter>
  );
}