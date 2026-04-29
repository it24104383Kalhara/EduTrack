import { useState } from "react";
import Health from "./health";
import Dashboard from "./Dashboard";
import StudentInfo from "./Studentinfo";
import ViewStudents from "./ViewStudents";
import FindHospital from "./FindHospital";
import HeartRateMonitor from "./HeartRateMonitor";

type Page = "login" | "dashboard" | "student-form" | "view-students" | "find-hospital" | "heart-rate";

export default function HealthApp() {
  const [page, setPage] = useState<Page>("login");

  if (page === "dashboard") {
    return (
      <Dashboard
        onLogout={() => setPage("login")}
        onNavigateToStudentForm={() => setPage("student-form")}
        onNavigateToViewStudents={() => setPage("view-students")}
        onNavigateToResetPassword={() => {}}
        onNavigateToHeartRateMonitor={() => setPage("heart-rate")}
        onNavigateToFindHospital={() => setPage("find-hospital")}
      />
    );
  }

  if (page === "student-form") {
    return (
      <StudentInfo
        onLogout={() => setPage("login")}
        onBack={() => setPage("dashboard")}
      />
    );
  }

  if (page === "view-students") {
    return (
      <ViewStudents
        onLogout={() => setPage("login")}
        onBack={() => setPage("dashboard")}
      />
    );
  }

  if (page === "heart-rate") {
    return (
      <HeartRateMonitor
        onLogout={() => setPage("login")}
        onBack={() => setPage("dashboard")}
      />
    );
  }

  if (page === "find-hospital") {
    return (
      <FindHospital
        onLogout={() => setPage("login")}
        onBack={() => setPage("dashboard")}
      />
    );
  }

  return <Health onLoginSuccess={() => setPage("dashboard")} />;
}
