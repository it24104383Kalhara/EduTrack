import { useState } from 'react'
import RoomManagementPage from './RoomManagementPage'

interface DashboardStats {
  totalRooms: number
  availableRooms: number
  occupiedRooms: number
  totalStudents: number
  lateAttendanceToday: number
  lateFeePayments: number
}

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Mock data - replace with actual data from backend
  const stats: DashboardStats = {
    totalRooms: 120,
    availableRooms: 35,
    occupiedRooms: 85,
    totalStudents: 85,
    lateAttendanceToday: 12,
    lateFeePayments: 8
  }

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'room-management', label: 'Room Management', icon: '🏠' },
    { id: 'attendance-management', label: 'Attendance Management', icon: '📝' },
    { id: 'fee-management', label: 'Fee Management', icon: '💰' }
  ]

  const StatCard = ({ title, value, icon, color }: { 
    title: string; 
    value: number; 
    icon: string; 
    color: string 
  }) => (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: color }}>
        <span className="icon">{icon}</span>
      </div>
      <div className="stat-content">
        <h3 className="stat-title">{title}</h3>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            <h2 className="page-title">Dashboard Overview</h2>
            <div className="stats-grid">
              <StatCard 
                title="Total Rooms" 
                value={stats.totalRooms} 
                icon="🏠" 
                color="#4CAF50" 
              />
              <StatCard 
                title="Available Rooms" 
                value={stats.availableRooms} 
                icon="✅" 
                color="#2196F3" 
              />
              <StatCard 
                title="Occupied Rooms" 
                value={stats.occupiedRooms} 
                icon="👥" 
                color="#FF9800" 
              />
              <StatCard 
                title="Total Students" 
                value={stats.totalStudents} 
                icon="🎓" 
                color="#9C27B0" 
              />
              <StatCard 
                title="Late Attendance (Today)" 
                value={stats.lateAttendanceToday} 
                icon="⏰" 
                color="#F44336" 
              />
              <StatCard 
                title="Late Fee Payments" 
                value={stats.lateFeePayments} 
                icon="💳" 
                color="#E91E63" 
              />
            </div>
          </div>
        )
      case 'room-management':
        return <RoomManagementPage />
      case 'attendance-management':
        return (
          <div className="page-content">
            <h2 className="page-title">Attendance Management</h2>
            <p>Attendance management features will be implemented here.</p>
          </div>
        )
      case 'fee-management':
        return (
          <div className="page-content">
            <h2 className="page-title">Fee Management</h2>
            <p>Fee management features will be implemented here.</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="project-name">EduTrack</div>
        <div className="user-info">
          <span className="user-name">Admin</span>
          <button className="logout-btn" onClick={() => window.location.reload()}>
            Logout
          </button>
        </div>
      </header>

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
    </div>
  )
}

export default DashboardPage
