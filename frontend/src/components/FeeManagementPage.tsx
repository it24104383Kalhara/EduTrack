import React, { useState } from 'react'
import './FeeManagementPage.css'

const FeeManagementPage = () => {
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

  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [showBlankPage, setShowBlankPage] = useState(false)
  const [showStudentBlankPage, setShowStudentBlankPage] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)

  React.useEffect(() => {
    const savedRooms = localStorage.getItem('rooms')
    if (savedRooms) {
      const roomsData = JSON.parse(savedRooms)
      setRooms(roomsData)
    }

    const savedStudents = localStorage.getItem('students')
    if (savedStudents) {
      const studentsData = JSON.parse(savedStudents)
      setStudents(studentsData)
    }
  }, [])

  const handleRoomClick = (roomId: string) => {
    setSelectedRoom(roomId)
    setShowBlankPage(true)
  }

  const handleBackToRooms = () => {
    setShowBlankPage(false)
    setSelectedRoom(null)
  }

  const handleBackToStudents = () => {
    setShowStudentBlankPage(false)
    setSelectedStudent(null)
  }

  const handleStudentClick = (student: any) => {
    setSelectedStudent(student)
    setShowStudentBlankPage(true)
  }

  const getAssignedStudents = (roomId: string) => {
    return students.filter(student => student.assignedRoom === roomId)
  }

  const getRoomById = (roomId: string) => {
    return rooms.find(room => room.id === roomId)
  }

  return (
    <div className="fee-management-container">
      {!showBlankPage && !showStudentBlankPage ? (
        <>
          <div className="page-header">
            <h1 className="page-title">💰 Fee Management</h1>
            <p className="page-subtitle">Manage student fees and payments</p>
          </div>

          <div className="rooms-section">
            <h2>Select a Room to View Students</h2>
            {rooms.length > 0 ? (
              <div className="rooms-grid">
                {rooms.map(room => {
                  const assignedStudents = getAssignedStudents(room.id)
                  return (
                    <div 
                      key={room.id} 
                      className={`room-card ${selectedRoom === room.id ? 'selected' : ''}`}
                      onClick={() => handleRoomClick(room.id)}
                    >
                      <div className="room-header">
                        <h3>{room.roomNumber}</h3>
                        <span className="student-count-badge">
                          {assignedStudents.length} students
                        </span>
                      </div>
                      <div className="room-info">
                        <p><strong>Capacity:</strong> {room.capacity}</p>
                        <p><strong>Assigned:</strong> {assignedStudents.length}</p>
                        <p><strong>Available:</strong> {room.capacity - assignedStudents.length}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="no-rooms-message">
                <h3>💰 No Rooms with Assigned Students</h3>
                <p>Please assign students to rooms first in Student Room Assignment.</p>
              </div>
            )}
          </div>
        </>
      ) : showBlankPage && selectedRoom ? (
        <div className="student-payment-page">
          <div className="payment-header">
            <h2>
              Students in {getRoomById(selectedRoom)?.roomNumber}
            </h2>
            <button className="back-btn" onClick={handleBackToRooms}>
              ← Back to Rooms
            </button>
          </div>

          <div className="students-list">
            {getAssignedStudents(selectedRoom).length > 0 ? (
              getAssignedStudents(selectedRoom).map(student => (
                <div 
                  key={student.id} 
                  className="student-card"
                  onClick={() => handleStudentClick(student)}
                >
                  <div className="student-info">
                    <h4>{student.studentName}</h4>
                    <p><strong>Reg No:</strong> {student.registrationNumber}</p>
                    <p><strong>Grade:</strong> {student.grade}</p>
                    <p><strong>Parent:</strong> {student.parentName}</p>
                    <p><strong>Phone:</strong> {student.parentPhone}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-students-message">
                <p>No students assigned to this room.</p>
              </div>
            )}
          </div>
        </div>
      ) : showStudentBlankPage && selectedStudent ? (
        <div className="student-payment-page">
          <div className="payment-header">
            <h2>Payment Details - {selectedStudent.studentName}</h2>
            <button className="back-btn" onClick={handleBackToStudents}>
              ← Back to Students
            </button>
          </div>

          <div className="student-basic-info">
            <p><strong>Registration Number:</strong> {selectedStudent.registrationNumber}</p>
            <p><strong>Grade:</strong> {selectedStudent.grade}</p>
            <p><strong>Parent Name:</strong> {selectedStudent.parentName}</p>
            <p><strong>Parent Phone:</strong> {selectedStudent.parentPhone}</p>
            <p><strong>Parent Email:</strong> {selectedStudent.parentEmail}</p>
          </div>

          <div className="payment-details">
            <h3>Fee Structure</h3>
            <div className="payment-grid">
              <div className="payment-item">
                <h4>Tuition Fee</h4>
                <p className="amount">$5,000</p>
                <span className="status paid">Paid</span>
              </div>
              <div className="payment-item">
                <h4>Hostel Fee</h4>
                <p className="amount">$2,000</p>
                <span className="status pending">Pending</span>
              </div>
              <div className="payment-item">
                <h4>Mess Fee</h4>
                <p className="amount">$1,500</p>
                <span className="status paid">Paid</span>
              </div>
              <div className="payment-item">
                <h4>Library Fee</h4>
                <p className="amount">$500</p>
                <span className="status overdue">Overdue</span>
              </div>
            </div>
          </div>

          <div className="payment-actions">
            <button className="pay-btn">Process Payment</button>
            <button className="pay-btn">Generate Receipt</button>
            <button className="back-btn" onClick={handleBackToStudents}>
              Back to Students
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default FeeManagementPage
