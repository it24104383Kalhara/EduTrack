import "./Dashboard.css";

interface DashboardProps {
  onLogout: () => void;
  onNavigateToStudentForm: () => void;
  onNavigateToViewStudents: () => void;
}

function Dashboard({
  onLogout,
  onNavigateToStudentForm,
  onNavigateToViewStudents,
}: DashboardProps) {
  return (
    <div className="dashboard-page">
      <button className="logout-btn" onClick={onLogout}>
        Logout
      </button>
      <h1>Health Management Dashboard</h1>
      <div className="dashboard-grid">
        <div className="dashboard-card" onClick={onNavigateToStudentForm}>
          <h2>Add Student Details</h2>
          <p>Register new student health information</p>
        </div>
        <div className="dashboard-card" onClick={onNavigateToViewStudents}>
          <h2>View Student Details</h2>
          <p>View all registered students</p>
        </div>
        <div className="dashboard-card">
          <h2>Find Hospital</h2>
          <p>Search for nearest hospitals</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
