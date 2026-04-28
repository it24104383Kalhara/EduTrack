import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Student Progress Components
import StudentList from './components/StudentList';
import StudentRegistrationForm from './components/StudentRegistrationForm';
import GradeManagement from './components/GradeManagement';
import SubjectManagement from './components/SubjectManagement';
import MarksManagement from './components/MarksManagement';
import AttendanceManagement from './components/AttendanceManagement';
import EmailAlertLogs from './components/EmailAlertLogs';
import Dashboard from './components/Dashboard';
import StudentResults from './components/StudentResults';
import Sidebar from './components/Sidebar';
import AdminApprovals from './components/AdminApprovals';
import TeacherManagement from './components/TeacherManagement';
import { gradeApi, studentApi, subjectApi, marksApi, attendanceApi, dashboardApi } from './services/api';
import type { RecentActivity } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import StudentLoginPage from './components/LoginPage';
import './App.css';

// Sport Management Components
import LandingPage from "./pages/LandingPage";
import SportsLoginPage from "./pages/auth/LoginPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import ActivitiesPage from "./pages/sports/ActivitiesPage";
import ActivityMembersPage from "./pages/sports/ActivityMembersPage";
import AttendancePage from "./pages/sports/AttendancePage";
import AttendanceReportPage from "./pages/sports/AttendanceReportPage";
import PrincipalDashboard from "./pages/sports/PrincipalDashboard";
import TeacherNotificationsPage from "./pages/sports/TeacherNotificationsPage";
import InventoryPage from "./pages/sports/InventoryPage";
import AchievementsPage from "./pages/sports/AchievementsPage";
import DashBoardPage from "./pages/DashBoardPage";
import { ProtectedRoute } from "./utils/auth";

// Extend Window interface for global refresh function
declare global {
  interface Window {
    refreshDashboard?: () => Promise<void>;
  }
}

// Student Progress Layout and Routing
function StudentProgressLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Map route to currentView for Sidebar highlighting
  const currentPath = location.pathname.split('/').pop() || '';
  const currentView = ['academic', ''].includes(currentPath) ? 'dashboard' : currentPath;

  const [loading, setLoading] = useState(true);
  const [gradeCount, setGradeCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [subjectCount, setSubjectCount] = useState(0);
  const [genderData, setGenderData] = useState({ male: 0, female: 0 });
  const [performanceData, setPerformanceData] = useState<{ grade_name: string, average_percentage: number }[]>([]);
  const [attendanceTrends, setAttendanceTrends] = useState<{ day: string, attendance_percentage: number, date: string, grade_name?: string, grade_id?: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCounts();
    }
  }, [user]);

  // Security enforcement: Restrict teachers from accessing admin-only views
  useEffect(() => {
    if (user?.role === 'teacher') {
      const adminOnlyViews = ['register', 'list', 'grades', 'subjects', 'approvals', 'teachers'];
      if (adminOnlyViews.includes(currentView)) {
        navigate('/academic');
      }
    }
  }, [user, currentView, navigate]);

  const fetchCounts = async () => {
    try {
      setLoading(true);

      const gradesData = await gradeApi.getAll();
      setGradeCount(gradesData.length);

      let maleCount = 0;
      let femaleCount = 0;

      try {
        const backendStudents = await studentApi.getAll();
        setStudentCount(backendStudents.length);

        backendStudents.forEach(student => {
          if (student.gender?.toLowerCase() === 'male') {
            maleCount++;
          } else if (student.gender?.toLowerCase() === 'female') {
            femaleCount++;
          }
        });

        setGenderData({ male: maleCount, female: femaleCount });
      } catch {
        console.log('Backend API not available');
        setStudentCount(0);
        setGenderData({ male: 0, female: 0 });
      }

      try {
        const subjectsData = await subjectApi.getAll();
        setSubjectCount(subjectsData.length);
      } catch {
        console.log('Subjects API not available');
        setSubjectCount(0);
      }

      try {
        const perfData = await marksApi.getAllGradesPerformance('First Term');
        setPerformanceData(perfData);

        const trendsData = await attendanceApi.getWeeklyTrends();
        setAttendanceTrends(trendsData);

        const activityData = await dashboardApi.getRecentActivity();
        setRecentActivity(activityData);
      } catch (error) {
        console.error('Failed to fetch dashboard chart data:', error);
      }

    } catch (error) {
      console.error('Failed to fetch counts:', error);
      setGradeCount(0);
      setSubjectCount(0);
    } finally {
      setLoading(false);
    }
  };

  window.refreshDashboard = fetchCounts;

  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div style={{ padding: '20px', fontSize: '18px', color: '#6B7280' }}>Loading EduTrack...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="App" style={{ minHeight: '100vh', display: 'flex', background: '#F9FAFB', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar 
        currentView={currentView} 
        onViewChange={(view) => navigate(`/academic${view === 'dashboard' ? '' : `/${view}`}`)} 
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, width: '100%', minWidth: 0, background: '#F8F7FF', display: 'flex', flexDirection: 'column', marginLeft: '260px' }}>
        <div style={{ flex: 1, padding: currentView === 'attendance' ? '0' : '16px' }}>
          <Routes>
            <Route path="/" element={<Dashboard gradeCount={gradeCount} studentCount={studentCount} subjectCount={subjectCount} genderData={genderData} performanceData={performanceData} attendanceTrends={attendanceTrends} recentActivity={recentActivity} loading={loading} />} />
            <Route path="register" element={<StudentRegistrationForm />} />
            <Route path="list" element={<StudentList />} />
            <Route path="grades" element={<GradeManagement />} />
            <Route path="subjects" element={<SubjectManagement />} />
            <Route path="marks" element={<MarksManagement />} />
            <Route path="attendance" element={<AttendanceManagement />} />
            <Route path="email-alerts" element={<EmailAlertLogs />} />
            <Route path="results" element={<StudentResults />} />
            <Route path="approvals" element={<AdminApprovals />} />
            <Route path="teachers" element={<TeacherManagement />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

// Wrapper to provide Academic AuthProvider only for student-facing routes
function AcademicAuthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  );
}

function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />

          {/* Student Progress Login - wrapped in Academic Auth */}
          <Route path="/login" element={
            <AcademicAuthWrapper>
              <StudentLoginPage />
            </AcademicAuthWrapper>
          } />

          {/* Student Progress (Academic) Routes - wrapped in Academic Auth */}
          <Route path="/academic/*" element={
            <AcademicAuthWrapper>
              <StudentProgressLayout />
            </AcademicAuthWrapper>
          } />

          {/* Sport Management Login - fully independent */}
          <Route path="/sports/login" element={<SportsLoginPage />} />

          {/* Sport Management Routes - uses its own ProtectedRoute from utils/auth */}
          <Route path="/sports" element={<Navigate to="/sports/dashboard" replace />} />
          <Route path="/sports/dashboard" element={<ProtectedRoute><DashboardLayout><DashBoardPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/sports/activities" element={<ProtectedRoute><DashboardLayout><ActivitiesPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/sports/activities/:id/members" element={<ProtectedRoute><DashboardLayout><ActivityMembersPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/sports/attendance" element={<ProtectedRoute allowedRoles={['Admin', 'Coach']}><DashboardLayout><AttendancePage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/sports/attendance/report" element={<ProtectedRoute allowedRoles={['Admin', 'Coach']}><DashboardLayout><AttendanceReportPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/sports/inventory" element={<ProtectedRoute allowedRoles={['Admin', 'Coach']}><DashboardLayout><InventoryPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/sports/achievements" element={<ProtectedRoute><DashboardLayout><AchievementsPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/sports/principal" element={<ProtectedRoute allowedRoles={['Admin']}><DashboardLayout><PrincipalDashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/sports/teacher-notifications" element={<ProtectedRoute allowedRoles={['Admin', 'Teacher']}><DashboardLayout><TeacherNotificationsPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/sports/facilities" element={<ProtectedRoute><DashboardLayout><div className="p-8">Facilities Management (Coming Soon)</div></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']}><DashboardLayout><div className="p-8">System Administration (Coming Soon)</div></DashboardLayout></ProtectedRoute>} />

          {/* Legacy/Common Redirects */}
          <Route path="/dashboard" element={<Navigate to="/sports/dashboard" replace />} />
          <Route path="/academics" element={<Navigate to="/academic" replace />} />

          {/* Catch-all for Sports to stay in Sports module */}
          <Route path="/sports/*" element={<Navigate to="/sports/dashboard" replace />} />

          {/* Global Catch-all - go to landing page, not academic (which triggers login redirect) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
