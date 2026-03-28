import React, { useState, useEffect, useCallback } from 'react';
import { gradeApi, studentApi, attendanceMarkApi } from '../services/api';
import type { Grade, Student } from '../services/api';
import './AttendanceManagement.css';
import { isSchoolLeaveDay as checkIsLeaveDay } from '../utils/DateUtils';
import { 
  Search, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Users, 
  ChevronRight, 
  ArrowLeft, 
  Download, 
  Activity, 
  AlertTriangle,
  X,
  Loader2,
  BookOpen
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const AttendanceManagement: React.FC = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'grades' | 'dateSelector' | 'markAttendance' | 'reports' | 'reportDetails' | 'leaveReport' | 'summaryReport'>('grades');
  const [selectedReportDate, setSelectedReportDate] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('en-CA'));
  const [attendanceData, setAttendanceData] = useState<{ [key: number]: 'present' | 'absent' | 'late' | 'not-marked' }>({});
  const [attendanceDates, setAttendanceDates] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceStats, setAttendanceStats] = useState<{ [studentId: number]: { present: number, total: number, percentage: number } }>({});
  const [summaryStatsData, setSummaryStatsData] = useState<{ student: Student, present: number, absent: number, late: number, total: number, percentage: number }[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    fetchGrades();
    fetchStudents();
  }, []);


  const loadAttendanceDates = useCallback(async () => {
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
  }, [selectedGrade]);

  // Load attendance dates when a grade is selected for reports
  useEffect(() => {
    if (selectedGrade && activeView === 'reports') {
      loadAttendanceDates();
    }
  }, [selectedGrade, activeView, loadAttendanceDates]);

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
    setActiveView('dateSelector');
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
      const attendanceMap: { [key: number]: 'present' | 'absent' | 'late' } = {};
      attendanceData.attendance.forEach(record => {
        attendanceMap[record.student_id] = record.status;
      });

      setAttendanceData(attendanceMap);
    } catch {
      console.log('No existing attendance for today, starting fresh');
      setAttendanceData({});
    }
    setSearchTerm('');
  };

  const handleDateSelect = async () => {
    // Leave day check (Weekend or Public Holiday)
    if (checkIsLeaveDay(selectedDate)) {
      showToast("Selected date is a school holiday (weekend or public holiday). Attendance cannot be marked for this day.", "warning");
      return;
    }

    // Calculate historical attendance stats
    if (selectedGrade) {
      try {
        const allAtt = await attendanceMarkApi.getAllAttendance();
        const records = allAtt.attendance.filter(r => r.grade === selectedGrade.grade && r.section === selectedGrade.grade_part && new Date(r.marked_date) <= new Date(selectedDate));

        const uniqueDates = new Set(records.map(r => r.marked_date));
        const totalDays = uniqueDates.size;

        const statsMap: { [key: number]: { present: number, total: number, percentage: number } } = {};

        records.forEach(r => {
          if (!statsMap[r.student_id]) {
            statsMap[r.student_id] = { present: 0, total: 0, percentage: 0 };
          }
          if (r.status === 'present' || r.status === 'late') {
            statsMap[r.student_id].present += 1;
          }
        });

        // Initialize missing students and calculate percentages
        students.filter(s => selectedGrade.students?.some(gs => gs.id === s.id)).forEach(student => {
          if (!statsMap[student.id]) {
            statsMap[student.id] = { present: 0, total: totalDays, percentage: 0 };
          } else {
            statsMap[student.id].total = totalDays;
            statsMap[student.id].percentage = totalDays > 0 ? Math.round((statsMap[student.id].present / totalDays) * 100) : 0;
          }
        });

        setAttendanceStats(statsMap);
      } catch (err) {
        console.error('Error calculating historical stats', err);
      }
    }

    setActiveView('markAttendance');

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
        const attendanceMap: { [key: number]: 'present' | 'absent' | 'late' } = {};
        attendanceData.attendance.forEach(record => {
          attendanceMap[record.student_id] = record.status;
        });

        console.log('Found attendance data:', attendanceMap);
        setAttendanceData(attendanceMap);
      } catch {
        console.log('No existing data, starting fresh');
        setAttendanceData({});
      }
    }

    setActiveView('markAttendance');
  };

  const closeStudentsView = () => {
    setActiveView('grades');
    setSelectedGrade(null);
    setAttendanceData({});
    setSearchTerm('');
  };

  const closeDateSelection = () => {
    setActiveView('grades');
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
      showToast('No grade selected', 'error');
      return;
    }

    try {
      // Prepare attendance records for bulk marking (exclude not-marked entries)
      const attendanceRecords = Object.entries(attendanceData)
        .filter(([, status]) => status !== 'not-marked')
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

      showToast(`Attendance submitted successfully! Marked ${result.marked_students} students.`, 'success');
      closeStudentsView();
    } catch (error) {
      console.error('Error submitting attendance:', error);
      showToast('Failed to submit attendance. Please try again.', 'error');
    }
  };

  const handleViewReports = (grade: Grade) => {
    setSelectedGrade(grade);
    setActiveView('reports');
    setSelectedReportDate('');
    setSearchTerm('');
  };

  const closeReportsView = () => {
    setActiveView('grades');
    setSelectedGrade(null);
    setSelectedReportDate('');
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
      const attendanceMap: { [key: number]: 'present' | 'absent' | 'late' | 'not-marked' } = {};
      attendanceData.attendance.forEach(record => {
        attendanceMap[record.student_id] = record.status;
      });

      // Generate premium PDF content for this specific date
      let pdfContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Attendance Sheet - Grade ${selectedGrade.grade}-${selectedGrade.grade_part} - ${date}</title>
            <style>
              @page { margin: 0.5in; size: A4; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
              * { box-sizing: border-box; }
              body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 28px; background: #F8F7FF; color: #1e1b4b; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .header { background: linear-gradient(135deg, #633194 0%, #4B2380 100%) !important; border-radius: 20px; padding: 28px 32px; margin-bottom: 28px; display: flex; align-items: center; justify-content: space-between; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
              .header-left { display: flex; align-items: center; gap: 16px; }
              .header-logo { width: 56px; height: 56px; background: rgba(255,255,255,0.18) !important; border-radius: 14px; display: flex; align-items: center; justify-content: center; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .header h1 { color: white !important; font-size: 26px; margin: 0 0 4px; font-weight: 800; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .header-sub { color: rgba(255,255,255,0.8) !important; font-size: 14px; margin: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .header-right { text-align: right; }
              .header-chip { background: rgba(255,255,255,0.18) !important; color: white !important; border-radius: 10px; padding: 6px 14px; font-size: 13px; font-weight: 700; margin-bottom: 6px; display: inline-block; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .header-date { color: rgba(255,255,255,0.7) !important; font-size: 12px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 24px; }
              .stat-card { padding: 16px; border-radius: 14px; text-align: center; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
              .stat-card.present { background: #D1FAE5 !important; border: 2px solid #6EE7B7; }
              .stat-card.absent { background: #FEE2E2 !important; border: 2px solid #FCA5A5; }
              .stat-card.late { background: #FEF3C7 !important; border: 2px solid #FCD34D; }
              .stat-card.not-marked { background: #F1F5F9 !important; border: 2px solid #CBD5E1; }
              .stat-number { font-size: 32px; font-weight: 900; margin-bottom: 4px; }
              .stat-card.present .stat-number { color: #059669 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .stat-card.absent .stat-number { color: #DC2626 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .stat-card.late .stat-number { color: #D97706 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .stat-card.not-marked .stat-number { color: #475569 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .stat-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #475569 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .section-label { font-size: 13px; font-weight: 800; color: #633194 !important; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; padding-left: 4px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              table { width: 100%; border-collapse: collapse; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 12px rgba(99,49,148,0.08); background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              th { background: linear-gradient(135deg, #633194 0%, #4B2380 100%) !important; color: white !important; padding: 14px 12px; text-align: left; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
              td { padding: 13px 12px; font-size: 13px; border-bottom: 1px solid #EDE9FE; vertical-align: middle; color: #1E293B !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              tr:nth-child(even) td { background: #FAFAFA !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .student-id { font-weight: 700; color: #633194 !important; text-align: center; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .student-name { font-weight: 700; color: #1e1b4b !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .student-overall { font-size: 10px; color: #64748B !important; margin-top: 2px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .badge { font-weight: 800; border-radius: 7px; padding: 5px 12px; display: inline-block; font-size: 11px; text-align: center; text-transform: uppercase; letter-spacing: 0.04em; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
              .present { background: #D1FAE5 !important; color: #065F46 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .absent { background: #FEE2E2 !important; color: #991B1B !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .late { background: #FEF3C7 !important; color: #92400E !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .not-marked { background: #F1F5F9 !important; color: #475569 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .footer { margin-top: 32px; text-align: center; border-top: 1px solid #EDE9FE; padding-top: 16px; font-size: 11px; color: #94A3B8 !important; -webkit-print-color-adjust: exact !important; print-color-assist: exact !important; }
              .footer strong { color: #633194 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="header-left">
                <div class="header-logo">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                </div>
                <div>
                  <h1>EduTrack</h1>
                  <p class="header-sub">Attendance Sheet — Daily Report</p>
                </div>
              </div>
              <div class="header-right">
                <div class="header-chip">Grade ${selectedGrade.grade}-${selectedGrade.grade_part}</div>
                <div class="header-date">📅 ${date}</div>
              </div>
            </div>

            <div class="stats">
              <div class="stat-card present"><div class="stat-number">${students.filter(s => attendanceMap[s.id] === 'present').length}</div><div class="stat-label">Present</div></div>
              <div class="stat-card absent"><div class="stat-number">${students.filter(s => attendanceMap[s.id] === 'absent').length}</div><div class="stat-label">Absent</div></div>
              <div class="stat-card late"><div class="stat-number">${students.filter(s => attendanceMap[s.id] === 'late').length}</div><div class="stat-label">Late</div></div>
              <div class="stat-card not-marked"><div class="stat-number">${students.filter(s => !attendanceMap[s.id]).length}</div><div class="stat-label">Not Marked</div></div>
            </div>

            <div class="section-label">Attendance Record</div>
            <table>
              <thead>
                <tr>
                  <th style="width:10%; text-align:center;">#</th>
                  <th style="width:55%;">Student Name</th>
                  <th style="width:20%; text-align:center;">Status</th>
                  <th style="width:15%; text-align:center;">Attendance %</th>
                </tr>
              </thead>
              <tbody>
      `;

      // Calculate historical attendance stats for Single PDF
      let attendanceStats: any = null;
      try {
        const allAtt = await attendanceMarkApi.getAllAttendance();
        const records = allAtt.attendance.filter(r => r.grade === selectedGrade.grade && r.section === selectedGrade.grade_part && new Date(r.marked_date) <= new Date(date));
        const totalDays = new Set(records.map(r => r.marked_date)).size;
        attendanceStats = {};
        records.forEach(r => {
          if (!attendanceStats[r.student_id]) attendanceStats[r.student_id] = { present: 0, total: totalDays, percentage: 0 };
          if (r.status === 'present' || r.status === 'late') attendanceStats[r.student_id].present += 1;
        });
        students.forEach(s => {
          if (!attendanceStats[s.id]) attendanceStats[s.id] = { present: 0, total: totalDays, percentage: 0 };
          else attendanceStats[s.id].percentage = totalDays > 0 ? Math.round((attendanceStats[s.id].present / totalDays) * 100) : 0;
        });
      } catch (e) { console.error(e); }

      students.forEach(student => {
        const status = attendanceMap[student.id] || 'not-marked';
        const statusText = status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : status === 'late' ? 'Late' : 'Not Marked';
        const pct = attendanceStats && attendanceStats[student.id] ? attendanceStats[student.id].percentage : null;
        const pctColor = pct !== null ? (pct >= 75 ? '#059669' : pct >= 50 ? '#D97706' : '#DC2626') : '#94A3B8';
        pdfContent += `
              <tr>
                <td class="student-id">${student.id}</td>
                <td>
                  <div class="student-name">${student.first_name} ${student.last_name}</div>
                  ${pct !== null ? `<div class="student-overall">Overall: <b style="color: ${pctColor};">${pct}%</b></div>` : ''}
                </td>
                <td style="text-align:center;"><span class="badge ${status}">${statusText}</span></td>
                <td style="text-align:center; font-weight: 700; color: ${pctColor};">${pct !== null ? pct + '%' : '—'}</td>
              </tr>
        `;
      });

      pdfContent += `
            </tbody>
          </table>
          <div class="footer">
            <strong>EduTrack</strong> — Student Management System &nbsp;|&nbsp; Generated: ${new Date().toLocaleString()}
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
      showToast(`Failed to generate PDF for ${date}. Please try again.`, 'error');
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
        showToast('No attendance data found for this grade', 'warning');
        return;
      }

      // Get all students for this grade
      const students = getGradeStudents();

      // Fetch attendance data for each date using the same API as loadAttendanceForDate
      const allAttendanceData: { [key: string]: { [key: number]: 'present' | 'absent' | 'late' | 'not-marked' } } = {};
      for (const date of attendanceDates) {
        try {
          const attendanceData = await attendanceMarkApi.getByGradeSectionDate(
            selectedGrade.grade,
            selectedGrade.grade_part,
            date
          );

          // Convert the database format to the component's expected format
          const attendanceMap: { [key: number]: 'present' | 'absent' | 'late' | 'not-marked' } = {};
          attendanceData.attendance.forEach(record => {
            attendanceMap[record.student_id] = record.status;
          });
          allAttendanceData[date] = attendanceMap;
        } catch (error) {
          console.error(`Error fetching attendance for ${date}:`, error);
        }
      }

      // Generate premium Complete PDF content
      let pdfContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Complete Attendance Report - Grade ${selectedGrade.grade}-${selectedGrade.grade_part}</title>
            <style>
              @page { margin: 0.5in; size: A4; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
              * { box-sizing: border-box; }
              body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 28px; background: #F8F7FF; color: #1e1b4b; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .header { background: linear-gradient(135deg, #633194 0%, #4B2380 100%) !important; border-radius: 20px; padding: 24px 32px; margin-bottom: 28px; display: flex; align-items: center; justify-content: space-between; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
              .header-left { display: flex; align-items: center; gap: 16px; }
              .header-logo { width: 52px; height: 52px; background: rgba(255,255,255,0.18) !important; border-radius: 14px; display: flex; align-items: center; justify-content: center; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .header h1 { color: white !important; font-size: 24px; margin: 0 0 4px; font-weight: 800; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .header-sub { color: rgba(255,255,255,0.8) !important; font-size: 13px; margin: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .header-right { text-align: right; }
              .header-chip { background: rgba(255,255,255,0.18) !important; color: white !important; border-radius: 10px; padding: 5px 12px; font-size: 13px; font-weight: 700; display: inline-block; margin-bottom: 4px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .header-meta { color: rgba(255,255,255,0.7) !important; font-size: 11px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .section-label { font-size: 13px; font-weight: 800; color: #633194 !important; text-transform: uppercase; letter-spacing: 0.06em; margin: 24px 0 10px; padding-left: 4px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .date-section { margin-bottom: 28px; page-break-inside: avoid; }
              .date-header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%) !important; color: white !important; padding: 10px 16px; border-radius: 10px; margin-bottom: 12px; font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 8px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
              .stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 14px; }
              .stat-card { padding: 12px; border-radius: 12px; text-align: center; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
              .stat-card.present { background: #D1FAE5 !important; border: 2px solid #6EE7B7; color: #065F46 !important; }
              .stat-card.absent { background: #FEE2E2 !important; border: 2px solid #FCA5A5; color: #991B1B !important; }
              .stat-card.late { background: #FEF3C7 !important; border: 2px solid #FCD34D; color: #92400E !important; }
              .stat-card.not-marked { background: #F1F5F9 !important; border: 2px solid #CBD5E1; color: #475569 !important; }
              table { width: 100%; border-collapse: collapse; overflow: hidden; background: white; margin-bottom: 8px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              th { background: linear-gradient(135deg, #633194 0%, #4B2380 100%) !important; color: white !important; padding: 11px 10px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
              td { padding: 10px; font-size: 12px; border-bottom: 1px solid #EDE9FE; vertical-align: middle; color: #1E293B !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              tr:nth-child(even) td { background: #FAFAFA !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .badge { font-weight: 800; border-radius: 6px; padding: 3px 10px; display: inline-block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
              .present { background: #D1FAE5 !important; color: #065F46 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .absent { background: #FEE2E2 !important; color: #991B1B !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .late { background: #FEF3C7 !important; color: #92400E !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .not-marked { background: #F1F5F9 !important; color: #475569 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .footer { margin-top: 32px; text-align: center; border-top: 1px solid #EDE9FE; padding-top: 16px; font-size: 11px; color: #94A3B8 !important; }
              .footer strong { color: #633194 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="header-left">
                <div class="header-logo">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                </div>
                <div>
                  <h1>EduTrack</h1>
                  <p class="header-sub">Complete Attendance Report — All Days</p>
                </div>
              </div>
              <div class="header-right">
                <div class="header-chip">Grade ${selectedGrade.grade}-${selectedGrade.grade_part}</div>
                <div class="header-meta">${attendanceDates.length} days &nbsp;|&nbsp; ${new Date().toLocaleDateString()}</div>
              </div>
            </div>
      `;

      // Calculate overall student statistics
      const studentStats: { [key: number]: { present: number, total: number, absent: number, late: number, percentage: number } } = {};
      const totalDays = attendanceDates.length;
      students.forEach(student => {
        studentStats[student.id] = { present: 0, total: totalDays, absent: 0, late: 0, percentage: 0 };
      });

      attendanceDates.forEach(date => {
        const dayData = allAttendanceData[date];
        if (dayData) {
          students.forEach(student => {
            const status = dayData[student.id];
            if (status === 'present' || status === 'late') {
              studentStats[student.id].present += 1;
              if (status === 'late') studentStats[student.id].late += 1;
            } else if (status === 'absent') {
              studentStats[student.id].absent += 1;
            }
          });
        }
      });

      students.forEach(student => {
        const stat = studentStats[student.id];
        stat.percentage = stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 0;
      });

      // Add Student Summary Table to PDF
      pdfContent += `
            <div class="date-section">
              <div class="date-header" style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%) !important; display: flex; align-items: center; gap: 8px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                Student Overall Attendance Summary
              </div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 8%;">ID</th>
                    <th style="width: 35%;">Student Name</th>
                    <th style="width: 14%; text-align: center;">Total Days</th>
                    <th style="width: 14%; text-align: center;">Present (+Late)</th>
                    <th style="width: 14%; text-align: center;">Absent</th>
                    <th style="width: 15%; text-align: center;">Percentage</th>
                  </tr>
                </thead>
                <tbody>
      `;

      students.forEach(student => {
        const stat = studentStats[student.id];
        const pctColor = stat.percentage >= 75 ? '#059669' : stat.percentage >= 50 ? '#D97706' : '#DC2626';
        pdfContent += `
                  <tr>
                    <td style="text-align: center; font-weight: 700; color: #633194;">${student.id}</td>
                    <td><div style="font-weight: 700; color: #1e1b4b;">${student.first_name} ${student.last_name}</div></td>
                    <td style="text-align: center; font-weight: 600;">${stat.total}</td>
                    <td style="text-align: center; color: #059669; font-weight: 700;">${stat.present}</td>
                    <td style="text-align: center; color: #DC2626; font-weight: 700;">${stat.absent}</td>
                    <td style="text-align: center; font-weight: 800; color: ${pctColor};">${stat.percentage}%</td>
                  </tr>
        `;
      });

      pdfContent += `
                </tbody>
              </table>
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
              <div class="date-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                ${date}
              </div>
              <div class="stats-row">
                <div class="stat-card present"><div style="font-size:18px; font-weight:900;">${presentCount}</div><div style="font-size:10px; font-weight:800; text-transform:uppercase;">Present</div></div>
                <div class="stat-card absent"><div style="font-size:18px; font-weight:900;">${absentCount}</div><div style="font-size:10px; font-weight:800; text-transform:uppercase;">Absent</div></div>
                <div class="stat-card late"><div style="font-size:18px; font-weight:900;">${lateCount}</div><div style="font-size:10px; font-weight:800; text-transform:uppercase;">Late</div></div>
                <div class="stat-card not-marked"><div style="font-size:18px; font-weight:900;">${notMarkedCount}</div><div style="font-size:10px; font-weight:800; text-transform:uppercase;">Not Marked</div></div>
              </div>
              <table><thead><tr>
                <th style="width:8%; text-align:center;">#</th>
                <th style="width:55%;">Student Name</th>
                <th style="width:20%; text-align:center;">Status</th>
              </tr></thead><tbody>
        `;

        students.forEach(student => {
          const status = dayAttendance[student.id] || 'not-marked';
          const statusText = status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : status === 'late' ? 'Late' : 'Not Marked';
          pdfContent += `
                  <tr>
                    <td style="text-align: center; font-weight: 700; color: #633194;">${student.id}</td>
                    <td style="font-weight: 600; color: #1e1b4b;">${student.first_name} ${student.last_name}</td>
                    <td style="text-align: center;"><span class="badge ${status}">${statusText}</span></td>
                  </tr>
          `;
        });

        pdfContent += `</tbody></table></div>`;
      });

      pdfContent += `
            <div class="footer">
              <strong>EduTrack</strong> — Student Management System &nbsp;|&nbsp; Total Students: ${students.length} | Total Days: ${attendanceDates.length} | Generated: ${new Date().toLocaleString()}
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
      showToast('Failed to generate complete attendance report. Please try again.', 'error');
    }
  };

  const downloadSummaryAttendancePDF = async () => {
    if (!selectedGrade) return;

    try {
      const allAttendance = await attendanceMarkApi.getAllAttendance();
      const filteredRecords = allAttendance.attendance
        .filter(record => record.grade === selectedGrade.grade && record.section === selectedGrade.grade_part);

      const attendanceDates = filteredRecords
        .map(record => new Date(record.marked_date).toLocaleDateString('en-CA'))
        .filter((date, index, self) => self.indexOf(date) === index);

      if (attendanceDates.length === 0) {
        showToast('No attendance data found for this grade', 'warning');
        return;
      }

      const students = getGradeStudents();
      const studentStats: { [key: number]: { present: number, total: number, absent: number, percentage: number } } = {};
      const totalDays = attendanceDates.length;

      students.forEach(student => {
        studentStats[student.id] = { present: 0, total: totalDays, absent: 0, percentage: 0 };
      });

      filteredRecords.forEach(record => {
        const studentId = record.student_id;
        if (studentStats[studentId]) {
          if (record.status === 'present' || record.status === 'late') {
            studentStats[studentId].present += 1;
          } else if (record.status === 'absent') {
            studentStats[studentId].absent += 1;
          }
        }
      });

      students.forEach(student => {
        const stat = studentStats[student.id];
        stat.percentage = stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 0;
      });

      let pdfContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Summary Attendance Report - Grade ${selectedGrade.grade}-${selectedGrade.grade_part}</title>
            <style>
              @page { margin: 0.5in; size: A4; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
              * { box-sizing: border-box; }
              body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 28px; background: #F8F7FF; color: #1e1b4b; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .header { background: linear-gradient(135deg, #633194 0%, #4B2380 100%) !important; border-radius: 20px; padding: 24px 32px; margin-bottom: 28px; display: flex; align-items: center; justify-content: space-between; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
              .header-left { display: flex; align-items: center; gap: 16px; }
              .header-logo { width: 52px; height: 52px; background: rgba(255,255,255,0.18) !important; border-radius: 14px; display: flex; align-items: center; justify-content: center; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .header h1 { color: white !important; font-size: 24px; margin: 0 0 4px; font-weight: 800; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .header-sub { color: rgba(255,255,255,0.8) !important; font-size: 13px; margin: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .header-right { text-align: right; }
              .header-chip { background: rgba(255,255,255,0.18) !important; color: white !important; border-radius: 10px; padding: 5px 12px; font-size: 13px; font-weight: 700; display: inline-block; margin-bottom: 4px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .header-meta { color: rgba(255,255,255,0.7) !important; font-size: 11px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              table { width: 100%; border-collapse: collapse; background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              th { background: linear-gradient(135deg, #633194 0%, #4B2380 100%) !important; color: white !important; padding: 11px 10px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
              td { padding: 10px; font-size: 12px; border-bottom: 1px solid #EDE9FE; vertical-align: middle; color: #1E293B !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              tr:nth-child(even) td { background: #FAFAFA !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .footer { margin-top: 32px; text-align: center; border-top: 1px solid #EDE9FE; padding-top: 16px; font-size: 11px; color: #94A3B8 !important; }
              .footer strong { color: #633194 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="header-left">
                <div class="header-logo">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                </div>
                <div>
                  <h1>EduTrack</h1>
                  <p class="header-sub">Summary Attendance Report &mdash; Overall</p>
                </div>
              </div>
              <div class="header-right">
                <div class="header-chip">Grade ${selectedGrade.grade}-${selectedGrade.grade_part}</div>
                <div class="header-meta">${totalDays} days &nbsp;|&nbsp; ${new Date().toLocaleDateString()}</div>
              </div>
            </div>
            <table>
              <thead><tr>
                <th style="width:8%; text-align:center;">#</th>
                <th style="width:42%;">Student Name</th>
                <th style="width:12%; text-align:center;">Total Days</th>
                <th style="width:12%; text-align:center;">Present</th>
                <th style="width:12%; text-align:center;">Absent</th>
                <th style="width:14%; text-align:center;">Attendance %</th>
              </tr></thead>
              <tbody>
      `;

      students.forEach(student => {
        const stat = studentStats[student.id];
        const pctColor = stat.percentage >= 75 ? '#059669' : stat.percentage >= 50 ? '#D97706' : '#DC2626';
        pdfContent += `
                  <tr>
                    <td style="text-align: center; font-weight: 700; color: #633194;">${student.id}</td>
                    <td style="font-weight: 700; color: #1e1b4b;">${student.first_name} ${student.last_name}</td>
                    <td style="text-align: center; font-weight: 600;">${stat.total}</td>
                    <td style="text-align: center; color: #059669; font-weight: 700;">${stat.present}</td>
                    <td style="text-align: center; color: #DC2626; font-weight: 700;">${stat.absent}</td>
                    <td style="text-align: center; font-weight: 800; color: ${pctColor};">${stat.percentage}%</td>
                  </tr>
        `;
      });

      pdfContent += `
              </tbody>
            </table>
            <div class="footer">
              <strong>EduTrack</strong> &mdash; Student Management System &nbsp;|&nbsp; Total Students: ${students.length} | Total Days: ${totalDays} | Generated: ${new Date().toLocaleString()}
            </div>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('Error generating summary attendance report:', error);
      showToast('Failed to generate summary report. Please try again.', 'error');
    }
  };

  const handleViewSummaryReport = async () => {
    if (!selectedGrade) return;

    try {
      const allAttendance = await attendanceMarkApi.getAllAttendance();
      const filteredRecords = allAttendance.attendance
        .filter(record => record.grade === selectedGrade.grade && record.section === selectedGrade.grade_part);

      const attendanceDates = filteredRecords
        .map(record => new Date(record.marked_date).toLocaleDateString('en-CA'))
        .filter((date, index, self) => self.indexOf(date) === index);

      if (attendanceDates.length === 0) {
        showToast('No attendance data found for this grade', 'warning');
        return;
      }

      const students = getGradeStudents();
      const studentStats: { [key: number]: { present: number, total: number, absent: number, late: number, percentage: number } } = {};
      const totalDays = attendanceDates.length;

      students.forEach(student => {
        studentStats[student.id] = { present: 0, total: totalDays, absent: 0, late: 0, percentage: 0 };
      });

      filteredRecords.forEach(record => {
        const studentId = record.student_id;
        if (studentStats[studentId]) {
          if (record.status === 'present') studentStats[studentId].present += 1;
          else if (record.status === 'late') {
            studentStats[studentId].late += 1;
            studentStats[studentId].present += 1; // Count late as present for percentage
          }
          else if (record.status === 'absent') studentStats[studentId].absent += 1;
        }
      });

      const statsArray = students.map(student => {
        const stat = studentStats[student.id];
        stat.percentage = stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 0;
        return { student, ...stat };
      });

      setSummaryStatsData(statsArray);
      setActiveView('summaryReport');
    } catch (e) {
      console.error(e);
      showToast('Failed to load summary', 'error');
    }
  };

  // DateStudentsView component to show attendance details for a specific date

  const DateStudentsView: React.FC<{
    grade: Grade;
    date: string;
    students: Student[];
  }> = ({ grade, date, students }) => {
    const [dateAttendanceData, setDateAttendanceData] = useState<{ [key: number]: 'present' | 'absent' | 'late' | 'not-marked' }>({});
    const [dateStats, setDateStats] = useState<{ [studentId: number]: { present: number, total: number, percentage: number } }>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadDateAttendance = async () => {
        try {
          const [attendanceData, allAtt] = await Promise.all([
            attendanceMarkApi.getByGradeSectionDate(grade.grade, grade.grade_part, date),
            attendanceMarkApi.getAllAttendance()
          ]);

          const attendanceMap: { [key: number]: 'present' | 'absent' | 'late' | 'not-marked' } = {};
          attendanceData.attendance.forEach(record => {
            attendanceMap[record.student_id] = record.status;
          });
          setDateAttendanceData(attendanceMap);

          const records = allAtt.attendance.filter(r => r.grade === grade.grade && r.section === grade.grade_part && new Date(r.marked_date) <= new Date(date));
          const totalDays = new Set(records.map(r => r.marked_date)).size;
          const statsMap: { [key: number]: { present: number, total: number, percentage: number } } = {};

          records.forEach(r => {
            if (!statsMap[r.student_id]) statsMap[r.student_id] = { present: 0, total: 0, percentage: 0 };
            if (r.status === 'present' || r.status === 'late') statsMap[r.student_id].present += 1;
          });

          students.forEach(student => {
            if (!statsMap[student.id]) {
              statsMap[student.id] = { present: 0, total: totalDays, percentage: 0 };
            } else {
              statsMap[student.id].total = totalDays;
              statsMap[student.id].percentage = totalDays > 0 ? Math.round((statsMap[student.id].present / totalDays) * 100) : 0;
            }
          });
          setDateStats(statsMap);

        } catch (error) {
          console.error('Error loading attendance data:', error);
          setDateAttendanceData({});
        } finally {
          setLoading(false);
        }
      };

      loadDateAttendance();
    }, [grade, date]);

    if (loading) {
      return (
        <div className="am-empty-state">
          <Loader2 className="animate-spin" size={32} style={{ color: '#8B5CF6', marginBottom: '16px', animation: 'spin 1s linear infinite' }} />
          <div>Loading attendance data...</div>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      );
    }

    const presentStudents = students.filter(s => dateAttendanceData[s.id] === 'present');
    const absentStudents = students.filter(s => dateAttendanceData[s.id] === 'absent');
    const lateStudents = students.filter(s => dateAttendanceData[s.id] === 'late');
    const unmarkedStudents = students.filter(s => !dateAttendanceData[s.id] || dateAttendanceData[s.id] === 'not-marked');

    const renderStudentsList = (group: typeof students, title: string) => {
      const titleColor = title === 'Present' ? '#10B981' : title === 'Absent' ? '#EF4444' : title === 'Late' ? '#F59E0B' : '#64748B';
      const bgHighlight = title === 'Present' ? '#ECFDF5' : title === 'Absent' ? '#FEF2F2' : title === 'Late' ? '#FFFBEB' : '#F8FAFC';
      
      return (
      <div style={{ marginBottom: '20px', background: '#FFFFFF', padding: '16px', borderRadius: '16px', border: '1px solid #EDE9FE', boxShadow: '0 4px 12px rgba(99,49,148,0.03)' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '16px', color: titleColor, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: titleColor, boxShadow: `0 0 8px ${titleColor}80` }}></div>
          {title} ({group.length})
        </h3>
        {group.length === 0 ? (
          <div style={{ padding: '16px', borderRadius: '12px', background: '#F8FAFC', color: '#94A3B8', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', border: '1px dashed #E2E8F0' }}>
            No students in this category
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {group.map(student => (
              <div key={student.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)'; }}>
                <div style={{ minWidth: '36px', width: '36px', height: '36px', borderRadius: '10px', background: bgHighlight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: titleColor, fontWeight: 900, fontSize: '15px' }}>
                  {student.first_name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '14px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.first_name} {student.last_name}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>ID: {student.id}</span>
                    {dateStats[student.id] && (
                      <>
                        <span style={{ color: '#CBD5E1' }}>|</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: dateStats[student.id].percentage >= 75 ? '#10B981' : dateStats[student.id].percentage >= 50 ? '#F59E0B' : '#EF4444', fontWeight: 700 }}>
                          <Activity size={10} /> {dateStats[student.id].percentage}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ 
                    padding: '4px 10px', 
                    background: bgHighlight, 
                    color: titleColor, 
                    borderRadius: '8px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    border: `1px solid ${titleColor}30`
                  }}>
                  {title === 'Present' ? <CheckCircle size={12} /> : title === 'Absent' ? <XCircle size={12} /> : title === 'Late' ? <Clock size={12} /> : <AlertTriangle size={12} />}
                  {title}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )};

    return (
      <div className="am-reports-grouped">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Present', count: presentStudents.length, color: '#10B981', bg: '#DCFCE7' },
            { label: 'Absent', count: absentStudents.length, color: '#EF4444', bg: '#FEE2E2' },
            { label: 'Late', count: lateStudents.length, color: '#F59E0B', bg: '#FEF3C7' },
            { label: 'Not Marked', count: unmarkedStudents.length, color: '#64748B', bg: '#F1F5F9' }
          ].map((stat, i) => (
            <div key={i} style={{ background: '#FFFFFF', padding: '12px 16px', borderRadius: '12px', border: '1px solid #EDE9FE', boxShadow: '0 2px 6px rgba(99,49,148,0.03)', display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, fontWeight: 900, fontSize: '16px' }}>
                 {stat.count}
               </div>
               <div>
                 <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
               </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {renderStudentsList(presentStudents, 'Present')}
          {renderStudentsList(absentStudents, 'Absent')}
          {renderStudentsList(lateStudents, 'Late')}
          {renderStudentsList(unmarkedStudents, 'Not Marked')}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="am-loader-container">
        <div className="am-loader">
          <Loader2 className="animate-spin" size={32} style={{ color: '#8B5CF6', marginBottom: '16px', animation: 'spin 1s linear infinite' }} />
          <h2 style={{ fontWeight: 600 }}>Loading Attendance System...</h2>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'dateSelector':
        return (
          <div className="am-grid-container" style={{ padding: '24px', maxWidth: '400px', margin: '40px auto' }}>
            <h2 className="am-modal-title" style={{ fontSize: '20px', marginBottom: '8px' }}>Select Date</h2>
            <p className="am-modal-subtitle" style={{ marginBottom: '20px' }}>
              Grade: {selectedGrade?.grade}-{selectedGrade?.grade_part}
            </p>
            <input
              type="date"
              className="am-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ marginBottom: '24px' }}
            />
            <div className="am-btn-group" style={{ justifyContent: 'flex-end', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
              {checkIsLeaveDay(selectedDate) && (
                <div style={{
                  color: '#dc2626',
                  fontSize: '13px',
                  fontWeight: '500',
                  background: '#fef2f2',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #fee2e2',
                  width: '100%',
                  textAlign: 'center'
                }}>
                  <AlertTriangle size={16} /> School is closed (Weekend / Public Holiday)
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="am-btn-secondary" onClick={closeDateSelection}>
                  <X size={14} style={{ marginRight: '4px' }} /> Cancel
                </button>
                <button
                  className="am-btn-primary"
                  onClick={handleDateSelect}
                  disabled={checkIsLeaveDay(selectedDate)}
                  style={{ opacity: checkIsLeaveDay(selectedDate) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  Continue <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        );

      case 'markAttendance':
        return (
          <div style={{ padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column', background: '#F8F7FF', borderRadius: '24px', animation: 'fadeSlideIn 0.3s ease-out' }}>
            <style>{`
              @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
              .student-att-card { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid #EDE9FE; }
              .student-att-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,49,148,0.08); border-color: #DDD6FE; }
              .att-btn { transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
              .att-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
              .att-btn-active-present { background: linear-gradient(135deg, #10B981, #059669) !important; color: white !important; border-color: #059669 !important; box-shadow: 0 4px 12px rgba(16,185,129,0.3) !important; }
              .att-btn-active-absent { background: linear-gradient(135deg, #EF4444, #DC2626) !important; color: white !important; border-color: #DC2626 !important; box-shadow: 0 4px 12px rgba(239,68,68,0.3) !important; }
              .att-btn-active-late { background: linear-gradient(135deg, #F59E0B, #D97706) !important; color: white !important; border-color: #D97706 !important; box-shadow: 0 4px 12px rgba(245,158,11,0.3) !important; }
              .att-btn-active-not-marked { background: linear-gradient(135deg, #64748B, #475569) !important; color: white !important; border-color: #475569 !important; box-shadow: 0 4px 12px rgba(100,116,139,0.3) !important; }
              
              .search-wrapper-att input:focus { border-color: #633194 !important; box-shadow: 0 0 0 4px rgba(99,49,148,0.1) !important; }
            `}</style>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(99,49,148,0.04)', border: '1px solid #EDE9FE' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #633194, #4B2380)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
                  <Calendar size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1e1b4b', margin: '0 0 4px' }}>Mark Attendance</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#633194', background: '#F4F0FF', padding: '4px 10px', borderRadius: '8px' }}>
                      Grade {selectedGrade?.grade}-{selectedGrade?.grade_part}
                    </span>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>•</span>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> {selectedDate}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={closeStudentsView} 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', borderRadius: '12px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#0F172A'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#475569'; }}
              >
                <ArrowLeft size={16} /> Back to Grades
              </button>
            </div>

            {/* Counters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
              {[
                { label: 'Present', count: Object.values(attendanceData).filter(s => s === 'present').length, color: '#10B981', bg: '#DCFCE7' },
                { label: 'Absent', count: Object.values(attendanceData).filter(s => s === 'absent').length, color: '#EF4444', bg: '#FEE2E2' },
                { label: 'Late', count: Object.values(attendanceData).filter(s => s === 'late').length, color: '#F59E0B', bg: '#FEF3C7' },
                { label: 'Unmarked', count: getGradeStudents().length - Object.keys(attendanceData).filter(k => attendanceData[Number(k)] !== 'not-marked').length, color: '#64748B', bg: '#F1F5F9' }
              ].map((stat, i) => (
                <div key={i} style={{ background: '#FFFFFF', padding: '12px 16px', borderRadius: '12px', border: '1px solid #EDE9FE', boxShadow: '0 2px 6px rgba(99,49,148,0.03)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                   <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, fontWeight: 900, fontSize: '16px' }}>
                     {stat.count}
                   </div>
                   <div>
                     <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                   </div>
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="search-wrapper-att" style={{ position: 'relative', marginBottom: '20px' }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9D85C5' }} />
              <input
                type="text"
                placeholder="Search students to mark..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '14px', border: '2px solid #EDE9FE', outline: 'none', fontSize: '14px', background: '#FFFFFF', transition: 'all 0.2s', boxSizing: 'border-box' }}
              />
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
              {getGradeStudents()
                .filter(student => (student.first_name + ' ' + student.last_name).toLowerCase().includes(searchTerm.toLowerCase()) || student.id.toString().includes(searchTerm))
                .map((student, idx) => (
                  <div key={student.id} className="student-att-card" style={{ background: '#FFFFFF', borderRadius: '14px', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'fadeSlideIn 0.3s ease-out', animationDelay: (idx * 0.04) + 's', animationFillMode: 'both' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F4F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#633194', fontWeight: 800, fontSize: '15px' }}>
                        {student.first_name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#1e1b4b', fontSize: '14px', marginBottom: '2px' }}>{student.first_name} {student.last_name}</div>
                        {attendanceStats[student.id] && (
                          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                             <Activity size={12} color="#9D85C5" /> 
                             Overall: <span style={{ color: attendanceStats[student.id].percentage >= 75 ? '#10B981' : attendanceStats[student.id].percentage >= 50 ? '#F59E0B' : '#EF4444' }}>{attendanceStats[student.id].percentage}%</span>
                             <span style={{ color: '#CBD5E1' }}>|</span>
                             {attendanceStats[student.id].present}/{attendanceStats[student.id].total} Days
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', background: '#F8FAFC', padding: '4px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      {(['present', 'absent', 'late', 'not-marked'] as const).map(status => {
                        const isActive = attendanceData[student.id] === status || (!attendanceData[student.id] && status === 'not-marked');
                        const activeClass = isActive ? 'att-btn-active-' + status : '';
                        
                        let label = '', icon = null;
                        if (status === 'present') { label = 'Present'; icon = <CheckCircle size={14} />; }
                        else if (status === 'absent') { label = 'Absent'; icon = <XCircle size={14} />; }
                        else if (status === 'late') { label = 'Late'; icon = <Clock size={14} />; }
                        else { label = 'Reset'; icon = <ArrowLeft size={14} style={{ transform: 'rotate(45deg)' }} />; }

                        return (
                          <button
                            key={status}
                            className={'att-btn ' + activeClass}
                            onClick={() => toggleAttendance(student.id, status)}
                            style={{ 
                              padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px',
                              background: isActive ? 'transparent' : '#FFFFFF', 
                              color: isActive ? 'white' : '#64748B',
                              border: '1px solid ' + (isActive ? 'transparent' : '#E2E8F0'),
                              borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            {icon} {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {getGradeStudents().length === 0 && (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B', background: '#FFFFFF', borderRadius: '16px', border: '1px dashed #CBD5E1' }}>
                    <Users size={48} color="#CBD5E1" style={{ marginBottom: '16px' }} />
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>No students in this class</div>
                    <div style={{ fontSize: '14px' }}>Assign students to this class in the Grade Management section.</div>
                  </div>
                )}
            </div>

            {/* Footer fixed action */}
            <div style={{ marginTop: '20px', background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', boxShadow: '0 -4px 20px rgba(99,49,148,0.06)', border: '1px solid #EDE9FE', display: 'flex', justifyContent: 'flex-end' }}>
               <button 
                 onClick={handleSubmitAttendance}
                 style={{ 
                   padding: '12px 24px', 
                   background: 'linear-gradient(135deg, #633194, #4C1D95)', 
                   color: '#FFFFFF', 
                   border: 'none', 
                   borderRadius: '10px', 
                   fontSize: '14px', 
                   fontWeight: 800, 
                   cursor: 'pointer', 
                   display: 'flex', 
                   alignItems: 'center', 
                   gap: '10px',
                   boxShadow: '0 4px 14px rgba(99,49,148,0.3)',
                   transition: 'all 0.2s'
                 }}
                 onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,49,148,0.4)'; }}
                 onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,49,148,0.3)'; }}
               >
                 <CheckCircle size={18} /> Submit Attendance
               </button>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="am-grid-container" style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="am-modal-header" style={{ marginBottom: '16px' }}>
              <div>
                <h2 className="am-modal-title">Attendance Reports</h2>
                <p className="am-modal-subtitle">Grade: {selectedGrade?.grade}-{selectedGrade?.grade_part}</p>
              </div>
              <button className="am-btn-secondary" onClick={closeReportsView} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={14} /> Back to Reports
              </button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
                Available Dates ({attendanceDates.filter(date => date.includes(searchTerm)).length})
              </h3>

              {/* Search Bar for Dates in Reports */}
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Filter by date (YYYY-MM-DD)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 32px',
                    borderRadius: '8px',
                    border: '1.5px solid #E2E8F0',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#8B5CF6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
                />
              </div>
              {attendanceDates.length === 0 ? (
                <div className="am-empty-state">
                  <div className="am-empty-icon"><Calendar size={32} style={{ color: '#8B5CF6', marginBottom: '16px' }} /></div>
                  <div>No attendance records found</div>
                </div>
              ) : (
                <div className="am-list" style={{ flex: 1, maxHeight: 'none', gridTemplateColumns: '1fr' }}>
                  {attendanceDates
                    .filter(date => date.includes(searchTerm))
                    .map(date => (
                      <div key={date} className="am-list-item">
                        <div className="am-student-name" style={{ marginBottom: 0, display: 'flex', alignItems: 'center' }}>
                          {date}
                          {checkIsLeaveDay(date) && (
                            <span style={{
                              marginLeft: '10px',
                              fontSize: '9px',
                              background: '#eff6ff',
                              color: '#3b82f6',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              border: '1px solid #dbeafe',
                              fontWeight: 700,
                              textTransform: 'uppercase'
                            }}>
                              Holiday
                            </span>
                          )}
                        </div>
                        <div className="am-btn-group">
                            <button
                              className="am-btn-blue"
                              onClick={() => {
                                setSelectedReportDate(date);
                                setActiveView('reportDetails');
                              }}
                              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <FileText size={12} /> Details
                            </button>
                            <button
                              className="am-btn-success"
                              onClick={() => downloadSingleDatePDF(date)}
                              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Download size={12} /> PDF
                            </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="am-modal-footer" style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="am-btn-secondary" onClick={handleViewSummaryReport} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={14} /> View Summary
              </button>
              <button className="am-btn-primary" onClick={downloadCompleteAttendancePDF} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={16} /> Download Complete Report
              </button>
            </div>
          </div>
        );

      case 'reportDetails':
        return (
          <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', background: '#F8F7FF', borderRadius: '24px', animation: 'fadeSlideIn 0.3s ease-out' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(99,49,148,0.04)', border: '1px solid #EDE9FE' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #633194, #4B2380)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
                  <FileText size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1e1b4b', margin: '0 0 4px' }}>Attendance Details</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#633194', background: '#F4F0FF', padding: '4px 10px', borderRadius: '8px' }}>
                      Grade {selectedGrade?.grade}-{selectedGrade?.grade_part}
                    </span>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>•</span>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} /> {selectedReportDate}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setActiveView('reports')} 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', borderRadius: '12px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#0F172A'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#475569'; }}
              >
                <ArrowLeft size={16} /> Back to Reports
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {selectedGrade && selectedReportDate && (
                <DateStudentsView
                  grade={selectedGrade}
                  date={selectedReportDate}
                  students={getGradeStudents()}
                />
              )}
            </div>
          </div>
        );

      case 'summaryReport':
        return (
          <div className="am-grid-container" style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="am-modal-header" style={{ marginBottom: '16px' }}>
              <div>
                <h2 className="am-modal-title">Overall Summary Report</h2>
                <p className="am-modal-subtitle">Grade: {selectedGrade?.grade}-{selectedGrade?.grade_part}</p>
              </div>
              <button className="am-btn-secondary" onClick={() => setActiveView('reports')}>Back to Reports</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div className="am-list" style={{ gridTemplateColumns: '1fr' }}>
                {summaryStatsData.map(stat => (
                  <div key={stat.student.id} className="am-list-item">
                    <div className="am-student-info" style={{ flex: 2 }}>
                      <div className="am-student-name">{stat.student.first_name} {stat.student.last_name}</div>
                      <div className="am-student-meta">
                        ID: {stat.student.id}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', flex: 3, justifySelf: 'flex-end', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Total</div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{stat.total}</div>
                      </div>
                      <div style={{ textAlign: 'center', background: '#ecfdf5', padding: '4px 12px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '10px', color: '#10B981', textTransform: 'uppercase', fontWeight: 700 }}>Present</div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#10B981' }}>{stat.present}</div>
                      </div>
                      <div style={{ textAlign: 'center', background: '#fef2f2', padding: '4px 12px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '10px', color: '#EF4444', textTransform: 'uppercase', fontWeight: 700 }}>Absent</div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#EF4444' }}>{stat.absent}</div>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: '60px' }}>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: 800,
                          color: stat.percentage >= 75 ? '#10B981' : stat.percentage >= 50 ? '#F59E0B' : '#EF4444'
                        }}>
                          {stat.percentage}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="am-modal-footer" style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <button className="am-btn-success" onClick={downloadSummaryAttendancePDF} style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', padding: '10px 20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={18} /> Download as PDF
              </button>
            </div>
          </div>
        );

      case 'leaveReport': {
        const currentMonth = new Date(selectedDate).getMonth();
        const currentYear = new Date(selectedDate).getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const leaveDays = [];
        for (let d = 1; d <= daysInMonth; d++) {
          const leaveDate = new Date(currentYear, currentMonth, d);
          const dateStr = leaveDate.toLocaleDateString('en-CA');
          if (checkIsLeaveDay(dateStr)) {
            const day = leaveDate.getDay();
            const isWeekend = day === 0 || day === 6;
            leaveDays.push({
              date: dateStr,
              type: isWeekend ? (day === 0 ? 'Sunday' : 'Saturday') : 'Public Holiday',
              dayName: leaveDate.toLocaleDateString('en-US', { weekday: 'long' })
            });
          }
        }

        return (
          <div className="am-grid-container" style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="am-modal-header" style={{ marginBottom: '16px' }}>
              <div>
                <h2 className="am-modal-title">Monthly School Leave Report</h2>
                <p className="am-modal-subtitle">
                  {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button className="am-btn-secondary" onClick={() => setActiveView('grades')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <X size={14} /> Close
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Select Month</p>
              <input
                type="month" // Changed to type="month" for better month selection
                className="am-input"
                value={selectedDate.substring(0, 7)} // Format for month input
                onChange={(e) => setSelectedDate(`${e.target.value}-01`)} // Set to first day of selected month
              />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{
                background: 'var(--brand-primary-light)',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid var(--brand-primary-light)'
              }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand-primary)' }}>Total School Leave Days</span>
                <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--brand-primary)' }}>{leaveDays.length}</span>
              </div>

              <div className="am-list" style={{ flex: 1, maxHeight: 'none', gridTemplateColumns: '1fr' }}>
                {leaveDays.map((ld, i) => (
                  <div key={i} className="am-list-item" style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{ld.date}</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{ld.dayName}</span>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: '12px',
                      background: ld.type.includes('Holiday') ? '#fef2f2' : '#f8fafc',
                      color: ld.type.includes('Holiday') ? '#dc2626' : '#64748b',
                      border: `1px solid ${ld.type.includes('Holiday') ? '#fee2e2' : '#e2e8f0'}`
                    }}>
                      {ld.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="am-grid-container" style={{ padding: '16px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="am-grid-title" style={{ fontSize: '16px', margin: 0, textAlign: 'left' }}>
                📚 Available Grades ({grades.length})
              </h2>
              <button
                className="am-btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', padding: '6px 12px', fontSize: '12px' }}
                onClick={() => setActiveView('leaveReport')}
              >
                <Calendar size={14} /> School Leave Report
              </button>
            </div>

            {grades.length === 0 ? (
              <div className="am-empty-state">
                <div className="am-empty-icon"><BookOpen size={48} color="#633194" /></div>
                <div style={{ fontWeight: 600, fontSize: '18px', color: 'var(--text-primary)', marginBottom: '4px' }}>No grades available</div>
                <div>Please create grades in Grade Management first</div>
              </div>
            ) : (
              <>
                {/* Premium Search Bar for Grades */}
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94A3B8'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search grades..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      borderRadius: '10px',
                      border: '1.5px solid #E2E8F0',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#8B5CF6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
                  />
                </div>

                <div className="am-grades-grid">
                  {grades
                    .filter(grade =>
                      `Grade ${grade.grade}-${grade.grade_part}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      grade.grade.toString().includes(searchTerm) ||
                      grade.grade_part.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(grade => (
                      <div key={grade.id} className="am-grade-card">
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <div className="am-grade-badge">{grade.grade}</div>
                          <div className="am-grade-info" style={{ marginLeft: '12px' }}>
                            <div className="am-grade-name">Grade {grade.grade}-{grade.grade_part}</div>
                            <div className="am-grade-meta" style={{ gap: '8px' }}>
                              <span title="Total Students" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> {grade.students?.length || 0}</span>
                              <span title="Updated Date" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {new Date(grade.updated_at || grade.created_at || '').toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="am-btn-group">
                          <button className="am-btn-primary" onClick={() => handleTakeAttendance(grade)}>Take</button>
                          <button className="am-btn-secondary" onClick={() => handleViewReports(grade)}>Reports</button>
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        );
    }
  };

  return (
    <div className="am-container" style={{ height: '100%' }}>
      <div className="am-card" style={{ height: '100%', borderRadius: 0, border: 'none', boxShadow: 'none' }}>
        <div className="am-header" style={{ marginBottom: '12px', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={28} color="#633194" />
            <h1 className="am-title" style={{ fontSize: '20px' }}>Attendance Management</h1>
          </div>
          <p className="am-subtitle" style={{ fontSize: '12px', marginTop: '4px' }}>
            Track and manage student daily attendance records.
          </p>
        </div>
        {renderView()}
      </div>
    </div>
  );
};

export default AttendanceManagement;
