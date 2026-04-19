import { useState, useEffect } from 'react'
import Header from './Header'
import RoomManagementPage from './RoomManagementPage'
import StudentRegistrationPage from './StudentRegistrationPage'
import StudentRoomAssignmentPage from './StudentRoomAssignmentPage'
import AttendanceManagementPage from './AttendanceManagementPage'
import FeeManagementPage from './FeeManagementPage'

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [studentsInHostel, setStudentsInHostel] = useState(0)
  const [numberOfRooms, setNumberOfRooms] = useState(0)

  useEffect(() => {
    // Load students count
    const savedStudents = localStorage.getItem('students')
    if (savedStudents) {
      const studentsData = JSON.parse(savedStudents)
      const hostelStudents = studentsData.filter((student: any) => student.assignedRoom)
      setStudentsInHostel(hostelStudents.length)
    }
    
    // Load rooms count
    const savedRooms = localStorage.getItem('rooms')
    if (savedRooms) {
      const roomsData = JSON.parse(savedRooms)
      setNumberOfRooms(roomsData.length)
    }
  }, [])

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'room-management', label: 'Room Management', icon: '🏠' },
    { id: 'student-registration', label: 'Student Registration', icon: '👨‍🎓' },
    { id: 'student-room-assignment', label: 'Student Room Assignment', icon: '🏫' },
    { id: 'attendance-management', label: 'Attendance Management', icon: '📝' },
    { id: 'fee-management', label: 'Fee Management', icon: '💰' }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            <h2 className="page-title">Dashboard</h2>
            <div className="dashboard-cards">
              <div className="hostel-student-card">
                <div className="card-icon">🏫</div>
                <div className="card-content">
                  <h3>{studentsInHostel}</h3>
                  <p>Number of students</p>
                </div>
              </div>
              <div className="room-count-card">
                <div className="card-icon">🏠</div>
                <div className="card-content">
                  <h3>{numberOfRooms}</h3>
                  <p>Number of rooms</p>
                </div>
              </div>
            </div>
          </div>
        )
      case 'room-management':
        return <RoomManagementPage />
      case 'student-registration':
        return <StudentRegistrationPage />
      case 'student-room-assignment':
        return <StudentRoomAssignmentPage />
      case 'attendance-management':
        return <AttendanceManagementPage />
      case 'fee-management':
        return <FeeManagementPage />
      default:
        return null
    }
  }

  return (
    <div className="dashboard-container">
      {/* Professional Header */}
      <Header 
        title="EduTrack"
        subtitle="Hostel Management System"
        userName="Admin"
        showDateTime={true}
        showSearch={true}
        showNotifications={true}
      />

      <div className="dashboard-layout">
        {/* Sidebar Navigation */}
        <nav className="sidebar">
          <div className="nav-menu">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
      
      <style>{`
        .dashboard-cards {
          display: flex;
          gap: 20px;
          margin-top: 30px;
          flex-wrap: wrap;
        }
        
        .hostel-student-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 30px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          max-width: 280px;
          min-height: 180px;
        }
        
        .room-count-card {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          border-radius: 16px;
          padding: 30px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          box-shadow: 0 8px 32px rgba(245, 87, 108, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          max-width: 280px;
          min-height: 180px;
        }
        
        .hostel-student-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4);
        }
        
        .room-count-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(245, 87, 108, 0.4);
        }
        
        .card-icon {
          font-size: 2rem;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          backdrop-filter: blur(5px);
        }
        
        .card-content h3 {
          margin: 0 0 6px 0;
          font-size: 2rem;
          font-weight: bold;
          color: #ffffff;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          text-align: center;
        }
        
        .card-content p {
          margin: 0;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.95rem;
          font-weight: 500;
          text-align: center;
        }
        
        /* Sidebar Navigation Styles */
        .sidebar {
          background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
        }
        
        .nav-menu {
          padding: 20px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          margin: 15px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
        }
        
        .nav-item {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          margin: 8px 16px;
          padding: 10px 20px;
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.8);
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }
        
        .nav-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.5s ease;
        }
        
        .nav-item:hover::before {
          left: 100%;
        }
        
        .nav-item:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.2);
          color: #ffffff;
          transform: translateX(4px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        
        .nav-item.active {
          background: linear-gradient(135deg, #3498db, #2980b9);
          border-color: #3498db;
          color: #ffffff;
          box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
          transform: translateX(4px);
        }
        
        .nav-item.active::before {
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        }
        
        .nav-icon {
          font-size: 1.2rem;
          margin-right: 12px;
          display: inline-block;
          width: 20px;
          text-align: center;
        }
        
        .nav-label {
          font-size: 0.95rem;
          font-weight: 300;
        }
        
        /* Main Layout Styles */
        .dashboard-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }
        
        .dashboard-layout {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        
        .main-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 25%, #667eea 50%, #764ba2 75%, #f093fb 100%);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
          min-height: 0;
          position: relative;
        }

        .main-content::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 30% 70%, rgba(102, 126, 234, 0.3) 0%, transparent 50%),
                      radial-gradient(circle at 70% 30%, rgba(118, 75, 162, 0.3) 0%, transparent 50%),
                      radial-gradient(circle at 50% 50%, rgba(240, 147, 251, 0.2) 0%, transparent 60%);
          pointer-events: none;
          z-index: 1;
        }

        .main-content > * {
          position: relative;
          z-index: 2;
        }
        
        .dashboard-content {
          max-width: 100%;
          overflow-x: hidden;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .dashboard-layout {
            flex-direction: column;
          }
          
          .sidebar {
            width: 100%;
            height: auto;
          }
          
          .main-content {
            padding: 15px;
          }
        }
      `}</style>
    </div>
  )
}

export default DashboardPage
