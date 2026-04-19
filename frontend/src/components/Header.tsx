import React from 'react'

interface HeaderProps {
  title?: string
  subtitle?: string
  showUserMenu?: boolean
  userName?: string
  onLogout?: () => void
  showDateTime?: boolean
  showStats?: boolean
  showNotifications?: boolean
  showSearch?: boolean
}

const Header: React.FC<HeaderProps> = ({ 
  title = "EduTrack", 
  subtitle, 
  showUserMenu = true, 
  userName = "Admin",
  onLogout,
  showDateTime = false,
  showStats = false,
  showNotifications = false,
  showSearch = false
}) => {
  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else {
      window.location.reload()
    }
  }

  // Get current date and time
  const getCurrentDateTime = () => {
    const now = new Date()
    return {
      date: now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      })
    }
  }

  // Animated logo effect
  const [logoAnimation, setLogoAnimation] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [showSearchResults, setShowSearchResults] = React.useState(false)
  const [searchResults, setSearchResults] = React.useState<Array<{
    id: string
    type: 'student' | 'room' | 'fee' | 'attendance'
    title: string
    subtitle: string
    icon: string
    action: string
  }>>([])
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setLogoAnimation(prev => !prev)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Mock search function
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    
    if (query.length > 0) {
      // Real search from localStorage
      const students = JSON.parse(localStorage.getItem('students') || '[]')
      const rooms = JSON.parse(localStorage.getItem('rooms') || '[]')
      const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]')
      
      const realResults = []
      
      // Search students
      students.forEach((student: any) => {
        if (student.studentName?.toLowerCase().includes(query.toLowerCase()) ||
            student.registrationNumber?.toLowerCase().includes(query.toLowerCase())) {
          realResults.push({
            id: student.id,
            type: 'student',
            title: student.studentName,
            subtitle: `Registration: ${student.registrationNumber} - Grade: ${student.grade}`,
            icon: '👨‍🎓',
            action: 'View Student Details'
          })
        }
      })
      
      // Search rooms
      rooms.forEach((room: any) => {
        if (room.roomNumber?.toLowerCase().includes(query.toLowerCase())) {
          const assignedStudents = students.filter((s: any) => s.assignedRoom === room.roomNumber)
          realResults.push({
            id: room.id,
            type: 'room',
            title: room.roomNumber,
            subtitle: `Capacity: ${room.capacity}, Available: ${room.capacity - assignedStudents.length}`,
            icon: '🏠',
            action: 'Manage Room'
          })
        }
      })
      
      // Search attendance
      if (attendanceRecords.length > 0) {
        const today = new Date().toISOString().split('T')[0]
        const todayRecords = attendanceRecords.filter((record: any) => record.date === today)
        const totalStudents = todayRecords.reduce((sum: any, record: any) => sum + (record.totalCount || 0), 0)
        const totalPresent = todayRecords.reduce((sum: any, record: any) => sum + (record.presentCount || 0), 0)
        
        realResults.push({
          id: 'attendance',
          type: 'attendance',
          title: "Today's Attendance",
          subtitle: `${totalPresent}/${totalStudents} students present`,
          icon: '📋',
          action: 'View Attendance'
        })
      }
      
      setSearchResults(realResults)
      setShowSearchResults(true)
    } else {
      setShowSearchResults(false)
      setSearchResults([])
    }
  }

  return (
    <>
      <header className="professional-header">
        {/* Top Search Bar */}
        {showSearch && (
          <div className="top-search-section">
            <div className="search-container">
              <input 
                type="text" 
                placeholder="🔍 Search students, rooms, fees..." 
                className="top-search-input"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery.length > 0 && setShowSearchResults(true)}
              />
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="search-results-dropdown">
                  <div className="search-results-list">
                    {searchResults.map((result) => (
                      <div key={result.id} className="search-result-item">
                        <div className="result-icon">{result.icon}</div>
                        <div className="result-content">
                          <div className="result-title">{result.title}</div>
                          <div className="result-subtitle">{result.subtitle}</div>
                          <div className="result-action">{result.action}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {searchResults.length === 0 && (
                    <div className="no-results">
                      <span className="no-results-icon">🔍</span>
                      <span className="no-results-text">No results found</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="header-content">
          <div className="header-left">
            <div className="brand-section">
              <div className="logo-container">
                <div className={`logo-icon ${logoAnimation ? 'animate-logo' : ''}`}>
                  {logoAnimation ? '🎓' : '🎓'}
                </div>
                <div className="brand-text">
                  <h1 className="brand-name">
                    <span className="brand-main">{title}</span>
                    <span className="brand-glow"></span>
                  </h1>
                  {subtitle && <p className="brand-subtitle">{subtitle}</p>}
                </div>
              </div>
            </div>
          </div>
          
          <div className="header-right">
            {/* Date/Time Display */}
            {showDateTime && (
              <div className="datetime-section">
                <div className="datetime-display">
                  <div className="date-part">📅 {getCurrentDateTime().date}</div>
                  <div className="time-part">🕐 {getCurrentDateTime().time}</div>
                </div>
              </div>
            )}
            
            {/* Notifications */}
            {showNotifications && (
              <div className="notification-section">
                <div className="notification-bell">
                  <span className="bell-icon">🔔</span>
                  <span className="notification-badge">3</span>
                </div>
              </div>
            )}
            
            {showUserMenu && (
              <div className="user-section">
                <div className="user-info">
                  <div className="user-avatar">
                    <span className="avatar-icon">👤</span>
                  </div>
                  <div className="user-details">
                    <span className="user-name">{userName}</span>
                    <span className="user-role">Administrator</span>
                  </div>
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                  <span className="logout-icon">🚪</span>
                  <span className="logout-text">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="header-decoration">
          <div className="decoration-line"></div>
          <div className="decoration-pattern"></div>
        </div>
      </header>
      
      <style>{`
        .professional-header {
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #1e3c72 100%);
          border-bottom: 2px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          position: relative;
          overflow: hidden;
        }
        
        .top-search-section {
          padding: 15px 30px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.1);
        }
        
        .top-search-input {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          display: block;
          padding: 15px 25px 15px 50px;
          border: none;
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #ffffff;
          font-size: 1rem;
          font-weight: 500;
          transition: all 0.3s ease;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
        
        .search-results-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          z-index: 1000;
          max-height: 400px;
          overflow-y: auto;
          animation: slideDown 0.3s ease-out;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .search-results-list {
          padding: 12px;
        }
        
        .search-result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 8px;
          background: rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .search-result-item:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateX(8px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }
        
        .result-icon {
          font-size: 1.5rem;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        
        .result-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .result-title {
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
        }
        
        .result-subtitle {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .result-action {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
          font-style: italic;
        }
        
        .no-results {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 24px;
          text-align: center;
        }
        
        .no-results-icon {
          font-size: 2rem;
          opacity: 0.5;
        }
        
        .no-results-text {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .top-search-input::placeholder {
          color: rgba(255, 255, 255, 0.7);
          font-weight: 400;
        }
        
        .top-search-input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.5);
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }
        
        .professional-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
          animation: shimmer 8s infinite;
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          50% { left: 100%; }
          100% { left: 100%; }
        }
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 30px;
          position: relative;
          z-index: 2;
        }
        
        .header-left {
          flex: 1;
        }
        
        .brand-section {
          display: flex;
          align-items: center;
        }
        
        .logo-container {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .logo-icon {
          font-size: 2.5rem;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          transition: all 0.5s ease;
        }
        
        .logo-icon.animate-logo {
          animation: logoPulse 0.6s ease-in-out;
          transform: scale(1.1);
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.4);
        }
        
        @keyframes logoPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        
        .brand-text {
          display: flex;
          flex-direction: column;
        }
        
        .brand-name {
          margin: 0;
          font-size: 2rem;
          font-weight: 700;
          color: #ffffff;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          letter-spacing: -0.5px;
          position: relative;
        }
        
        .brand-main {
          position: relative;
          z-index: 2;
        }
        
        .brand-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          border-radius: 8px;
          animation: brandGlow 3s ease-in-out infinite;
        }
        
        @keyframes brandGlow {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        
        .brand-subtitle {
          margin: 4px 0 0 0;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 400;
          letter-spacing: 0.5px;
        }
        
        .header-right {
          flex: 1;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 20px;
        }
        
        .search-section {
          margin-right: 20px;
        }
        
        .search-container {
          position: relative;
        }
        
        .search-input {
          padding: 12px 20px 12px 45px;
          border: none;
          border-radius: 25px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          font-size: 0.9rem;
          width: 280px;
          transition: all 0.3s ease;
        }
        
        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .search-input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        
        .notification-section {
          margin-right: 20px;
        }
        
        .notification-bell {
          position: relative;
          cursor: pointer;
          padding: 10px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }
        
        .notification-bell:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        
        .bell-icon {
          font-size: 1.2rem;
        }
        
        .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: linear-gradient(135deg, #ff6b6b, #ee5a24);
          color: white;
          font-size: 0.7rem;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(255, 107, 107, 0.4);
        }
        
        .datetime-section {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          margin-right: 20px;
        }
        
        .datetime-display {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }
        
        .datetime-display:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        
        .date-part {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
        }
        
        .time-part {
          font-size: 0.9rem;
          color: #ffffff;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .user-section {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        
        .user-avatar {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        .avatar-icon {
          font-size: 1.2rem;
        }
        
        .user-details {
          display: flex;
          flex-direction: column;
        }
        
        .user-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: #ffffff;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        
        .user-role {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 400;
        }
        
        .logout-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          border: none;
          border-radius: 10px;
          color: white;
          font-weight: 500;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
        }
        
        .logout-btn:hover {
          background: linear-gradient(135deg, #c0392b, #a93226);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
        }
        
        .logout-btn:active {
          transform: translateY(0);
        }
        
        .logout-icon {
          font-size: 1rem;
        }
        
        .logout-text {
          font-weight: 500;
        }
        
        .header-decoration {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          overflow: hidden;
        }
        
        .decoration-line {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(255, 255, 255, 0.3) 20%, 
            rgba(255, 255, 255, 0.5) 50%, 
            rgba(255, 255, 255, 0.3) 80%, 
            transparent 100%);
        }
        
        .decoration-pattern {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: repeating-linear-gradient(
            90deg,
            transparent,
            transparent 10px,
            rgba(255, 255, 255, 0.1) 10px,
            rgba(255, 255, 255, 0.1) 20px
          );
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .header-content {
            padding: 15px 20px;
            flex-direction: column;
            gap: 15px;
          }
          
          .header-left, .header-right {
            flex: none;
            width: 100%;
          }
          
          .brand-name {
            font-size: 1.5rem;
          }
          
          .logo-icon {
            font-size: 2rem;
            width: 50px;
            height: 50px;
          }
          
          .user-section {
            justify-content: space-between;
            width: 100%;
          }
          
          .user-info {
            padding: 8px 12px;
          }
          
          .logout-btn {
            padding: 10px 16px;
          }
        }
        
        @media (max-width: 480px) {
          .logo-container {
            gap: 10px;
          }
          
          .brand-name {
            font-size: 1.3rem;
          }
          
          .brand-subtitle {
            font-size: 0.85rem;
          }
          
          .user-details {
            display: none;
          }
          
          .user-info {
            padding: 8px;
          }
          
          .logout-text {
            display: none;
          }
          
          .logout-btn {
            padding: 8px 12px;
          }
        }
      `}</style>
    </>
  )
}

export default Header
