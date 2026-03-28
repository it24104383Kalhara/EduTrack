import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Mail,
  ChevronDown,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: any) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const { logout, user } = useAuth();

  const [expandedSections, setExpandedSections] = React.useState({
    students: true,
    academics: true,
    system: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="sidebar" style={{
      width: '260px',
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      background: '#FFFFFF',
      color: '#1F2937',
      padding: '24px 0',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #E5E7EB',
      zIndex: 1000,
      overflowY: 'auto'
    }}>
      {/* Logo Area */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px 32px 24px',
        marginBottom: '8px'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          background: '#633194',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '12px',
          boxShadow: '0 4px 12px rgba(99, 49, 148, 0.2)'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" fillOpacity="0.4" />
            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#633194', lineHeight: 1 }}>EduTrack</h2>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#9D85C5', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>MANAGEMENT</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 16px' }}>
        <button
          className={`nav-button ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onViewChange('dashboard')}
          style={navButtonStyle(currentView === 'dashboard')}
        >
          <LayoutDashboard size={20} />
          Dashboard
        </button>

        <div 
          style={groupHeaderStyle} 
          onClick={() => toggleSection('students')}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 49, 148, 0.05)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={20} />
            Students
          </div>
          <ChevronDown 
            size={16} 
            opacity={0.5} 
            style={{ 
              transition: 'transform 0.3s ease',
              transform: expandedSections.students ? 'rotate(180deg)' : 'rotate(0deg)'
            }} 
          />
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          position: 'relative', 
          paddingLeft: '12px',
          overflow: 'hidden',
          maxHeight: expandedSections.students ? '500px' : '0',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: expandedSections.students ? 1 : 0
        }}>
          <div style={{ position: 'absolute', left: '20px', top: 0, bottom: 0, width: '1px', background: '#E5E7EB' }}></div>

          {user?.role === 'admin' && (
            <>
              <button
                className={`nav-button ${currentView === 'register' ? 'active' : ''}`}
                onClick={() => onViewChange('register')}
                style={subNavLinkStyle(currentView === 'register')}
              >
                Registration
              </button>
              <button
                className={`nav-button ${currentView === 'list' ? 'active' : ''}`}
                onClick={() => onViewChange('list')}
                style={subNavLinkStyle(currentView === 'list')}
              >
                Directory
              </button>
            </>
          )}
          <button
            className={`nav-button ${currentView === 'attendance' ? 'active' : ''}`}
            onClick={() => onViewChange('attendance')}
            style={subNavLinkStyle(currentView === 'attendance')}
          >
            Attendance Management
          </button>
        </div>

        <div 
          style={groupHeaderStyle} 
          onClick={() => toggleSection('academics')}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 49, 148, 0.05)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <GraduationCap size={20} />
            Academics
          </div>
          <ChevronDown 
            size={16} 
            opacity={0.5} 
            style={{ 
              transition: 'transform 0.3s ease',
              transform: expandedSections.academics ? 'rotate(180deg)' : 'rotate(0deg)'
            }} 
          />
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          position: 'relative', 
          paddingLeft: '12px',
          overflow: 'hidden',
          maxHeight: expandedSections.academics ? '500px' : '0',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: expandedSections.academics ? 1 : 0
        }}>
          <div style={{ position: 'absolute', left: '20px', top: 0, bottom: 0, width: '1px', background: '#E5E7EB' }}></div>

          {user?.role === 'admin' && (
            <>
              <button
                className={`nav-button ${currentView === 'grades' ? 'active' : ''}`}
                onClick={() => onViewChange('grades')}
                style={subNavLinkStyle(currentView === 'grades')}
              >
                Grade Management
              </button>
              <button
                className={`nav-button ${currentView === 'subjects' ? 'active' : ''}`}
                onClick={() => onViewChange('subjects')}
                style={subNavLinkStyle(currentView === 'subjects')}
              >
                Subject Management
              </button>
            </>
          )}
          <button
            className={`nav-button ${currentView === 'marks' ? 'active' : ''}`}
            onClick={() => onViewChange('marks')}
            style={subNavLinkStyle(currentView === 'marks')}
          >
            Marks Entry
          </button>
          <button
            className={`nav-button ${currentView === 'results' ? 'active' : ''}`}
            onClick={() => onViewChange('results')}
            style={subNavLinkStyle(currentView === 'results')}
          >
            Student Results
          </button>
        </div>

        <div 
          style={groupHeaderStyle} 
          onClick={() => toggleSection('system')}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 49, 148, 0.05)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Mail size={20} />
            System
          </div>
          <ChevronDown 
            size={16} 
            opacity={0.5} 
            style={{ 
              transition: 'transform 0.3s ease',
              transform: expandedSections.system ? 'rotate(180deg)' : 'rotate(0deg)'
            }} 
          />
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          position: 'relative', 
          paddingLeft: '12px',
          overflow: 'hidden',
          maxHeight: expandedSections.system ? '500px' : '0',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: expandedSections.system ? 1 : 0
        }}>
          <div style={{ position: 'absolute', left: '20px', top: 0, bottom: 0, width: '1px', background: '#E5E7EB' }}></div>

          <button
            className={`nav-button ${currentView === 'email-alerts' ? 'active' : ''}`}
            onClick={() => onViewChange('email-alerts')}
            style={subNavLinkStyle(currentView === 'email-alerts')}
          >
            Email Alerts
          </button>
          
          {user?.role === 'admin' && (
            <>
              <button
                className={`nav-button ${currentView === 'approvals' ? 'active' : ''}`}
                onClick={() => onViewChange('approvals')}
                style={subNavLinkStyle(currentView === 'approvals')}
              >
                Account Approvals
              </button>
              <button
                className={`nav-button ${currentView === 'teachers' ? 'active' : ''}`}
                onClick={() => onViewChange('teachers')}
                style={subNavLinkStyle(currentView === 'teachers')}
              >
                Teacher Directory
              </button>
            </>
          )}
        </div>
      </nav>

      <div style={{
        margin: '24px 16px 8px 16px',
        padding: '12px',
        background: '#F4F0FF',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: '#633194',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '16px',
            marginRight: '12px',
            boxShadow: '0 4px 8px rgba(99, 49, 148, 0.2)'
          }}>
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937' }}>
              {user?.username || 'User'}
            </div>
            <div style={{ fontSize: '12px', color: '#633194', fontWeight: 600, textTransform: 'capitalize', opacity: 0.8 }}>
              {user?.role || 'Staff'}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Logout"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#9CA3AF',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#EF4444'}
          onMouseOut={(e) => e.currentTarget.style.color = '#9CA3AF'}
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
};

// Styling Helpers
const navButtonStyle = (isActive: boolean) => ({
  background: isActive ? '#F4F0FF' : 'transparent',
  color: isActive ? '#633194' : '#6B7280',
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  borderRadius: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontSize: '15px',
  fontWeight: isActive ? 700 : 600,
  textAlign: 'left' as const,
  width: '100%',
  border: 'none',
  outline: 'none',
  marginBottom: '4px'
});

const subNavLinkStyle = (isActive: boolean) => ({
  background: isActive ? '#F4F0FF' : 'transparent',
  color: isActive ? '#633194' : '#6B7280',
  padding: '10px 16px 10px 32px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  borderRadius: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontSize: '14px',
  fontWeight: isActive ? 700 : 600,
  textAlign: 'left' as const,
  width: '100%',
  border: 'none',
  outline: 'none',
  position: 'relative' as const,
  zIndex: 2,
  borderLeft: isActive ? '3px solid #633194' : '3px solid transparent',
  borderTopLeftRadius: '0',
  borderBottomLeftRadius: '0',
  marginBottom: '2px'
});

const groupHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  fontSize: '15px',
  fontWeight: 700,
  color: '#633194',
  marginTop: '16px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  userSelect: 'none'
};

export default Sidebar;
