import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Hotel, Contact, Mail, LogOut, Radio } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoomsPage from './pages/RoomsPage';
import RoomDetailsPage from './pages/RoomDetailsPage';
import StudentsPage from './pages/StudentsPage';
import PaymentsPage from './pages/PaymentsPage';
import EmailsPage from './pages/EmailsPage';
import AttendancePage from './pages/AttendancePage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import './index.css';

function AppContent() {
  const { token, logout } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <div className={token && !isLoginPage ? "app-container" : ""}>
      {/* Sidebar - only show if NOT on login page and HAS token */}
      {!isLoginPage && token && (
        <nav className="sidebar">
          <h2>
            <Hotel className="w-8 h-8" style={{ color: 'var(--primary)' }} />
            EduHostel
          </h2>
          <div className="nav-links" style={{ marginTop: '2rem' }}>
            <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/students" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Contact size={20} />
              <span>Students</span>
            </NavLink>
            <NavLink to="/rooms" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users size={20} />
              <span>Rooms</span>
            </NavLink>
            <NavLink to="/payments" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <CreditCard size={20} />
              <span>Payments</span>
            </NavLink>
            <NavLink to="/emails" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Mail size={20} />
              <span>Emails</span>
            </NavLink>
            <NavLink to="/attendance" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Radio size={20} />
              <span>Attendance</span>
            </NavLink>
            
            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <button onClick={handleLogout} className="nav-link" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className={token && !isLoginPage ? "main-content" : ""} style={{ minHeight: '100vh', flex: 1, width: '100%' }}>
        <Routes>
          <Route path="/login" element={!token ? <LoginPage /> : <Navigate to="/" />} />
          
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
          <Route path="/rooms" element={<ProtectedRoute><RoomsPage /></ProtectedRoute>} />
          <Route path="/rooms/:id" element={<ProtectedRoute><RoomDetailsPage /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
          <Route path="/emails" element={<ProtectedRoute><EmailsPage /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
