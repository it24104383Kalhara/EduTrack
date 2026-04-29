import { useState } from "react";
import HealthDashboard from "./components/HealthDashboardProps";
import StudentInfo from "./components/StudentInfo";
import ViewStudents from "./components/ViewStudents";
import ResetPassword from "./components/ResetPassword";
import HeartRateMonitor from "./components/HeartRateMonitor";
import FindHospital from "./components/FindHospital";

export default function HealthDashboardWrapper() {
  const [currentPage, setCurrentPage] = useState<
    "dashboard" | "studentForm" | "viewStudents" | "resetPassword" | "heartRate" | "findHospital"
  >("dashboard");

  const handleLogout = () => {
    window.location.href = "/";
  };

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
        username="health"
      />
    );
  }

  if (currentPage === "heartRate") {
    return (
      <HeartRateMonitor
        onLogout={handleLogout}
        onBack={() => setCurrentPage("dashboard")}
      />
    );
  }

  if (currentPage === "findHospital") {
    return (
      <FindHospital
        onLogout={handleLogout}
        onBack={() => setCurrentPage("dashboard")}
      />
    );
  }

  return (
    <HealthDashboard
      onLogout={handleLogout}
      onNavigateToStudentForm={() => setCurrentPage("studentForm")}
      onNavigateToViewStudents={() => setCurrentPage("viewStudents")}
      onNavigateToResetPassword={() => setCurrentPage("resetPassword")}
      onNavigateToHeartRateMonitor={() => setCurrentPage("heartRate")}
      onNavigateToFindHospital={() => setCurrentPage("findHospital")}
    />
  );
}