import { useState } from "react";
import Sidebar from "../components/Sidebar.tsx";
import BookSection from "../components/BookSection";
import BorrowingsSection from "../components/BorrowingsSection";
import OverdueFinesSection from "../components/OverdueFinesSection";
import AttendanceSection from "../components/AttendanceSection";
import RoomsSection from "../components/RoomsSection";
import Analytics from "../components/Analytics";
import "../css/Dashboard.css";

interface DashboardProps {
  children?: React.ReactNode;
}

export default function Dashboard({ children }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("books");

  // If children are provided (for routes like borrow-book), show children
  // Otherwise show the tab-based content
  if (children) {
    return (
      <div className="dashboard">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="content">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="content">
        {activeTab === "books" && <BookSection />}
        {activeTab === "borrowings" && <BorrowingsSection />}
        {activeTab === "overdue" && <OverdueFinesSection />}
        {activeTab === "attendance" && <AttendanceSection />}
        {activeTab === "rooms" && <RoomsSection />}
        {activeTab === "analytics" && <Analytics />}
      </div>
    </div>
  );
}