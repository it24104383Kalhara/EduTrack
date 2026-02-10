import { useState } from "react";
import Health from "./components/health";
import Dashboard from "./components/Dashboard";
import StudentInfo from "./components/StudentInfo";
import ViewStudents from "./components/ViewStudents";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState<
    "dashboard" | "studentForm" | "viewStudents"
  >("dashboard");

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage("dashboard");
  };

  if (!isLoggedIn) {
    return <Health onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  if (currentPage === "studentForm") {
    return (
      <StudentInfo
        onLogout={handleLogout}
        onBack={() => setCurrentPage("dashboard")}
      />
    );
  }

  if (currentPage === "viewStudents") {
    return (
      <ViewStudents
        onLogout={handleLogout}
        onBack={() => setCurrentPage("dashboard")}
      />
    );
  }

  return (
    <Dashboard
      onLogout={handleLogout}
      onNavigateToStudentForm={() => setCurrentPage("studentForm")}
      onNavigateToViewStudents={() => setCurrentPage("viewStudents")}
    />
  );
}

export default App;
