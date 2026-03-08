import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import ActivitiesPage from "./pages/sports/ActivitiesPage";
import ActivityMembersPage from "./pages/sports/ActivityMembersPage";
import AttendancePage from "./pages/sports/AttendancePage";
import AttendanceReportPage from "./pages/sports/AttendanceReportPage";
import PrincipalDashboard from "./pages/sports/PrincipalDashboard";
import TeacherNotificationsPage from "./pages/sports/TeacherNotificationsPage";
import InventoryPage from "./pages/sports/InventoryPage";
import { ProtectedRoute } from "./utils/auth";
import { useState } from "react";

function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sports/activities"
            element={
              <ProtectedRoute>
                {/* Wrap specific page in layout */}
                <DashboardLayout>
                  <ActivitiesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sports/activities/:id/members"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ActivityMembersPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sports/attendance"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AttendancePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sports/attendance/report"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AttendanceReportPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sports/inventory"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <InventoryPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sports/principal"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <DashboardLayout>
                  <PrincipalDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sports/teacher-notifications"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <DashboardLayout>
                  <TeacherNotificationsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          {/* Placeholder for future routes */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
