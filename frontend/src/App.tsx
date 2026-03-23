import { useState } from "react";
import Health from "./components/health";
import Dashboard from "./components/Dashboard";
import StudentInfo from "./components/StudentInfo";
import ViewStudents from "./components/ViewStudents";
import ResetPassword from "./components/ResetPassword";
import HeartRateMonitor from "./components/HeartRateMonitor"; // Add this import
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [currentPage, setCurrentPage] = useState<
    "dashboard" | "studentForm" | "viewStudents" | "resetPassword" | "heartRate" // Add heartRate
  >("dashboard");

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    setCurrentPage("dashboard");
  };

  const handleLoginSuccess = (user: string) => {
    setUsername(user);
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return <Health onLoginSuccess={handleLoginSuccess} />;
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

  if (currentPage === "resetPassword") {
    return (
      <ResetPassword
        onBack={() => setCurrentPage("dashboard")}
        username={username}
      />
    );
  }

  // Add this new section
  if (currentPage === "heartRate") {
    return (
      <HeartRateMonitor
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
      onNavigateToResetPassword={() => setCurrentPage("resetPassword")}
      onNavigateToHeartRateMonitor={() => setCurrentPage("heartRate")} // Add this
    />
  );
}

export default App;
