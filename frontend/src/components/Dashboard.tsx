import { useState } from "react";
import Sidebar from "../components/Sidebar.tsx";
import BookSection from "../components/BookSection";
import BorrowingsSection from "../components/BorrowingsSection";
import OverdueFinesSection from "../components/OverdueFinesSection";
import AttendanceSection from "../components/AttendanceSection";
import RoomsSection from "../components/RoomsSection";

import "./Dashboard.css";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("books");

  return (
    <div className="dashboard">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="content">
        {activeTab === "books" && <BookSection />}
        {activeTab === "borrowings" && <BorrowingsSection />}
        {activeTab === "overdue" && <OverdueFinesSection />}
        {activeTab === "attendance" && <AttendanceSection />}
        {activeTab === "rooms" && <RoomsSection />}
      </div>
    </div>
  );
}