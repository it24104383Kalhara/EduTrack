import React, { useState } from 'react'
import Header from './Header'

const AttendanceManagementPage = () => {
  // State for rooms and students
  const [rooms, setRooms] = useState<Array<{
    id: string
    roomNumber: string
    capacity: number
  }>>([])
  
  const [students, setStudents] = useState<Array<{
    id: string
    registrationNumber: string
    studentName: string
    grade: string
    address: string
    parentName: string
    parentPhone: string
    parentEmail: string
    registeredAt: string
    assignedRoom?: string
  }>>([])

  // State for selected room and attendance
  const [selectedRoom, setSelectedRoom] = useState<string>('')
  const [attendanceData, setAttendanceData] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)

  // Load data from localStorage
  React.useEffect(() => {
    // Load rooms from Room Management
    const savedRooms = localStorage.getItem('rooms')
    if (savedRooms) {
      const roomsData = JSON.parse(savedRooms)
      setRooms(roomsData)
    }

    // Load students from Student Registration
    const savedStudents = localStorage.getItem('students')
    if (savedStudents) {
      const studentsData = JSON.parse(savedStudents)
      setStudents(studentsData)
    }
  }, [])

  // Get rooms with assigned students
  const roomsWithStudents = rooms.filter(room => 
    students.some(student => student.assignedRoom === room.roomNumber)
  )

  // Get students in selected room
  const studentsInSelectedRoom = students.filter(student => 
    student.assignedRoom === selectedRoom
  )

  // Handle room selection
  const handleRoomSelect = (roomNumber: string) => {
    setSelectedRoom(roomNumber)
    // Initialize attendance data for students in this room
    const initialAttendance: Record<string, boolean> = {}
    students
      .filter(student => student.assignedRoom === roomNumber)
      .forEach(student => {
        initialAttendance[student.id] = false
      })
    setAttendanceData(initialAttendance)
  }

  // Handle attendance toggle
  const handleAttendanceToggle = (studentId: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }))
  }

  // Save attendance
  const handleSaveAttendance = () => {
    const presentCount = Object.values(attendanceData).filter(Boolean).length
    const totalCount = studentsInSelectedRoom.length
    
    // Save to localStorage (in real app, this would go to backend)
    const attendanceRecord = {
      roomNumber: selectedRoom,
      date: new Date().toISOString().split('T')[0],
      attendance: attendanceData,
      presentCount,
      totalCount,
      savedAt: new Date().toISOString()
    }
    
    // Get existing attendance records or create new array
    const existingRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]')
    existingRecords.push(attendanceRecord)
    localStorage.setItem('attendanceRecords', JSON.stringify(existingRecords))
    
    setMessage({
      type: 'success',
      text: `Attendance saved for Room ${selectedRoom}: ${presentCount}/${totalCount} students present`
    })
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="attendance-management-container">
      <Header 
        title="Attendance Management"
        subtitle="Mark and track student attendance"
        userName="Admin"
      />
      
      {/* Message Display */}
      {message && (
        <div className={`message-display ${message.type}`}>
          <span className="message-icon">
            {message.type === 'success' ? '✅' : message.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <span className="message-text">{message.text}</span>
        </div>
      )}

      {/* Rooms Selection */}
      <div className="rooms-selection-section">
        <h2>🏠 Select Room for Attendance</h2>
        <div className="rooms-grid">
          {roomsWithStudents.length > 0 ? (
            roomsWithStudents.map(room => {
              const assignedStudents = students.filter(student => student.assignedRoom === room.roomNumber)
              return (
                <div 
                  key={room.id} 
                  className={`room-card ${selectedRoom === room.roomNumber ? 'selected' : ''}`}
                  onClick={() => handleRoomSelect(room.roomNumber)}
                >
                  <div className="room-header">
                    <h3>{room.roomNumber}</h3>
                    <span className="student-count-badge">{assignedStudents.length} students</span>
                  </div>
                  <div className="room-info">
                    <p><strong>Capacity:</strong> {room.capacity}</p>
                    <p><strong>Assigned:</strong> {assignedStudents.length}</p>
                    <p><strong>Available:</strong> {room.capacity - assignedStudents.length}</p>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="no-rooms-message">
              <h3>📋 No Rooms with Assigned Students</h3>
              <p>Please assign students to rooms first in Student Room Assignment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Attendance Marking */}
      {selectedRoom && (
        <div className="attendance-section">
          <h2>📝 Mark Attendance - Room {selectedRoom}</h2>
          <div className="attendance-form">
            <div className="students-list">
              {studentsInSelectedRoom.map(student => (
                <div key={student.id} className="attendance-item">
                  <div className="student-info">
                    <h4>{student.studentName}</h4>
                    <p><strong>Registration:</strong> {student.registrationNumber}</p>
                    <p><strong>Grade:</strong> {student.grade}</p>
                  </div>
                  <div className="attendance-toggle">
                    <label className="attendance-switch">
                      <input
                        type="checkbox"
                        checked={attendanceData[student.id] || false}
                        onChange={() => handleAttendanceToggle(student.id)}
                      />
                      <span className="slider"></span>
                      <span className="attendance-label">
                        {attendanceData[student.id] ? '✅ Present' : '❌ Absent'}
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="attendance-summary">
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Students:</span>
                  <span className="stat-value">{studentsInSelectedRoom.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Present:</span>
                  <span className="stat-value present">
                    {Object.values(attendanceData).filter(Boolean).length}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Absent:</span>
                  <span className="stat-value absent">
                    {studentsInSelectedRoom.length - Object.values(attendanceData).filter(Boolean).length}
                  </span>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  className="btn-primary"
                  onClick={handleSaveAttendance}
                >
                  💾 Save Attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .attendance-management-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          background: linear-gradient(135deg, #2d1b69 0%, #0f3460 20%, #16213e 40%, #533483 60%, #c06c84 80%, #f8b500 100%);
          background-size: 400% 400%;
          animation: gradientShift 25s ease infinite;
          min-height: 100vh;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          position: relative;
        }

        .attendance-management-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 25% 75%, rgba(83, 52, 131, 0.4) 0%, transparent 60%),
                      radial-gradient(circle at 75% 25%, rgba(192, 108, 132, 0.3) 0%, transparent 60%),
                      radial-gradient(circle at 50% 50%, rgba(248, 181, 0, 0.2) 0%, transparent 70%);
          pointer-events: none;
          z-index: 1;
        }

        .attendance-management-container > * {
          position: relative;
          z-index: 2;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .message-display {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .message-display.success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message-display.error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .page-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .page-title {
          font-size: 2.5rem;
          color: #2c3e50;
          margin-bottom: 10px;
        }

        .page-subtitle {
          color: #7f8c8d;
          font-size: 1.1rem;
        }

        .rooms-selection-section {
          margin-bottom: 30px;
        }

        .rooms-selection-section h2 {
          color: #2c3e50;
          margin-bottom: 20px;
          font-size: 1.5rem;
        }

        .rooms-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .room-card {
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
        }

        .room-card:hover {
          border-color: #3498db;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .room-card.selected {
          border-color: #2ecc71;
          background-color: #f0f9ff;
        }

        .room-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .room-header h3 {
          font-size: 1.5rem;
          color: #2c3e50;
          margin: 0;
        }

        .student-count-badge {
          background-color: #3498db;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: bold;
        }

        .room-info p {
          margin: 5px 0;
          color: #7f8c8d;
        }

        .no-rooms-message {
          text-align: center;
          padding: 40px;
          background: #f8f9fa;
          border-radius: 12px;
          border: 2px dashed #dee2e6;
        }

        .no-rooms-message h3 {
          color: #6c757d;
          margin-bottom: 10px;
        }

        .no-rooms-message p {
          color: #6c757d;
        }

        .attendance-section {
          background: white;
          border-radius: 12px;
          padding: 25px;
          border: 1px solid #e0e0e0;
        }

        .attendance-section h2 {
          color: #2c3e50;
          margin-bottom: 20px;
          font-size: 1.5rem;
        }

        .students-list {
          margin-bottom: 30px;
        }

        .attendance-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          margin-bottom: 15px;
          background: #f8f9fa;
        }

        .student-info h4 {
          margin: 0 0 5px 0;
          color: #2c3e50;
        }

        .student-info p {
          margin: 2px 0;
          color: #7f8c8d;
          font-size: 0.9rem;
        }

        .attendance-switch {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        .attendance-switch input[type="checkbox"] {
          display: none;
        }

        .slider {
          position: relative;
          width: 60px;
          height: 30px;
          background-color: #dc3545;
          border-radius: 15px;
          transition: background-color 0.3s;
        }

        .slider:before {
          content: "";
          position: absolute;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background-color: white;
          top: 2px;
          left: 2px;
          transition: transform 0.3s;
        }

        .attendance-switch input:checked + .slider {
          background-color: #28a745;
        }

        .attendance-switch input:checked + .slider:before {
          transform: translateX(30px);
        }

        .attendance-label {
          font-weight: bold;
          font-size: 0.9rem;
        }

        .attendance-summary {
          border-top: 2px solid #e0e0e0;
          padding-top: 20px;
        }

        .summary-stats {
          display: flex;
          gap: 30px;
          margin-bottom: 20px;
        }

        .stat-item {
          text-align: center;
        }

        .stat-label {
          display: block;
          color: #7f8c8d;
          font-size: 0.9rem;
          margin-bottom: 5px;
        }

        .stat-value {
          display: block;
          font-size: 2rem;
          font-weight: bold;
        }

        .stat-value.present {
          color: #28a745;
        }

        .stat-value.absent {
          color: #dc3545;
        }

        .form-actions {
          text-align: center;
        }

        .btn-primary {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .btn-primary:hover {
          background-color: #0056b3;
        }
      `}</style>
    </div>
  )
}

export default AttendanceManagementPage
