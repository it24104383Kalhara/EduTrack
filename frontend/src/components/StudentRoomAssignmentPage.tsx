import React, { useState } from 'react'
import Header from './Header'

const StudentRoomAssignmentPage = () => {
  // State for rooms (will be connected to Room Management data)
  const [rooms, setRooms] = useState<Array<{
    id: string
    roomNumber: string
    capacity: number
  }>>([])
  
  // State for registered students (will be connected to Student Registration data)
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

  // State for assignment form
  const [assignmentForm, setAssignmentForm] = useState({
    selectedRoom: '',
    selectedStudent: ''
  })

  // State for viewing students in rooms
  const [showRoomStudents, setShowRoomStudents] = useState<string | null>(null)
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<any>(null)
  
  // State for messages
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)

  // Load data from localStorage (simulating backend connection)
  React.useEffect(() => {
    // Load rooms from Room Management
    const savedRooms = localStorage.getItem('rooms')
    if (savedRooms) {
      const roomsData = JSON.parse(savedRooms)
      console.log('Loaded rooms:', roomsData)
      setRooms(roomsData)
    } else {
      console.log('No rooms found in localStorage')
    }

    // Load students from Student Registration
    const savedStudents = localStorage.getItem('students')
    if (savedStudents) {
      const studentsData = JSON.parse(savedStudents)
      console.log('Loaded students:', studentsData)
      setStudents(studentsData)
    } else {
      console.log('No students found in localStorage')
    }
  }, [])

  const handleFormChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setAssignmentForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAssignStudent = () => {
    if (assignmentForm.selectedRoom && assignmentForm.selectedStudent) {
      // Check room capacity
      const room = rooms.find(r => r.roomNumber === assignmentForm.selectedRoom)
      const currentAssignedCount = students.filter(student => student.assignedRoom === assignmentForm.selectedRoom).length
      
      if (room && currentAssignedCount >= room.capacity) {
        // Show alert for full room
        alert(`Room ${assignmentForm.selectedRoom} is already full! Capacity: ${room.capacity}, Currently assigned: ${currentAssignedCount}`)
        return
      }
      
      const updatedStudents = students.map(student => 
        student.id === assignmentForm.selectedStudent 
          ? { ...student, assignedRoom: assignmentForm.selectedRoom }
          : student
      )
      setStudents(updatedStudents)
      
      // Save updated students back to localStorage
      localStorage.setItem('students', JSON.stringify(updatedStudents))
      
      const student = students.find(s => s.id === assignmentForm.selectedStudent)
      
      setMessage({
        type: 'success',
        text: `${student?.studentName} assigned to Room ${room?.roomNumber} successfully!`
      })
      setTimeout(() => setMessage(null), 3000)
      
      // Reset form
      setAssignmentForm({
        selectedRoom: '',
        selectedStudent: ''
      })
    } else {
      setMessage({
        type: 'error',
        text: 'Please select both a room and a student'
      })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleRemoveStudent = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    if (!student) return
    
    if (window.confirm(`Are you sure you want to remove ${student.studentName} from Room ${student.assignedRoom || 'unassigned'}?`)) {
      const updatedStudents = students.map(s => 
        s.id === studentId 
          ? { ...s, assignedRoom: undefined }
          : s
      )
      setStudents(updatedStudents)
      
      // Save updated students back to localStorage
      localStorage.setItem('students', JSON.stringify(updatedStudents))
      
      setMessage({
        type: 'success',
        text: `${student.studentName} removed from room successfully!`
      })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  // Get unassigned students for dropdown
  const unassignedStudents = students.filter(student => !student.assignedRoom)

  return (
    <>
    <div className="student-room-assignment-container">
      <Header 
        title="Student Room Assignment"
        subtitle="Assign students to hostel rooms"
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

      {/* Assignment Form */}
      <div className="assignment-form-section">
        <h2>📝 Assign Student to Room</h2>
        <div className="assignment-form">
          <div className="form-row">
            <div className="form-group">
              <label>Select Room *</label>
              <select
                name="selectedRoom"
                value={assignmentForm.selectedRoom}
                onChange={handleFormChange}
                required
              >
                <option value="">Choose a room...</option>
                {rooms.map(room => {
                  const currentAssignedCount = students.filter(student => student.assignedRoom === room.roomNumber).length
                  const isFull = currentAssignedCount >= room.capacity
                  return (
                    <option 
                      key={room.id} 
                      value={room.roomNumber}
                    >
                      {room.roomNumber} (Capacity: {room.capacity}, Available: {room.capacity - currentAssignedCount})
                      {isFull && ' - FULL'}
                    </option>
                  )
                })}
              </select>
              {rooms.length === 0 && (
                <p className="no-rooms-message">No rooms available. Please create rooms first in Room Management.</p>
              )}
            </div>
            
            <div className="form-group">
              <label>Select Student *</label>
              <select
                name="selectedStudent"
                value={assignmentForm.selectedStudent}
                onChange={handleFormChange}
                required
              >
                <option value="">Choose a student...</option>
                {unassignedStudents.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.studentName} - {student.registrationNumber} ({student.grade})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              className="btn-primary"
              onClick={handleAssignStudent}
              disabled={!assignmentForm.selectedRoom || !assignmentForm.selectedStudent}
            >
              🏫 Assign Student to Room
            </button>
          </div>
        </div>
      </div>

      {/* Available Rooms */}
      <div className="rooms-section">
        <h2>🏠 Available Rooms</h2>
        <div className="rooms-grid">
          {rooms.map(room => {
            const assignedStudents = students.filter(student => student.assignedRoom === room.roomNumber)
            const assignedCount = assignedStudents.length
            const remainingCapacity = room.capacity - assignedCount
            
            return (
              <div key={room.id} className="room-card">
                <div className="room-header">
                  <h3>{room.roomNumber}</h3>
                  <div className="room-capacity-info">
                    <span className="capacity-badge">Total Capacity: {room.capacity}</span>
                    <span className={`capacity-status ${remainingCapacity === 0 ? 'full' : remainingCapacity <= 2 ? 'limited' : 'available'}`}>
                      {assignedCount}/{room.capacity} students
                    </span>
                  </div>
                </div>
                <div className="room-details">
                  <div className="capacity-breakdown">
                    <div className="assigned-info">
                      <span className="assigned-count">{assignedCount}</span>
                      <span className="assigned-text">students assigned</span>
                    </div>
                    <div className="remaining-info">
                      <span className="remaining-count">{remainingCapacity}</span>
                      <span className="remaining-text">students can join</span>
                    </div>
                  </div>
                  <div className="capacity-bar">
                    <div 
                      className="capacity-fill"
                      style={{ width: `${(assignedCount / room.capacity) * 100}%` }}
                    ></div>
                  </div>
                  <div className="room-actions">
                    <button 
                      className="view-students-btn"
                      onClick={() => setShowRoomStudents(room.roomNumber)}
                      disabled={assignedCount === 0}
                    >
                      👥 View Students ({assignedCount})
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Students in Room Modal */}
      {showRoomStudents && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>👥 Students in Room {showRoomStudents}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowRoomStudents(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {students
                .filter(student => student.assignedRoom === showRoomStudents)
                .length > 0 ? (
                <div className="students-list">
                  {students
                    .filter(student => student.assignedRoom === showRoomStudents)
                    .map(student => (
                      <div key={student.id} className="student-item">
                        <div className="student-info">
                          <button 
                            className="student-button"
                            onClick={() => setSelectedStudentDetails(student)}
                          >
                            {student.registrationNumber} - {student.studentName}
                          </button>
                          <button 
                            className="remove-student-btn-small"
                            onClick={() => handleRemoveStudent(student.id)}
                            style={{
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              marginLeft: '8px'
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="no-students-message">
                  <p>No students assigned to this room yet.</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn-primary"
                onClick={() => setShowRoomStudents(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudentDetails && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>👤 Student Details</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedStudentDetails(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="student-details">
                <div className="detail-section">
                  <h4>Student Information</h4>
                  <div className="detail-item">
                    <span className="detail-label">Registration Number:</span>
                    <span className="detail-value">{selectedStudentDetails.registrationNumber}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Student Name:</span>
                    <span className="detail-value">{selectedStudentDetails.studentName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Grade:</span>
                    <span className="detail-value">{selectedStudentDetails.grade}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{selectedStudentDetails.address}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Assigned Room:</span>
                    <span className="detail-value">{selectedStudentDetails.assignedRoom || 'Not assigned'}</span>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h4>Parents Information</h4>
                  <div className="detail-item">
                    <span className="detail-label">Parent/Guardian Name:</span>
                    <span className="detail-value">{selectedStudentDetails.parentName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone Number:</span>
                    <span className="detail-value">{selectedStudentDetails.parentPhone}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email Address:</span>
                    <span className="detail-value">{selectedStudentDetails.parentEmail || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-primary"
                onClick={() => setSelectedStudentDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
      
      <style>{`
        .student-room-assignment-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          background: linear-gradient(135deg, #0f2027 0%, #203a43 20%, #2c5364 40%, #4a69bd 60%, #6c5ce7 80%, #a29bfe 100%);
          background-size: 400% 400%;
          animation: gradientShift 20s ease infinite;
          min-height: 100vh;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          position: relative;
        }

        .student-room-assignment-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 30% 70%, rgba(74, 105, 189, 0.4) 0%, transparent 60%),
                      radial-gradient(circle at 70% 30%, rgba(108, 92, 231, 0.3) 0%, transparent 60%),
                      radial-gradient(circle at 50% 50%, rgba(162, 155, 254, 0.2) 0%, transparent 70%);
          pointer-events: none;
          z-index: 1;
        }

        .student-room-assignment-container > * {
          position: relative;
          z-index: 2;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .page-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .page-title {
          font-size: 2.5rem;
          color: white;
          margin-bottom: 10px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .page-subtitle {
          color: rgba(255, 255, 255, 0.9);
          font-size: 1.1rem;
        }

        .assignment-section {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 25px;
          margin-bottom: 30px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .assignment-section h2 {
          color: #2c3e50;
          margin-bottom: 20px;
          font-size: 1.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 8px;
          color: #34495e;
          font-weight: 500;
        }

        .form-group select {
          padding: 12px;
          border: 2px solid #e1e8ed;
          border-radius: 8px;
          font-size: 1rem;
          background: white;
          transition: all 0.3s ease;
        }

        .form-group select:focus {
          outline: none;
          border-color: #4a69bd;
          box-shadow: 0 0 0 3px rgba(74, 105, 189, 0.1);
        }

        .form-actions {
          display: flex;
          gap: 15px;
          justify-content: flex-end;
        }

        .btn-primary {
          background: linear-gradient(135deg, #4a69bd, #6c5ce7);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(74, 105, 189, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(74, 105, 189, 0.4);
        }

        .rooms-grid, .students-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .room-card, .student-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          padding: 20px;
          transition: all 0.3s ease;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .room-card:hover, .student-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
          border-color: #4a69bd;
        }

        .room-header h3, .student-info h4 {
          color: #2c3e50;
          margin: 0 0 15px 0;
        }

        .room-info p, .student-info p {
          color: #7f8c8d;
          margin: 5px 0;
        }

        .capacity-bar {
          width: 100%;
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 10px;
        }

        .capacity-fill {
          height: 100%;
          background: linear-gradient(90deg, #4a69bd, #6c5ce7);
          border-radius: 4px;
          transition: width 0.6s ease;
        }

        .no-rooms-message, .no-students-message {
          text-align: center;
          padding: 40px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 12px;
          border: 2px dashed rgba(255, 255, 255, 0.5);
        }

        .no-rooms-message h3, .no-students-message h3 {
          color: #2c3e50;
          margin-bottom: 10px;
        }

        .no-rooms-message p, .no-students-message p {
          color: #7f8c8d;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          padding: 20px;
          border-bottom: 1px solid #e0e0e0;
        }

        .modal-header h3 {
          color: #2c3e50;
          margin: 0;
        }

        .modal-body {
          padding: 20px;
        }

        .detail-section {
          margin-bottom: 20px;
        }

        .detail-section h4 {
          color: #2c3e50;
          margin-bottom: 10px;
          padding-bottom: 5px;
          border-bottom: 2px solid #e0e0e0;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .detail-label {
          color: #7f8c8d;
          font-weight: 500;
        }

        .detail-value {
          color: #2c3e50;
          font-weight: 600;
        }

        .modal-footer {
          padding: 20px;
          border-top: 1px solid #e0e0e0;
          text-align: right;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .rooms-grid, .students-grid {
            grid-template-columns: 1fr;
          }
        }
      `}
      </style>
    </>
  )
}

export default StudentRoomAssignmentPage
