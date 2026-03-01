import React, { useState, useEffect } from 'react';
import { gradeApi, studentApi, attendanceMarkApi } from '../services/api';
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
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('en-CA'));
  const [showDateSelection, setShowDateSelection] = useState(false);
  const [attendanceData, setAttendanceData] = useState<{[key: number]: 'present' | 'absent' | 'late' | 'not-marked'}>({});
  const [attendanceDates, setAttendanceDates] = useState<string[]>([]);

  useEffect(() => {
    fetchGrades();
    fetchStudents();
  }, []);

  // Load attendance data for a specific date
  const loadAttendanceForDate = async (date: string) => {
    if (!selectedGrade) return;
    
    try {
      console.log('Loading attendance data for date:', date);
      
      const attendanceData = await attendanceMarkApi.getByGradeSectionDate(
        selectedGrade.grade,
        selectedGrade.grade_part,
        date
      );
      
      console.log('Loaded attendance data:', attendanceData);
      
      // Convert the database format to the component's expected format
      const attendanceMap: {[key: number]: 'present' | 'absent' | 'late'} = {};
      attendanceData.attendance.forEach(record => {
        console.log(`Mapping student ${record.student_id} to status ${record.status}`);
        attendanceMap[record.student_id] = record.status;
      });
      
      console.log('Final attendance map:', attendanceMap);
      setAttendanceData(attendanceMap);
    } catch (error) {
      console.error('Error loading attendance data:', error);
      setAttendanceData({});
    }
  };

  // Load attendance dates when a grade is selected for reports
  useEffect(() => {
    if (selectedGrade && showReportsModal) {
      loadAttendanceDates();
    }
  }, [selectedGrade, showReportsModal]);

  const loadAttendanceDates = async () => {
    if (!selectedGrade) return;
    
    try {
      console.log('Loading dates for grade:', selectedGrade.grade, '-', selectedGrade.grade_part);
      
      // Get all attendance records and filter by grade
      const allAttendance = await attendanceMarkApi.getAllAttendance();
      console.log('All attendance records from API:', allAttendance);
      
      // Filter dates for this specific grade and section
      const filteredRecords = allAttendance.attendance
        .filter(record => record.grade === selectedGrade.grade && record.section === selectedGrade.grade_part);
      console.log('Filtered records for grade', selectedGrade.grade, '-', selectedGrade.grade_part, ':', filteredRecords);
      
      const gradeDates = filteredRecords
        .map(record => {
          const date = new Date(record.marked_date);
          return date.toLocaleDateString('en-CA'); // Convert to YYYY-MM-DD format
        })
        .filter((date, index, self) => self.indexOf(date) === index) // Remove duplicates
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Sort by date descending
      
      console.log('Final attendance dates to display:', gradeDates);
      console.log('Setting attendanceDates state to:', gradeDates);
      setAttendanceDates(gradeDates);
    } catch (error) {
      console.error('Error getting attendance dates:', error);
      setAttendanceDates([]);
    }
  };

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

  const handleTakeAttendance = async (grade: Grade) => {
    setSelectedGrade(grade);
    setShowDateSelection(true);
    const today = new Date().toLocaleDateString('en-CA'); // Uses local timezone, format: YYYY-MM-DD
    setSelectedDate(today);
    
    // Load existing attendance for today from database
    try {
      const attendanceData = await attendanceMarkApi.getByGradeSectionDate(
        grade.grade,
        grade.grade_part,
        today
      );
      
      // Convert to component format
      const attendanceMap: {[key: number]: 'present' | 'absent' | 'late'} = {};
      attendanceData.attendance.forEach(record => {
        attendanceMap[record.student_id] = record.status;
      });
      
      setAttendanceData(attendanceMap);
    } catch (error) {
      console.log('No existing attendance for today, starting fresh');
      setAttendanceData({});
    }
  };

  const handleDateSelect = async () => {
    setShowDateSelection(false);
    
    // Load existing attendance for selected date from database
    if (selectedGrade) {
      try {
        console.log('Loading attendance for grade:', selectedGrade.grade, '-', selectedGrade.grade_part);
        console.log('Selected date:', selectedDate);
        
        const attendanceData = await attendanceMarkApi.getByGradeSectionDate(
          selectedGrade.grade,
          selectedGrade.grade_part,
          selectedDate
        );
        
        // Convert to component format
        const attendanceMap: {[key: number]: 'present' | 'absent' | 'late'} = {};
        attendanceData.attendance.forEach(record => {
          attendanceMap[record.student_id] = record.status;
        });
        
        console.log('Found attendance data:', attendanceMap);
        setAttendanceData(attendanceMap);
      } catch (error) {
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

  const toggleAttendance = (studentId: number, status: 'present' | 'absent' | 'late' | 'not-marked') => {
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

  const handleSubmitAttendance = async () => {
    console.log('Submitting attendance for grade:', selectedGrade?.grade, '-', selectedGrade?.grade_part);
    console.log('Date:', selectedDate);
    console.log('Attendance data to save:', attendanceData);
    
    if (!selectedGrade) {
      alert('No grade selected');
      return;
    }

    try {
      // Prepare attendance records for bulk marking (exclude not-marked entries)
      const attendanceRecords = Object.entries(attendanceData)
        .filter(([_studentId, status]) => status !== 'not-marked')
        .map(([studentId, status]) => {
          const student = getGradeStudents().find(s => s.id === parseInt(studentId));
          return {
            student_id: parseInt(studentId),
            student_name: student ? `${student.first_name} ${student.last_name}` : 'Unknown Student',
            grade: selectedGrade.grade,
            section: selectedGrade.grade_part,
            status: status as 'present' | 'absent' | 'late',
            marked_date: selectedDate,
            marked_by: 'System'
          };
        });

      console.log('Sending attendance records:', attendanceRecords);

      // Call the backend API to mark attendance
      const result = await attendanceMarkApi.bulkMarkAttendance({
        attendance_records: attendanceRecords
      });

      console.log('Attendance marked successfully:', result);
      
      // Clear local attendance data
      setAttendanceData({});
      
      alert(`Attendance submitted successfully! Marked ${result.marked_students} students.`);
      closeStudentsModal();
    } catch (error) {
      console.error('Error submitting attendance:', error);
      alert('Failed to submit attendance. Please try again.');
    }
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

  

  
  const clearLocalStorage = () => {
    // Clear any attendance-related local storage items
    const keysToRemove = [
      'attendanceData',
      'selectedGrade',
      'selectedDate', 
      'attendanceDates',
      'selectedReportDate',
      'attendanceState'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Also clear any other items that might be attendance-related
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('attendance') || key.includes('grade') || key.includes('student'))) {
        localStorage.removeItem(key);
      }
    }
    
    console.log('Local storage cleared for attendance management');
    alert('Local storage cleared successfully!');
  };


  const downloadSingleDatePDF = async (date: string) => {
    if (!selectedGrade) return;
    
    try {
      // Get attendance data for the specific date
      const attendanceData = await attendanceMarkApi.getByGradeSectionDate(
        selectedGrade.grade,
        selectedGrade.grade_part,
        date
      );
      
      // Get all students for this grade
      const students = getGradeStudents();
      
      // Convert the database format to the component's expected format
      const attendanceMap: {[key: number]: 'present' | 'absent' | 'late' | 'not-marked'} = {};
      attendanceData.attendance.forEach(record => {
        attendanceMap[record.student_id] = record.status;
      });
      
      // Generate PDF content for this specific date
      let pdfContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Attendance Sheet - Grade ${selectedGrade.grade}-${selectedGrade.grade_part} - ${date}</title>
            <style>
              @page {
                margin: 0;
                padding: 0;
                size: A4;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              @media print {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 0; 
                padding: 30px;
                background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
                color: #1f2937;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .header {
                text-align: center;
                margin-bottom: 40px;
                padding: 25px;
                background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .header h1 {
                color: white !important;
                font-size: 28px;
                margin: 0 0 10px 0;
                font-weight: 300;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .header p {
                color: rgba(255, 255, 255, 0.9) !important;
                font-size: 16px;
                margin: 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .content {
                background: white;
                border-radius: 12px;
                padding: 30px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
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
                background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
                border-color: #059669;
                border-left: 4px solid #10b981;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .stat-card.absent {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
                border-color: #dc2626;
                border-left: 4px solid #ef4444;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .stat-card.late {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
                border-color: #d97706;
                border-left: 4px solid #f59e0b;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .stat-card.not-marked {
                background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%) !important;
                border-color: #4b5563;
                border-left: 4px solid #6b7280;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .stat-number {
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 4px;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .stat-label {
                font-size: 12px;
                font-weight: 500;
                color: rgba(255, 255, 255, 0.9) !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
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
                border: 2px solid #e5e7eb;
              }
              th {
                background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%) !important;
                color: white !important;
                padding: 16px 12px;
                text-align: center;
                font-weight: 700;
                font-size: 14px;
                border: none;
                position: sticky;
                top: 0;
                z-index: 10;
                border-bottom: 3px solid #4f46e5;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              td {
                padding: 14px 12px;
                font-size: 13px;
                position: relative;
                border-bottom: 1px solid #e5e7eb;
                border-right: 1px solid #e5e7eb;
                vertical-align: middle;
                text-align: center;
              }
              td:first-child {
                text-align: center;
                font-weight: 700;
                background: #f8fafc !important;
                color: #4f46e5 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              td:nth-child(2) {
                text-align: left;
                font-weight: 600;
                color: #1f2937 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              td:nth-child(3) {
                text-align: center;
              }
              td:nth-child(4) {
                text-align: left;
                color: #6b7280 !important;
                font-size: 12px;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              tr:nth-child(even) {
                background: #f9fafb;
              }
              tr:nth-child(odd) {
                background: white;
              }
              tr:hover {
                background: #f0f9ff;
                transform: scale(1.005);
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(79, 70, 229, 0.1);
              }
              tr:hover td {
                border-bottom-color: #4f46e5;
                border-right-color: #4f46e5;
              }
              .present {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
                color: white !important;
                font-weight: 700;
                border-radius: 6px;
                padding: 6px 12px;
                display: inline-block;
                min-width: 70px;
                font-size: 11px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .absent {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
                color: white !important;
                font-weight: 700;
                border-radius: 6px;
                padding: 6px 12px;
                display: inline-block;
                min-width: 70px;
                font-size: 11px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .late {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
                color: white !important;
                font-weight: 700;
                border-radius: 6px;
                padding: 6px 12px;
                display: inline-block;
                min-width: 70px;
                font-size: 11px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .not-marked {
                background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%) !important;
                color: white !important;
                font-weight: 700;
                border-radius: 6px;
                padding: 6px 12px;
                display: inline-block;
                min-width: 70px;
                font-size: 11px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(107, 114, 128, 0.3);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
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
              <h1>📊 Attendance Sheet</h1>
              <p>Grade: ${selectedGrade.grade}-${selectedGrade.grade_part} | Date: ${date}</p>
            </div>
            
            <div class="content">
              <!-- Statistics Summary -->
              <div class="stats">
                <div class="stat-card present">
                  <div class="stat-number">${students.filter(s => attendanceMap[s.id] === 'present').length}</div>
                  <div class="stat-label">✅ Present</div>
                </div>
                <div class="stat-card absent">
                  <div class="stat-number">${students.filter(s => attendanceMap[s.id] === 'absent').length}</div>
                  <div class="stat-label">❌ Absent</div>
                </div>
                <div class="stat-card late">
                  <div class="stat-number">${students.filter(s => attendanceMap[s.id] === 'late').length}</div>
                  <div class="stat-label">⏰ Late</div>
                </div>
                <div class="stat-card not-marked">
                  <div class="stat-number">${students.filter(s => !attendanceMap[s.id]).length}</div>
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
        const status = attendanceMap[student.id] || 'not-marked';
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
      
      // Create and download PDF for this date
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        
        // Wait a moment before printing to ensure content is loaded
        setTimeout(() => {
          printWindow.print();
          // Close the window after printing (user can cancel if needed)
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }, 500);
      }
      
    } catch (error) {
      console.error(`Error generating PDF for ${date}:`, error);
      alert(`Failed to generate PDF for ${date}. Please try again.`);
    }
  };

  const downloadCompleteAttendancePDF = async () => {
    if (!selectedGrade) {
      console.log('downloadCompleteAttendancePDF: No selectedGrade, returning.');
      return;
    }
    
    try {
      console.log('downloadCompleteAttendancePDF: selectedGrade', selectedGrade);
      // Use the same method as loadAttendanceDates to get all dates for this grade
      const allAttendance = await attendanceMarkApi.getAllAttendance();
      console.log('downloadCompleteAttendancePDF: allAttendance', allAttendance);
      
      // Filter dates for this specific grade and section
      const filteredRecords = allAttendance.attendance
        .filter(record => record.grade === selectedGrade.grade && record.section === selectedGrade.grade_part);
      console.log('downloadCompleteAttendancePDF: filteredRecords', filteredRecords);
      
      const attendanceDates = filteredRecords
        .map(record => {
          const date = new Date(record.marked_date);
          return date.toLocaleDateString('en-CA'); // Convert to YYYY-MM-DD format
        })
        .filter((date, index, self) => self.indexOf(date) === index) // Remove duplicates
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime()); // Sort by date ascending
      console.log('downloadCompleteAttendancePDF: attendanceDates', attendanceDates);
      
      if (attendanceDates.length === 0) {
        alert('No attendance data found for this grade');
        return;
      }
      
      // Get all students for this grade
      const students = getGradeStudents();
      
      // Fetch attendance data for each date using the same API as loadAttendanceForDate
      const allAttendanceData: {[key: string]: {[key: number]: 'present' | 'absent' | 'late' | 'not-marked'}} = {};
      for (const date of attendanceDates) {
        try {
          const attendanceData = await attendanceMarkApi.getByGradeSectionDate(
            selectedGrade.grade,
            selectedGrade.grade_part,
            date
          );
          
          // Convert the database format to the component's expected format
          const attendanceMap: {[key: number]: 'present' | 'absent' | 'late' | 'not-marked'} = {};
          attendanceData.attendance.forEach(record => {
            attendanceMap[record.student_id] = record.status;
          });
          allAttendanceData[date] = attendanceMap;
        } catch (error) {
          console.error(`Error fetching attendance for ${date}:`, error);
        }
      }
      
      // Generate PDF content
      let pdfContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Complete Attendance Report - Grade ${selectedGrade.grade}-${selectedGrade.grade_part}</title>
            <style>
              @page {
                margin: 0.5in;
                size: A4;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              @media print {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 0; 
                padding: 20px;
                background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
                color: #1f2937;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
                padding: 12px 15px;
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #7c3aed 100%) !important;
                border-radius: 12px;
                box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
                position: relative;
                overflow: hidden;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.15"/><circle cx="10" cy="50" r="0.5" fill="white" opacity="0.15"/><circle cx="90" cy="30" r="0.5" fill="white" opacity="0.15"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                pointer-events: none;
              }
              .header-content {
                position: relative;
                z-index: 1;
              }
              .header h1 {
                color: white !important;
                font-size: 24px;
                margin: 0 0 8px 0;
                font-weight: 700;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
                letter-spacing: 0.5px;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .header-subtitle {
                color: rgba(255, 255, 255, 0.95) !important;
                font-size: 16px;
                margin: 0 0 8px 0;
                font-weight: 500;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .header-meta {
                display: flex;
                justify-content: center;
                gap: 15px;
                margin-top: 8px;
                flex-wrap: wrap;
              }
              .meta-item {
                background: rgba(255, 255, 255, 0.15);
                padding: 4px 10px;
                border-radius: 12px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .meta-label {
                color: rgba(255, 255, 255, 0.8) !important;
                font-size: 10px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.4px;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .meta-value {
                color: white !important;
                font-size: 13px;
                font-weight: 700;
                margin-top: 1px;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .header-badge {
                display: inline-block;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
                color: white !important;
                padding: 3px 10px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                margin-top: 8px;
                box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .date-section {
                margin-bottom: 25px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                page-break-inside: avoid;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .date-header {
                background: linear-gradient(135deg, #1f2937 0%, #374151 100%) !important;
                color: white !important;
                padding: 12px 16px;
                border-radius: 8px;
                margin-bottom: 15px;
                font-size: 16px;
                font-weight: 600;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .stats-row {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 10px;
                margin-bottom: 15px;
              }
              .stat-card {
                text-align: center;
                padding: 8px;
                border-radius: 6px;
                font-size: 12px;
              }
              .stat-card.present {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .stat-card.absent {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .stat-card.late {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .stat-card.not-marked {
                background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%) !important;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
                font-size: 11px;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              th {
                background: linear-gradient(135deg, #1f2937 0%, #374151 100%) !important;
                color: white !important;
                padding: 8px 6px;
                text-align: left;
                font-weight: 600;
                border: 1px solid #374151;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              td {
                padding: 6px;
                border: 1px solid #e5e7eb;
                vertical-align: top;
              }
              tr:nth-child(even) {
                background: #f9fafb !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .present {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
                color: white !important;
                font-weight: 600;
                padding: 2px 6px;
                border-radius: 3px;
                display: inline-block;
                font-size: 10px;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .absent {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
                color: white !important;
                font-weight: 600;
                padding: 2px 6px;
                border-radius: 3px;
                display: inline-block;
                font-size: 10px;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .late {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
                color: white !important;
                font-weight: 600;
                padding: 2px 6px;
                border-radius: 3px;
                display: inline-block;
                font-size: 10px;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .not-marked {
                background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%) !important;
                color: white !important;
                font-weight: 600;
                padding: 2px 6px;
                border-radius: 3px;
                display: inline-block;
                font-size: 10px;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                color: #6b7280;
                font-size: 11px;
                padding: 15px;
                background: #f9fafb;
                border-radius: 8px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="header-content">
                <h1>📊 Complete Attendance Report</h1>
                <div class="header-subtitle">Grade: ${selectedGrade.grade}-${selectedGrade.grade_part} | All Days</div>
                
                <div class="header-meta">
                  <div class="meta-item">
                    <div class="meta-label">Total Days</div>
                    <div class="meta-value">${attendanceDates.length} days</div>
                  </div>
                  <div class="meta-item">
                    <div class="meta-label">Generated</div>
                    <div class="meta-value">${new Date().toLocaleDateString()}</div>
                  </div>
                  <div class="meta-item">
                    <div class="meta-label">Time</div>
                    <div class="meta-value">${new Date().toLocaleTimeString()}</div>
                  </div>
                </div>
                
                <div class="header-badge">
                  ✨ Official Attendance Document
                </div>
              </div>
            </div>
      `;
      
      // Generate content for each date
      attendanceDates.forEach((date: string) => {
        const dayAttendance = allAttendanceData[date] || {};
        const presentCount = students.filter(s => dayAttendance[s.id] === 'present').length;
        const absentCount = students.filter(s => dayAttendance[s.id] === 'absent').length;
        const lateCount = students.filter(s => dayAttendance[s.id] === 'late').length;
        const notMarkedCount = students.filter(s => !dayAttendance[s.id]).length;
        
        pdfContent += `
            <div class="date-section">
              <div class="date-header">📅 ${date}</div>
              
              <div class="stats-row">
                <div class="stat-card present">
                  <div style="font-size: 16px; font-weight: 700;">${presentCount}</div>
                  <div>✅ Present</div>
                </div>
                <div class="stat-card absent">
                  <div style="font-size: 16px; font-weight: 700;">${absentCount}</div>
                  <div>❌ Absent</div>
                </div>
                <div class="stat-card late">
                  <div style="font-size: 16px; font-weight: 700;">${lateCount}</div>
                  <div>⏰ Late</div>
                </div>
                <div class="stat-card not-marked">
                  <div style="font-size: 16px; font-weight: 700;">${notMarkedCount}</div>
                  <div>⏸️ Not Marked</div>
                </div>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th style="width: 8%;">Student ID</th>
                    <th style="width: 35%;">Student Name</th>
                    <th style="width: 12%;">Status</th>
                    <th style="width: 45%;">Parent Phone</th>
                  </tr>
                </thead>
                <tbody>
        `;
        
        students.forEach(student => {
          const status = dayAttendance[student.id] || 'not-marked';
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
        `;
      });
      
      pdfContent += `
            <div class="footer">
              <p>© 2026 EduTrack Student Management System</p>
              <p>Total Students: ${students.length} | Total Days: ${attendanceDates.length}</p>
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
      
    } catch (error) {
      console.error('Error generating complete attendance report:', error);
      alert('Failed to generate complete attendance report. Please try again.');
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
      position: 'relative',
      maxHeight: '100vh',
      overflowY: 'auto'
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
          
          {/* Clear Storage Button */}
          <button
            onClick={clearLocalStorage}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '20px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            🗑️ Clear Local Storage
          </button>
        </div>

        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '16px',
          border: '2px solid #3b82f6',
          padding: '20px'
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
              maxWidth: '800px',
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
                    📅 Attendance Days
                  </h3>
                  
                  {attendanceDates.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '20px',
                      color: '#94a3b8'
                    }}>
                      <div>No attendance days found</div>
                      <div style={{ fontSize: '12px', marginTop: '8px' }}>Take attendance first to see days here</div>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      {attendanceDates.map((date: string) => (
                        <div
                          key={date}
                          onClick={() => {
                            setSelectedReportDate(date);
                            setShowDateStudents(true);
                            loadAttendanceForDate(date);
                          }}
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
                            <span>📅 {date.split('T')[0]}</span>
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
                  
                                    
                  {/* Download Complete Attendance Button */}
                  <button
                    onClick={downloadCompleteAttendancePDF}
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      marginTop: '10px',
                      width: '100%'
                    }}
                  >
                    📚 Download
                  </button>
                  
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
                      👥 Students attendance for {selectedReportDate}
                    </h3>
                    
                    {/* Download PDF Button for Selected Date */}
                    <button
                      onClick={() => downloadSingleDatePDF(selectedReportDate)}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 16px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        marginBottom: '15px',
                        width: '100%'
                      }}
                    >
                      📄 Download PDF for {selectedReportDate}
                    </button>
                    
                    <div style={{
                      maxHeight: '400px',
                      overflowY: 'auto'
                    }}>
                      {getGradeStudents().length === 0 ? (
                        <div style={{
                          textAlign: 'center',
                          padding: '20px',
                          color: '#94a3b8'
                        }}>
                          <div>No students found for this grade</div>
                        </div>
                      ) : (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          {getGradeStudents().map((student) => {
                            const status = attendanceData[student.id] || 'not-marked';
                            return (
                              <div
                                key={student.id}
                                style={{
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  borderRadius: '8px',
                                  padding: '12px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}
                              >
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px'
                                }}>
                                  <div style={{
                                    background: 'rgba(139, 92, 246, 0.2)',
                                    color: '#8b5cf6',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                  }}>
                                    ID: {student.id}
                                  </div>
                                  <div>
                                    <div style={{
                                      color: '#e2e8f0',
                                      fontSize: '14px',
                                      fontWeight: '500'
                                    }}>
                                      {student.first_name} {student.last_name}
                                    </div>
                                    <div style={{
                                      color: '#94a3b8',
                                      fontSize: '12px'
                                    }}>
                                      📱 {student.parent_phone}
                                    </div>
                                  </div>
                                </div>
                                
                                <div style={{
                                  padding: '4px 12px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  textTransform: 'uppercase',
                                  ...status === 'present' && {
                                    background: 'rgba(16, 185, 129, 0.2)',
                                    color: '#10b981'
                                  },
                                  ...status === 'absent' && {
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    color: '#ef4444'
                                  },
                                  ...status === 'late' && {
                                    background: 'rgba(251, 191, 36, 0.2)',
                                    color: '#fbbf24'
                                  },
                                  ...status === 'not-marked' && {
                                    background: 'rgba(148, 163, 184, 0.2)',
                                    color: '#94a3b8'
                                  }
                                }}>
                                  {status === 'present' && '✅ Present'}
                                  {status === 'absent' && '❌ Absent'}
                                  {status === 'late' && '⏰ Late'}
                                  {status === 'not-marked' && '⭕ Not Marked'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
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
