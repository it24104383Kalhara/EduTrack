import React, { useState, useEffect } from 'react';
import { gradeApi, studentApi } from '../services/api';
import type { Grade, Student } from '../services/api';

const AttendanceManagement: React.FC = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [selectedReportDate, setSelectedReportDate] = useState<string>('');
  const [showDateStudents, setShowDateStudents] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showDateSelection, setShowDateSelection] = useState(false);
  const [attendanceData, setAttendanceData] = useState<{[key: number]: 'present' | 'absent' | 'late'}>({});
  const [savedAttendanceRecords, setSavedAttendanceRecords] = useState<{[gradeId: string]: {[date: string]: {[studentId: number]: 'present' | 'absent' | 'late'}}}>(() => {
    // Load from localStorage on initial render
    const saved = localStorage.getItem('attendanceRecords');
    return saved ? JSON.parse(saved) : {};
  });

  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem('attendanceRecords', JSON.stringify(savedAttendanceRecords));
  }, [savedAttendanceRecords]);

  useEffect(() => {
    fetchGrades();
    fetchStudents();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const gradesData = await gradeApi.getAll();
      setGrades(gradesData);
    } catch (error) {
      console.error('Failed to fetch grades:', error);
      setGrades([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const studentsData = await studentApi.getAll();
      setStudents(studentsData);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setStudents([]);
    }
  };

  const handleTakeAttendance = (grade: Grade) => {
    setSelectedGrade(grade);
    setShowDateSelection(true);
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    
    // Check if there's existing attendance for today
    const gradeAttendance = savedAttendanceRecords[grade.id];
    if (gradeAttendance && gradeAttendance[today]) {
      setAttendanceData(gradeAttendance[today]);
    } else {
      setAttendanceData({});
    }
  };

  const handleDateSelect = () => {
    setShowDateSelection(false);
    
    // Load existing attendance for selected date
    if (selectedGrade) {
      const gradeAttendance = savedAttendanceRecords[selectedGrade.id];
      console.log('Loading attendance for grade:', selectedGrade.id);
      console.log('Available dates:', gradeAttendance ? Object.keys(gradeAttendance) : 'none');
      console.log('Selected date:', selectedDate);
      
      if (gradeAttendance && gradeAttendance[selectedDate]) {
        console.log('Found attendance data:', gradeAttendance[selectedDate]);
        setAttendanceData(gradeAttendance[selectedDate]);
      } else {
        console.log('No existing data, starting fresh');
        setAttendanceData({});
      }
    }
    
    setShowStudentsModal(true);
  };

  const closeStudentsModal = () => {
    setShowStudentsModal(false);
    setSelectedGrade(null);
    setAttendanceData({});
  };

  const closeDateSelection = () => {
    setShowDateSelection(false);
    setSelectedGrade(null);
  };

  const toggleAttendance = (studentId: number, status: 'present' | 'absent' | 'late') => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const getGradeStudents = () => {
    if (!selectedGrade) return [];
    return students.filter(student => 
      selectedGrade.students?.some(s => s.id === student.id)
    );
  };

  const handleSubmitAttendance = () => {
    console.log('Submitting attendance for grade:', selectedGrade?.grade, '-', selectedGrade?.grade_part);
    console.log('Date:', selectedDate);
    console.log('Attendance data to save:', attendanceData);
    
    // Save attendance records with date
    if (selectedGrade) {
      const newRecords = {
        ...savedAttendanceRecords,
        [selectedGrade.id]: {
          ...savedAttendanceRecords[selectedGrade.id],
          [selectedDate]: attendanceData
        }
      };
      console.log('New records structure:', newRecords);
      setSavedAttendanceRecords(newRecords);
    }
    
    alert('Attendance submitted successfully!');
    closeStudentsModal();
  };

  const handleViewReports = (grade: Grade) => {
    console.log('Opening reports for grade:', grade);
    setSelectedGrade(grade);
    setShowReportsModal(true);
    setSelectedReportDate('');
    setShowDateStudents(false);
  };

  const closeReportsModal = () => {
    setShowReportsModal(false);
    setSelectedGrade(null);
    setSelectedReportDate('');
    setShowDateStudents(false);
  };

  const handleDateClick = (date: string) => {
    setSelectedReportDate(date);
    setShowDateStudents(true);
    
    // Load existing attendance for that date
    if (selectedGrade) {
      const gradeAttendance = savedAttendanceRecords[selectedGrade.id];
      if (gradeAttendance && gradeAttendance[date]) {
        setAttendanceData(gradeAttendance[date]);
      } else {
        setAttendanceData({});
      }
    }
  };

  const getAttendanceDates = () => {
    if (!selectedGrade) return [];
    console.log('Getting dates for grade ID:', selectedGrade.id, 'grade:', selectedGrade);
    const gradeAttendance = savedAttendanceRecords[selectedGrade.id];
    console.log('Found attendance records:', gradeAttendance);
    if (!gradeAttendance) return [];
    
    const dates = Object.keys(gradeAttendance).sort();
    console.log('Available dates:', dates);
    return dates;
  };

  const getAttendanceStatus = (studentId: number) => {
    if (!selectedGrade || !selectedReportDate) return 'not-marked';
    const gradeAttendance = savedAttendanceRecords[selectedGrade.id];
    if (!gradeAttendance) return 'not-marked';
    
    return gradeAttendance[selectedReportDate]?.[studentId] || 'not-marked';
  };

  const downloadAttendancePDF = () => {
    if (!selectedGrade || !selectedReportDate) return;
    
    const gradeAttendance = savedAttendanceRecords[selectedGrade.id];
    if (!gradeAttendance || !gradeAttendance[selectedReportDate]) return;
    
    // Create PDF content
    const attendanceData = gradeAttendance[selectedReportDate];
    const students = getGradeStudents();
    
    let pdfContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Attendance Report - Grade ${selectedGrade.grade}-${selectedGrade.grade_part}</title>
          <style>
            @page {
              margin: 0;
              padding: 0;
              size: A4;
            }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 30px;
              background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
              color: #1f2937;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding: 25px;
              background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header h1 {
              color: white;
              font-size: 28px;
              margin: 0 0 10px 0;
              font-weight: 300;
            }
            .header p {
              color: rgba(255, 255, 255, 0.9);
              font-size: 16px;
              margin: 0;
            }
            .content {
              background: white;
              border-radius: 12px;
              padding: 30px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .stats {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin-bottom: 20px;
            }
            .stat-card {
              text-align: center;
              padding: 12px;
              border-radius: 8px;
              border-left: 4px solid;
              transition: all 0.3s ease;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .stat-card:hover {
              transform: translateY(-3px) scale(1.02);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            .stat-card.present {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              border-color: #059669;
              border-left: 4px solid #10b981;
            }
            .stat-card.absent {
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              border-color: #dc2626;
              border-left: 4px solid #ef4444;
            }
            .stat-card.late {
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              border-color: #d97706;
              border-left: 4px solid #f59e0b;
            }
            .stat-number {
              font-size: 24px;
              font-weight: 700;
              margin-bottom: 4px;
            }
            .stat-label {
              font-size: 12px;
              font-weight: 500;
              color: #64748b;
            }
            table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              margin-top: 25px;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
              border: 4px solid #000000;
              border-image: linear-gradient(45deg, #8b5cf6, #7c3aed, #8b5cf6, #7c3aed);
              border-image-slice: 1;
            }
            th {
              background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
              color: white;
              padding: 16px 15px;
              text-align: left;
              font-weight: 600;
              font-size: 13px;
              border: none;
              position: sticky;
              top: 0;
              z-index: 10;
              border-bottom: 4px solid rgba(255, 255, 255, 0.2);
              border-right: 3px solid rgba(0, 0, 0, 0.25);
            }
            td {
              padding: 14px 16px;
              font-size: 13px;
              position: relative;
              border-right: 3px solid rgba(0, 0, 0, 0.25);
              border-bottom: 3px solid rgba(0, 0, 0, 0.25);
            }
            tr:nth-child(even) {
              background: linear-gradient(90deg, rgba(248, 250, 252, 0.05) 0%, rgba(248, 250, 252, 0.03) 100%);
            }
            tr:hover {
              background: linear-gradient(90deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.02) 100%);
              transform: scale(1.01);
              transition: all 0.2s ease;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            }
            tr:hover td {
              border-bottom-color: transparent;
              border-right-color: transparent;
              background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
            }
            .present {
              background: linear-gradient(135deg, #d4edda 0%, #bbf7d0 100%);
              color: #166534;
              font-weight: 600;
              border-radius: 4px;
              padding: 4px 8px;
              display: inline-block;
              min-width: 60px;
              font-size: 11px;
              text-align: center;
            }
            .absent {
              background: linear-gradient(135deg, #f8d7da 0%, #fbbf24 100%);
              color: #991b1b;
              font-weight: 600;
              border-radius: 4px;
              padding: 4px 8px;
              display: inline-block;
              min-width: 60px;
              font-size: 11px;
              text-align: center;
            }
            .late {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              color: #92400e;
              font-weight: 600;
              border-radius: 4px;
              padding: 4px 8px;
              display: inline-block;
              min-width: 60px;
              font-size: 11px;
              text-align: center;
            }
            .not-marked {
              background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
              color: #6b7280;
              font-weight: 600;
              border-radius: 4px;
              padding: 4px 8px;
              display: inline-block;
              min-width: 60px;
              font-size: 11px;
              text-align: center;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
              padding: 20px;
              background: #f9fafb;
              border-radius: 8px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Attendance Report</h1>
            <p>Grade: ${selectedGrade.grade}-${selectedGrade.grade_part} | Date: ${selectedReportDate}</p>
          </div>
          
          <div class="content">
            <!-- Statistics Summary -->
            <div class="stats">
              <div class="stat-card present">
                <div class="stat-number">${students.filter(s => attendanceData[s.id] === 'present').length}</div>
                <div class="stat-label">✅ Present</div>
              </div>
              <div class="stat-card absent">
                <div class="stat-number">${students.filter(s => attendanceData[s.id] === 'absent').length}</div>
                <div class="stat-label">❌ Absent</div>
              </div>
              <div class="stat-card late">
                <div class="stat-number">${students.filter(s => attendanceData[s.id] === 'late').length}</div>
                <div class="stat-label">⏰ Late</div>
              </div>
              <div class="stat-card" style="border-color: #6b7280;">
                <div class="stat-number">${students.filter(s => !attendanceData[s.id]).length}</div>
                <div class="stat-label">⏸️ Not Marked</div>
              </div>
            </div>
            
            <!-- Attendance Details Table -->
            <table>
              <thead>
                <tr>
                  <th style="width: 10%; text-align: center;">Student ID</th>
                  <th style="width: 40%;">Student Name</th>
                  <th style="width: 15%; text-align: center;">Status</th>
                  <th style="width: 35%;">Parent Phone</th>
                </tr>
              </thead>
              <tbody>
    `;
    
    students.forEach(student => {
      const status = attendanceData[student.id] || 'not-marked';
      const statusClass = status === 'present' ? 'present' : 
                        status === 'absent' ? 'absent' : 
                        status === 'late' ? 'late' : 'not-marked';
      const statusText = status === 'present' ? '✅ Present' : 
                       status === 'absent' ? '❌ Absent' : 
                       status === 'late' ? '⏰ Late' : '⏸️ Not Marked';
      
      pdfContent += `
                <tr>
                  <td style="text-align: center; font-weight: 600;">${student.id}</td>
                  <td>${student.first_name} ${student.last_name}</td>
                  <td style="text-align: center;"><span class="${statusClass}">${statusText}</span></td>
                  <td style="color: #6b7280;">📱 ${student.parent_phone}</td>
                </tr>
      `;
    });
    
    pdfContent += `
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p>© 2026 EduTrack Student Management System</p>
          </div>
        </body>
      </html>
    `;
    
    // Create and download PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(pdfContent);
      printWindow.document.close();
      printWindow.print();
    }
  };
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 25%, #1e40af 50%, #1e3a8a 75%, #1e3a8a 100%)',
        padding: '40px',
        fontFamily: 'Inter, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#e2e8f0'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
          <div>Loading Attendance Management...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 25%, #1e40af 50%, #1e3a8a 75%, #1e3a8a 100%)',
      padding: '40px',
      fontFamily: 'Inter, sans-serif',
      fontSize: '18px',
      color: '#e2e8f0',
      position: 'relative'
    }}>
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '24px',
        border: '3px solid #000000',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)',
        padding: '60px'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px',
            filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))',
            animation: 'pulse 2s infinite'
          }}>
            📅
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            color: '#3b82f6',
            marginBottom: '16px',
            textShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
            letterSpacing: '-1px'
          }}>
            Attendance Management
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#94a3b8',
            marginBottom: '30px',
            maxWidth: '700px',
            margin: '0 auto 30px',
            lineHeight: '1.6',
            fontWeight: '400'
          }}>
            Select a grade to manage attendance tracking and monitoring
          </p>
        </div>

        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '16px',
          border: '2px solid #3b82f6',
          padding: '20px',
          maxHeight: '500px',
          overflowY: 'auto'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#3b82f6',
            marginBottom: '15px',
            textAlign: 'center',
            marginTop: 0
          }}>
            📚 Available Grades ({grades.length})
          </h2>
          
          {grades.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '30px',
              color: '#94a3b8'
            }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📚</div>
              <div style={{ fontSize: '16px', marginBottom: '6px' }}>No grades available</div>
              <div style={{ fontSize: '13px' }}>Please create grades in Grade Management first</div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {grades.map(grade => (
                <div
                  key={grade.id}
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
                    border: '1px solid #3b82f6',
                    borderRadius: '8px',
                    padding: '12px 15px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => {
                    // Future: Navigate to grade-specific attendance management
                    console.log(`Selected grade: ${grade.grade}-${grade.grade_part}`);
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flex: 1
                  }}>
                    <div style={{
                      background: '#3b82f6',
                      color: 'white',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '700',
                      flexShrink: 0
                    }}>
                      {grade.grade}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#ffffff',
                        marginBottom: '2px'
                      }}>
                        Grade {grade.grade}-{grade.grade_part}
                      </div>
                      
                      <div style={{
                        fontSize: '12px',
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px'
                      }}>
                        <span>👥 {grade.students?.length || 0} students</span>
                        <span>📅 {new Date(grade.created_at || '').toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <button
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTakeAttendance(grade);
                      }}
                    >
                      📝 Take
                    </button>
                    <button
                      style={{
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewReports(grade);
                      }}
                    >
                      📊 Reports
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

        {/* Date Selection Modal */}
        {showDateSelection && selectedGrade && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '2px solid #3b82f6',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '350px',
              width: '100%'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <div>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#3b82f6',
                    margin: '0 0 8px 0'
                  }}>
                    📅 Select Date
                  </h2>
                  <p style={{
                    fontSize: '14px',
                    color: '#94a3b8',
                    margin: 0
                  }}>
                    Grade: {selectedGrade.grade}-{selectedGrade.grade_part}
                  </p>
                </div>
                <button
                  onClick={closeDateSelection}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ✕ Close
                </button>
              </div>

              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  color: '#94a3b8',
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  Select Attendance Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#e2e8f0',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '20px'
              }}>
                <button
                  onClick={closeDateSelection}
                  style={{
                    background: 'rgba(107, 114, 128, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(107, 114, 128, 0.3)',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDateSelect}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Continue →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Students Modal */}
        {showStudentsModal && selectedGrade && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '20px 20px 20px 320px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '2px solid #3b82f6',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '1000px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <div>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#3b82f6',
                    margin: '0 0 8px 0'
                  }}>
                    📝 Take Attendance
                  </h2>
                  <p style={{
                    fontSize: '14px',
                    color: '#94a3b8',
                    margin: 0
                  }}>
                    Grade: {selectedGrade.grade}-{selectedGrade.grade_part} | Date: {selectedDate}
                  </p>
                </div>
                <button
                  onClick={closeStudentsModal}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ✕ Close
                </button>
              </div>

              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '12px',
                padding: '15px',
                marginBottom: '20px'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#3b82f6',
                  marginBottom: '10px'
                }}>
                  Students List ({getGradeStudents().length})
                </div>
                
                {getGradeStudents().length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#94a3b8'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
                    <div>No students assigned to this grade</div>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    {getGradeStudents().map(student => (
                      <div
                        key={student.id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          padding: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            color: 'white',
                            fontWeight: '700'
                          }}>
                            {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                          </div>
                          <div>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#ffffff',
                              marginBottom: '2px'
                            }}>
                              {student.first_name} {student.last_name}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: '#94a3b8'
                            }}>
                              📱 {student.parent_phone}
                            </div>
                          </div>
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          gap: '8px'
                        }}>
                          <button
                            onClick={() => toggleAttendance(student.id, 'present')}
                            style={{
                              background: attendanceData[student.id] === 'present' 
                                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                : 'rgba(16, 185, 129, 0.2)',
                              color: 'white',
                              border: attendanceData[student.id] === 'present' 
                                ? '1px solid #10b981'
                                : '1px solid rgba(16, 185, 129, 0.3)',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            ✅ Present
                          </button>
                          <button
                            onClick={() => toggleAttendance(student.id, 'absent')}
                            style={{
                              background: attendanceData[student.id] === 'absent' 
                                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                : 'rgba(239, 68, 68, 0.2)',
                              color: 'white',
                              border: attendanceData[student.id] === 'absent' 
                                ? '1px solid #ef4444'
                                : '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            ❌ Absent
                          </button>
                          <button
                            onClick={() => toggleAttendance(student.id, 'late')}
                            style={{
                              background: attendanceData[student.id] === 'late' 
                                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                : 'rgba(245, 158, 11, 0.2)',
                              color: 'white',
                              border: attendanceData[student.id] === 'late' 
                                ? '1px solid #f59e0b'
                                : '1px solid rgba(245, 158, 11, 0.3)',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            ⏰ Late
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '15px'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: '#94a3b8'
                }}>
                  Marked: {Object.keys(attendanceData).length} / {getGradeStudents().length} students
                </div>
                <div style={{
                  display: 'flex',
                  gap: '10px'
                }}>
                  <button
                    onClick={() => setAttendanceData({})}
                    style={{
                      background: 'rgba(107, 114, 128, 0.2)',
                      color: 'white',
                      border: '1px solid rgba(107, 114, 128, 0.3)',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Reset
                  </button>
                  <button
                    onClick={handleSubmitAttendance}
                    disabled={Object.keys(attendanceData).length === 0}
                    style={{
                      background: Object.keys(attendanceData).length > 0
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : 'rgba(107, 114, 128, 0.3)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: Object.keys(attendanceData).length > 0 ? 'pointer' : 'not-allowed'
                    }}
                  >
                    ✅ Submit Attendance
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Simple Reports Modal */}
        {showReportsModal && selectedGrade && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '20px 20px 20px 320px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '2px solid #8b5cf6',
              borderRadius: '16px',
              padding: '25px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <div>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#8b5cf6',
                    margin: '0 0 8px 0'
                  }}>
                    📊 Attendance Report
                  </h2>
                  <p style={{
                    fontSize: '14px',
                    color: '#94a3b8',
                    margin: 0
                  }}>
                    Grade: {selectedGrade.grade}-{selectedGrade.grade_part}
                  </p>
                </div>
                <button
                  onClick={closeReportsModal}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ✕ Close
                </button>
              </div>

              <div style={{
                display: 'flex',
                gap: '20px'
              }}>
                {/* Dates List */}
                <div style={{
                  flex: '0 0 250px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#8b5cf6',
                    marginBottom: '15px',
                    marginTop: 0
                  }}>
                    📅 Attendance Dates
                  </h3>
                  
                  {getAttendanceDates().length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '20px',
                      color: '#94a3b8'
                    }}>
                      <div>No attendance records found</div>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      {getAttendanceDates().map(date => (
                        <div
                          key={date}
                          onClick={() => handleDateClick(date)}
                          style={{
                            background: selectedReportDate === date
                              ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                              : 'rgba(255, 255, 255, 0.05)',
                            border: selectedReportDate === date
                              ? '2px solid #8b5cf6'
                              : '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            fontSize: '12px',
                            color: '#ffffff',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%',
                            marginBottom: '4px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span>📅 {date}</span>
                            <span style={{
                              fontSize: '10px',
                              color: '#10b981',
                              fontWeight: '600'
                            }}>
                              ✓ Marked
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Download PDF Button */}
                  {selectedReportDate && (
                    <button
                      onClick={downloadAttendancePDF}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        marginTop: '15px',
                        width: '100%'
                      }}
                    >
                      📄 Download PDF
                    </button>
                  )}
                </div>

                {/* Students List for Selected Date */}
                {showDateStudents && selectedReportDate && (
                  <div style={{
                    flex: '1',
                    background: 'rgba(139, 92, 246, 0.1)',
                    borderRadius: '12px',
                    padding: '20px'
                  }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#8b5cf6',
                      marginBottom: '15px',
                      marginTop: 0
                    }}>
                      👥 Students - {selectedReportDate}
                    </h3>
                    
                    {getGradeStudents().length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '20px',
                        color: '#94a3b8'
                      }}>
                        <div>No students assigned to this grade</div>
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        {/* Header */}
                        <div style={{
                          display: 'flex',
                          padding: '10px',
                          background: 'rgba(139, 92, 246, 0.2)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#ffffff'
                        }}>
                          <div style={{ flex: '0 0 80px' }}>Student ID</div>
                          <div style={{ flex: '1' }}>Student Name</div>
                          <div style={{ flex: '0 0 100px', textAlign: 'center' }}>Status</div>
                        </div>
                        
                        {/* Student Rows */}
                        {getGradeStudents().map(student => {
                          const status = getAttendanceStatus(student.id);
                          return (
                            <div
                              key={student.id}
                              style={{
                                display: 'flex',
                                padding: '10px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '6px',
                                fontSize: '13px',
                                color: '#ffffff'
                              }}
                            >
                              <div style={{ flex: '0 0 80px' }}>{student.id}</div>
                              <div style={{ flex: '1' }}>{student.first_name} {student.last_name}</div>
                              <div style={{ 
                                flex: '0 0 100px', 
                                textAlign: 'center',
                                ...(status === 'present' && { color: '#10b981' }),
                                ...(status === 'absent' && { color: '#ef4444' }),
                                ...(status === 'late' && { color: '#f59e0b' }),
                                ...(status === 'not-marked' && { color: '#6b7280' })
                              }}>
                                {status === 'present' && 'Present'}
                                {status === 'absent' && 'Absent'}
                                {status === 'late' && 'Late'}
                                {status === 'not-marked' && 'Not Marked'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default AttendanceManagement;
