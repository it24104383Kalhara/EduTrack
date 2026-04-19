import { useState } from 'react';
import Header from './Header';
import HostelDashboardPage from './HostelDashboardPage';
import HostelRoomManagementPage from './HostelRoomManagementPage';
import HostelStudentAssignmentPage from './HostelStudentAssignmentPage';
import HostelPaymentManagementPage from './HostelPaymentManagementPage';
import StudentRegistrationPage from './StudentRegistrationPage';
import './DashboardPage.css';

const HostelMainPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'rooms', label: 'Room Management', icon: '🏠' },
    { id: 'assignment', label: 'Student Assignment', icon: '👥' },
    { id: 'payments', label: 'Payment Management', icon: '💳' },
    { id: 'register', label: 'Student Registration', icon: '📝' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <HostelDashboardPage />;
      case 'rooms':
        return <HostelRoomManagementPage />;
      case 'assignment':
        return <HostelStudentAssignmentPage />;
      case 'payments':
        return <HostelPaymentManagementPage />;
      case 'register':
        return <StudentRegistrationPage />;
      default:
        return <HostelDashboardPage />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Navigation Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #ddd',
        padding: '0 20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1 style={{ margin: '20px 0', color: '#333', fontSize: '24px' }}>
            🏫 EduTrack Hostel Management
          </h1>
        </div>
        
        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '0' }}>
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                backgroundColor: activeTab === item.id ? '#007bff' : 'transparent',
                color: activeTab === item.id ? 'white' : '#666',
                border: 'none',
                padding: '15px 25px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === item.id ? 'bold' : 'normal',
                borderBottom: activeTab === item.id ? '3px solid #0056b3' : '3px solid transparent',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <main>
        {renderContent()}
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#333',
        color: 'white',
        textAlign: 'center',
        padding: '20px',
        marginTop: '40px'
      }}>
        <p style={{ margin: 0 }}>
          © 2024 EduTrack Hostel Management System. All rights reserved.
        </p>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
          Managing hostel operations efficiently with modern technology.
        </p>
      </footer>
    </div>
  );
};

export default HostelMainPage;
