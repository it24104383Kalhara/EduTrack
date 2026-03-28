import { useState, useEffect } from 'react';
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
import LoginPage from './components/LoginPage';
import './App.css';

// Extend Window interface for global refresh function
declare global {
  interface Window {
    refreshDashboard?: () => Promise<void>;
  }
}

function MainApp() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'register' | 'list' | 'grades' | 'subjects' | 'marks' | 'attendance' | 'email-alerts' | 'results' | 'approvals' | 'teachers'>('dashboard');
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

  const fetchCounts = async () => {
    try {
      setLoading(true);

      // Fetch grades from backend API
      const gradesData = await gradeApi.getAll();
      setGradeCount(gradesData.length);

      // Fetch students from backend API only (no more localStorage)
      let maleCount = 0;
      let femaleCount = 0;

      try {
        const backendStudents = await studentApi.getAll();
        setStudentCount(backendStudents.length);

        // Count genders
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

      // Fetch subjects from backend API
      try {
        const subjectsData = await subjectApi.getAll();
        setSubjectCount(subjectsData.length);
      } catch {
        console.log('Subjects API not available');
        setSubjectCount(0);
      }

      // Fetch dashboard chart data
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

  // Refresh counts when switching views
  useEffect(() => {
    if (currentView === 'dashboard' && user) {
      fetchCounts();
    }
  }, [currentView, user]);

  // Global refresh function that child components can call
  window.refreshDashboard = fetchCounts;

  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div style={{ padding: '20px', fontSize: '18px', color: '#6B7280' }}>Loading EduTrack...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="App" style={{ minHeight: '100vh', display: 'flex', background: '#F9FAFB', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        width: '100%',
        minWidth: 0,
        background: '#F8F7FF',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: '260px',
      }}>
        {/* Scrollable Content Container */}
        <div style={{
          flex: 1,
          padding: currentView === 'attendance' ? '0' : '16px' // Zero padding for attendance to fill space
        }}>
          {currentView === 'dashboard' ? (
            <Dashboard
              gradeCount={gradeCount}
              studentCount={studentCount}
              subjectCount={subjectCount}
              genderData={genderData}
              performanceData={performanceData}
              attendanceTrends={attendanceTrends}
              recentActivity={recentActivity}
              loading={loading}
            />
          ) : currentView === 'register' ? <StudentRegistrationForm /> :
            currentView === 'list' ? <StudentList /> :
              currentView === 'grades' ? <GradeManagement /> :
                currentView === 'subjects' ? <SubjectManagement /> :
                  currentView === 'marks' ? <MarksManagement /> :
                    currentView === 'attendance' ? <AttendanceManagement /> :
                      currentView === 'email-alerts' ? <EmailAlertLogs /> :
                        currentView === 'results' ? <StudentResults /> : 
                          currentView === 'approvals' ? <AdminApprovals /> : 
                            currentView === 'teachers' ? <TeacherManagement /> : <StudentList />}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
