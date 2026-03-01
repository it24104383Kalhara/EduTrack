import { useState, useEffect } from 'react';
import StudentList from './components/StudentList';
import StudentRegistrationForm from './components/StudentRegistrationForm';
import GradeManagement from './components/GradeManagement';
import SubjectManagement from './components/SubjectManagement';
import { gradeApi, studentApi } from './services/api';
import './App.css';

// Extend Window interface for global refresh function
declare global {
  interface Window {
    refreshDashboard?: () => Promise<void>;
  }
}

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'register' | 'list' | 'grades' | 'subjects'>('dashboard');
  const [studentCount, setStudentCount] = useState(0);
  const [gradeCount, setGradeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      
      // Fetch grades from backend API
      const gradesData = await gradeApi.getAll();
      setGradeCount(gradesData.length);
      
      // Fetch students from backend API only (no more localStorage)
      try {
        const backendStudents = await studentApi.getAll();
        setStudentCount(backendStudents.length);
      } catch (error) {
        console.log('Backend API not available');
        setStudentCount(0);
      }
      
    } catch (error) {
      console.error('Failed to fetch counts:', error);
      setStudentCount(0);
      setGradeCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Refresh counts when switching views
  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchCounts();
    }
  }, [currentView]);

  // Global refresh function that child components can call
  window.refreshDashboard = fetchCounts;

  // Listen for localStorage changes to refresh dashboard
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'students' || e.key === 'grades') {
        fetchCounts();
      }
    };

    // Also listen for custom events from localStorage updates
    const handleCustomStorageChange = () => {
      fetchCounts();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageUpdated', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdated', handleCustomStorageChange);
    };
  }, []);

  return (
    <div className="App" style={{ minHeight: '100vh', display: 'flex', background: '#0f172a' }}>
      {/* Sidebar Navigation */}
      <div style={{
        width: '320px',
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        backdropFilter: 'blur(20px)',
        boxShadow: '4px 0 40px rgba(0, 0, 0, 0.3)',
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        left: '0',
        top: '0',
        zIndex: '1000',
        borderRight: '1px solid rgba(148, 163, 184, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Logo/Brand */}
        <div style={{
          textAlign: 'center',
          padding: '20px 15px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px',
            fontSize: '1.8rem',
            color: 'white',
            fontWeight: 'bold',
            boxShadow: '0 6px 15px rgba(99, 102, 241, 0.3)',
            transform: 'rotate(-5deg)'
          }}>
            📚
          </div>
          <h2 style={{
            margin: '0',
            fontSize: '1.4rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.5px'
          }}>
            EduTrack
          </h2>
          <p style={{
            margin: '3px 0 0 0',
            fontSize: '0.75rem',
            color: '#94a3b8',
            fontWeight: '500'
          }}>
            Student Management System
          </p>
        </div>

        {/* Navigation Menu */}
        <div style={{ 
          flex: 1, 
          padding: '15px 12px'
        }}>
          <button
            onClick={() => setCurrentView('dashboard')}
            style={{
              width: '100%',
              padding: '12px',
              background: currentView === 'dashboard' 
                ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
                : 'rgba(30, 41, 59, 0.5)',
              color: currentView === 'dashboard' ? 'white' : '#e2e8f0',
              border: currentView === 'dashboard' ? 'none' : '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              marginBottom: '8px',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseOver={(e) => {
              if (currentView !== 'dashboard') {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                e.currentTarget.style.transform = 'translateX(5px)';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
              }
            }}
            onMouseOut={(e) => {
              if (currentView !== 'dashboard') {
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
              }
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>📊</span>
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView('register')}
            style={{
              width: '100%',
              padding: '12px',
              background: currentView === 'register' 
                ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
                : 'rgba(30, 41, 59, 0.5)',
              color: currentView === 'register' ? 'white' : '#e2e8f0',
              border: currentView === 'register' ? 'none' : '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              marginBottom: '8px',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseOver={(e) => {
              if (currentView !== 'register') {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                e.currentTarget.style.transform = 'translateX(5px)';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
              }
            }}
            onMouseOut={(e) => {
              if (currentView !== 'register') {
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
              }
            }}
          >
            <span style={{ 
              fontSize: '1.3rem',
              filter: currentView === 'register' ? 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' : 'none'
            }}>📝</span>
            <div>
              <div style={{ marginBottom: '4px' }}>Register Student</div>
              <div style={{
                fontSize: '0.85rem',
                opacity: currentView === 'register' ? 0.9 : 0.6,
                fontWeight: '400'
              }}>
                Add new student to system
              </div>
            </div>
            {currentView === 'register' && (
              <div style={{
                position: 'absolute',
                right: '20px',
                width: '8px',
                height: '8px',
                background: '#10b981',
                borderRadius: '50%',
                boxShadow: '0 0 10px #10b981'
              }} />
            )}
          </button>

          <button
            onClick={() => setCurrentView('list')}
            style={{
              width: '100%',
              padding: '12px',
              background: currentView === 'list' 
                ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
                : 'rgba(30, 41, 59, 0.5)',
              color: currentView === 'list' ? 'white' : '#e2e8f0',
              border: currentView === 'list' ? 'none' : '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              marginBottom: '8px',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseOver={(e) => {
              if (currentView !== 'list') {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                e.currentTarget.style.transform = 'translateX(5px)';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
              }
            }}
            onMouseOut={(e) => {
              if (currentView !== 'list') {
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
              }
            }}
          >
            <span style={{ 
              fontSize: '1.3rem',
              filter: currentView === 'list' ? 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' : 'none'
            }}>📋</span>
            <div>
              <div style={{ marginBottom: '4px' }}>View Students</div>
              <div style={{
                fontSize: '0.85rem',
                opacity: currentView === 'list' ? 0.9 : 0.6,
                fontWeight: '400'
              }}>
                Browse all registered students
              </div>
            </div>
            {currentView === 'list' && (
              <div style={{
                position: 'absolute',
                right: '20px',
                width: '8px',
                height: '8px',
                background: '#10b981',
                borderRadius: '50%',
                boxShadow: '0 0 10px #10b981'
              }} />
            )}
          </button>

          <button
            onClick={() => setCurrentView('grades')}
            style={{
              width: '100%',
              padding: '12px',
              background: currentView === 'grades' 
                ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
                : 'rgba(30, 41, 59, 0.5)',
              color: currentView === 'grades' ? 'white' : '#e2e8f0',
              border: currentView === 'grades' ? 'none' : '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              marginBottom: '8px',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseOver={(e) => {
              if (currentView !== 'grades') {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                e.currentTarget.style.transform = 'translateX(5px)';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
              }
            }}
            onMouseOut={(e) => {
              if (currentView !== 'grades') {
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
              }
            }}
          >
            <span style={{ 
              fontSize: '1.3rem',
              filter: currentView === 'grades' ? 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' : 'none'
            }}>📚</span>
            <div>
              <div style={{ marginBottom: '4px' }}>Manage Grades</div>
              <div style={{
                fontSize: '0.85rem',
                opacity: currentView === 'grades' ? 0.9 : 0.6,
                fontWeight: '400'
              }}>
                Create and manage school grades
              </div>
            </div>
            {currentView === 'grades' && (
              <div style={{
                position: 'absolute',
                right: '20px',
                width: '8px',
                height: '8px',
                background: '#10b981',
                borderRadius: '50%',
                boxShadow: '0 0 10px #10b981'
              }} />
            )}
          </button>

          <button
            onClick={() => setCurrentView('subjects')}
            style={{
              width: '100%',
              padding: '12px',
              background: currentView === 'subjects' 
                ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
                : 'rgba(30, 41, 59, 0.5)',
              color: currentView === 'subjects' ? 'white' : '#e2e8f0',
              border: currentView === 'subjects' ? 'none' : '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              marginBottom: '8px',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseOver={(e) => {
              if (currentView !== 'subjects') {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                e.currentTarget.style.transform = 'translateX(5px)';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
              }
            }}
            onMouseOut={(e) => {
              if (currentView !== 'subjects') {
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
              }
            }}
          >
            <span style={{ 
              fontSize: '1.3rem',
              filter: currentView === 'subjects' ? 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' : 'none'
            }}>📖</span>
            <div>
              <div style={{ marginBottom: '4px' }}>Manage Subjects</div>
              <div style={{
                fontSize: '0.85rem',
                opacity: currentView === 'subjects' ? 0.9 : 0.6,
                fontWeight: '400'
              }}>
                Create and manage subjects
              </div>
            </div>
            {currentView === 'subjects' && (
              <div style={{
                position: 'absolute',
                right: '20px',
                width: '8px',
                height: '8px',
                background: '#10b981',
                borderRadius: '50%',
                boxShadow: '0 0 10px #10b981'
              }} />
            )}
          </button>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: '20px',
          borderTop: '1px solid rgba(148, 163, 184, 0.1)',
          color: '#64748b',
          fontSize: '0.75rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              background: '#10b981',
              borderRadius: '50%',
              boxShadow: '0 0 10px #10b981'
            }} />
            <span>System Active</span>
          </div>
          <div>EduTrack Pro v2.0.0</div>
          <div style={{ marginTop: '5px', fontSize: '0.75rem' }}>© 2024 All rights reserved</div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        marginLeft: '320px',
        width: '100%',
        minWidth: 0,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        minHeight: '100vh',
        position: 'relative'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 0 10 L 10 0 M 0 20 L 20 20 M 10 10 L 30 10 M 10 30 L 40 30" stroke="rgba(99, 102, 241, 0.05)" stroke-width="0.5"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100" height="100" fill="url(%23grid)"/%3E%3C/svg%3E")',
          opacity: '0.3'
        }} />
        
        {/* Content */}
        <div style={{ position: 'relative', zIndex: '1' }}>
          {currentView === 'dashboard' ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100vh',
              color: '#e2e8f0',
              fontSize: '3rem',
              fontWeight: '700',
              textAlign: 'center',
              padding: '60px',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #1e293b 75%, #0f172a 100%)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Animated Background Elements */}
              <div style={{
                position: 'absolute',
                top: '10%',
                left: '10%',
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
                borderRadius: '50%'
              }} />
              <div style={{
                position: 'absolute',
                top: '60%',
                right: '15%',
                width: '150px',
                height: '150px',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
                borderRadius: '50%'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '20%',
                left: '20%',
                width: '100px',
                height: '100px',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
                borderRadius: '50%'
              }} />
              
              {/* Grid Pattern Overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `
                  linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
                opacity: '0.5'
              }} />
              
              {/* Main Dashboard Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 50%, rgba(15, 23, 42, 0.9) 100%)',
                backdropFilter: 'blur(20px)',
                borderRadius: '32px',
                padding: '120px 180px',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 100px rgba(99, 102, 241, 0.2)',
                maxWidth: '800px',
                width: '100%',
                position: 'relative',
                zIndex: '10',
                overflow: 'hidden'
              }}>
                {/* Inner Glow Effect */}
                <div style={{
                  position: 'absolute',
                  top: '-2px',
                  left: '-2px',
                  right: '-2px',
                  bottom: '-2px',
                  background: 'linear-gradient(45deg, #6366f1, #8b5cf6, #3b82f6, #6366f1)',
                  borderRadius: '32px',
                  zIndex: '-1',
                  opacity: '0.7',
                  filter: 'blur(10px)'
                }} />
                
                <div style={{ fontSize: '6rem', marginBottom: '30px', filter: 'drop-shadow(0 0 30px rgba(99, 102, 241, 0.8)' }}>📊</div>
                <div style={{ marginBottom: '20px', letterSpacing: '-1px', textShadow: '0 0 20px rgba(99, 102, 241, 0.5)' }}>Dashboard</div>
                
                {/* Student Count Display */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)',
                  borderRadius: '20px',
                  padding: '30px',
                  margin: '20px 0',
                  border: '1px solid rgba(148, 163, 184, 0.4)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '500', marginBottom: '8px', opacity: 0.9 }}>
                    Total Students in School
                  </div>
                  <div style={{ 
                    fontSize: '4rem', 
                    fontWeight: '800', 
                    color: '#fff',
                    textShadow: '0 0 30px rgba(99, 102, 241, 0.8)',
                    lineHeight: '1',
                    position: 'relative'
                  }}>
                    {loading ? '...' : studentCount}
                  </div>
                </div>

                {/* Grade Count Display */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.3) 100%)',
                  borderRadius: '20px',
                  padding: '30px',
                  margin: '20px 0',
                  border: '1px solid rgba(148, 163, 184, 0.4)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '500', marginBottom: '8px', opacity: 0.9 }}>
                    Total Grades in School
                  </div>
                  <div style={{ 
                    fontSize: '4rem', 
                    fontWeight: '800', 
                    color: '#fff',
                    textShadow: '0 0 30px rgba(16, 185, 129, 0.8)',
                    lineHeight: '1',
                    position: 'relative'
                  }}>
                    {loading ? '...' : gradeCount}
                  </div>
                </div>

                {/* Clear Local Storage Button */}
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all local storage data? This will remove any demo data and force the app to use only the database.')) {
                      localStorage.clear();
                      fetchCounts(); // Refresh the counts
                      alert('Local storage cleared successfully! The app will now use only database data.');
                    }
                  }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.3) 100%)',
                    borderRadius: '12px',
                    padding: '12px 20px',
                    margin: '15px 0',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 6px 20px rgba(239, 68, 68, 0.3)',
                    color: '#fff',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    width: 'auto',
                    minWidth: '200px',
                    textAlign: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.5) 0%, rgba(220, 38, 38, 0.5) 100%)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.3) 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  🗑️ Clear Storage
                </button>
                
                <div style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: '400', 
                  marginTop: '20px', 
                  opacity: 0.8,
                  lineHeight: '1.6'
                }}>
                  Welcome to EduTrack Student Management System<br/>
                  Select an option from the sidebar to get started
                </div>
              </div>
            </div>
          ) : currentView === 'register' ? <StudentRegistrationForm /> : currentView === 'grades' ? <GradeManagement /> : currentView === 'subjects' ? (
            <SubjectManagement /> 
          ) : <StudentList />}
        </div>
      </div>
    </div>
  );
};

export default App;
