import "./Sidebar.css";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
}: SidebarProps) {
  const tabs = [
    { id: "books", label: "Books" },
    { id: "borrowings", label: "Borrowings" },
    { id: "overdue", label: "Overdue & Fines" },
    { id: "attendance", label: "Attendance Records" },
    { id: "rooms", label: "Meeting Rooms & Labs" },
  ];

  return (
    <div className="sidebar">
      <h2 className="sidebar-title">📚EduTrack</h2>

      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`sidebar-btn ${
            activeTab === tab.id ? "active" : ""
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}