import React, { useState } from 'react'
import Header from './Header'
import './StudentRegistrationPage.css'

const StudentRegistrationPage = () => {
  // State to control when to show student list
  const [showStudentList, setShowStudentList] = useState(false)
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
  
  // Load students from localStorage on component mount and check for updates
  React.useEffect(() => {
    const loadStudents = () => {
      const savedStudents = localStorage.getItem('students')
      if (savedStudents) {
        const studentsData = JSON.parse(savedStudents)
        setStudents(studentsData)
        // Show student list if there are existing students
        if (studentsData.length > 0) {
          setShowStudentList(true)
        }
      }
    }

    loadStudents()
    
    // Check for updates every 2 seconds
    const interval = setInterval(loadStudents, 2000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Generate auto-increment registration number
  const generateRegistrationNumber = () => {
    const currentYear = new Date().getFullYear()
    const nextNumber = students.length + 1
    return `REG${currentYear}${nextNumber.toString().padStart(3, '0')}`
  }
  
  const [studentData, setStudentData] = useState({
    registrationNumber: generateRegistrationNumber(),
    studentName: '',
    grade: '',
    address: '',
    parentName: '',
    parentPhone: '',
    parentEmail: ''
  })

  // Update registration number when students list changes
  React.useEffect(() => {
    setStudentData(prev => ({
      ...prev,
      registrationNumber: generateRegistrationNumber()
    }))
  }, [students.length])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setStudentData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const student = {
      id: Date.now().toString(),
      ...studentData,
      registeredAt: new Date().toLocaleString()
    }
    
    const updatedStudents = [...students, student]
    setStudents(updatedStudents)
    
    // Save students to localStorage for StudentRoomAssignmentPage
    localStorage.setItem('students', JSON.stringify(updatedStudents))
    
    setShowStudentList(true) // Show student list after registration
    console.log('Student Registration Data:', student)
    alert(`Student ${studentData.studentName} registered successfully!`)
    // Reset form (registration number will auto-update via useEffect)
    setStudentData(prev => ({
      ...prev,
      studentName: '',
      grade: '',
      address: '',
      parentName: '',
      parentPhone: '',
      parentEmail: ''
    }))
  }

  return (
    <div className="student-registration-container">
      <Header 
        title="Student Registration"
        subtitle="Register new students for the hostel"
        userName="Admin"
      />
      <form className="registration-form" onSubmit={handleSubmit}>
        {/* Student Information Section */}
        <div className="form-section">
          <h2 className="section-title">Student Information</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Registration Number</label>
              <input
                type="text"
                name="registrationNumber"
                value={studentData.registrationNumber}
                readOnly
                className="readonly-input"
                placeholder="Auto-generated"
              />
            </div>
            
            <div className="form-group">
              <label>Student Name *</label>
              <input
                type="text"
                name="studentName"
                value={studentData.studentName}
                onChange={handleInputChange}
                placeholder="Enter student full name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Grade *</label>
            <select
              name="grade"
              value={studentData.grade}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Grade</option>
              <option value="Grade 1">Grade 1</option>
              <option value="Grade 2">Grade 2</option>
              <option value="Grade 3">Grade 3</option>
              <option value="Grade 4">Grade 4</option>
              <option value="Grade 5">Grade 5</option>
              <option value="Grade 6">Grade 6</option>
              <option value="Grade 7">Grade 7</option>
              <option value="Grade 8">Grade 8</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
              <option value="Grade 13">Grade 13</option>
            </select>
          </div>

          <div className="form-group">
            <label>Student Address *</label>
            <textarea
              name="address"
              value={studentData.address}
              onChange={handleInputChange}
              placeholder="Enter complete residential address"
              rows={3}
              required
            />
          </div>
        </div>

        {/* Parents Information Section */}
        <div className="form-section">
          <h2 className="section-title">Parents Information</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Parent/Guardian Name *</label>
              <input
                type="text"
                name="parentName"
                value={studentData.parentName}
                onChange={handleInputChange}
                placeholder="Enter parent or guardian name"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="parentPhone"
                value={studentData.parentPhone}
                onChange={handleInputChange}
                placeholder="e.g., +94 77 123 4567"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="parentEmail"
                value={studentData.parentEmail}
                onChange={handleInputChange}
                placeholder="parent@example.com"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={() => setStudentData(prev => ({
            ...prev,
            studentName: '',
            grade: '',
            address: '',
            parentName: '',
            parentPhone: '',
            parentEmail: ''
          }))}>
            Clear Form
          </button>
          <button type="submit" className="btn-primary">
            📝 Register Student
          </button>
        </div>
      </form>

      {/* Students List - Only show after first registration */}
      {showStudentList && students.length > 0 && (
        <div className="student-list-bordered">
          <div className="list-header">
            <h2>👨‍🎓 Registered Students</h2>
            <div className="student-count">
              <span className="count-badge">{students.length}</span>
              <span className="count-text">Total Students</span>
            </div>
          </div>
          <div className="students-grid">
            {students.map((student) => (
              <div key={student.id}>
                <div className="student-card simple">
                  <div className="student-info-display">
                    <div className="info-section left-section">
                      <h4>Student Information</h4>
                      <div className="info-item">
                        <span className="info-label">Student Registration Number:-</span>
                        <span className="info-value">{student.registrationNumber}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Student Name:-</span>
                        <span className="info-value">{student.studentName}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Grade:-</span>
                        <span className="info-value">Grade {student.grade}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Student Address:-</span>
                        <span className="info-value">{student.address}</span>
                      </div>
                      {student.assignedRoom && (
                        <div className="info-item">
                          <span className="info-label">Assigned Room:-</span>
                          <span className="info-value room-number">{student.assignedRoom}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="info-section right-section">
                      <h4>Parents Information</h4>
                      <div className="info-item">
                        <span className="info-label">Parent/Guardian Name *:-</span>
                        <span className="info-value">{student.parentName}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Phone Number *:-</span>
                        <span className="info-value">{student.parentPhone}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Email Address:-</span>
                        <span className="info-value">{student.parentEmail || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentRegistrationPage
