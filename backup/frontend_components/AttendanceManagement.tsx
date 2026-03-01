import React, { useState, useEffect } from 'react';

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  grade_id: number;
  grade_name: string;
}

interface Grade {
  id: number;
  grade: number;
  grade_part: string;
  students: Student[];
}

interface GradeAttendance {
  grade_id: number;
  grade_name: string;
  students: Student[];
  attendance: { [student_id: number]: number };
  date: string;
}

const AttendanceManagement: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [gradesData, setGradesData] = useState<Grade[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [attendanceData, setAttendanceData] = useState<{ [gradeId: number]: GradeAttendance }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  useEffect(() => {
    fetchGrades();
  }, []);

  // Generate all days in the current month (including weekends for display)
  const getAllDaysInMonth = (date: string) => {
    const [year, month] = date.split('-');
    const lastDay = new Date(parseInt(year), parseInt(month), 0);
    const days = [];
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateStr = `${year}-${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      days.push(dateStr);
    }
    
    return days;
  };

  // Check if a date is a weekend
  const isWeekend = (date: string) => {
    const dayOfWeek = new Date(date).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  };

  // Get student attendance for a specific date
  const getStudentAttendanceForDate = (studentId: number, date: string) => {
    if (!selectedGrade || !attendanceData[selectedGrade.id]) return null;
    
    // Check localStorage for the specific date's attendance
    const attendanceKey = `attendance_${selectedGrade.id}_${date}`;
    const savedAttendance = JSON.parse(localStorage.getItem(attendanceKey) || '{}');
    
    // If we have saved data for this specific date, use it
    if (Object.keys(savedAttendance).length > 0) {
      return savedAttendance[studentId] || null;
    }
    
    // Only use current session data if we're looking at the currently selected date
    if (date === selectedDate) {
      return attendanceData[selectedGrade.id].attendance[studentId] || null;
    }
    
    return null;
  };

  // Get attendance status color and symbol
  const getAttendanceDisplay = (status: number | null, isWeekendDay: boolean = false) => {
    if (isWeekendDay) {
      return { color: '#6b7280', symbol: '🏖', bg: 'rgba(107, 114, 128, 0.1)', text: 'Holiday' };
    }
    if (status === 1) return { color: '#10b981', symbol: '✓', bg: 'rgba(16, 185, 129, 0.2)', text: 'Present' };
    if (status === 0) return { color: '#dc2626', symbol: '✗', bg: 'rgba(220, 38, 38, 0.3)', text: 'Absent' };
    return { color: '#6b7280', symbol: '-', bg: 'rgba(107, 114, 128, 0.2)', text: 'Unmarked' };
  };

  // Generate PDF for daily attendance
  const generateDailyPDF = (grade: Grade) => {
    const attendanceKey = `attendance_${grade.id}_${selectedDate}`;
    const savedAttendance = JSON.parse(localStorage.getItem(attendanceKey) || '{}');
    
    // Create PDF content
    const pdfContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Attendance Report - Grade ${grade.grade}${grade.grade_part || ''}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; color: #4f46e5; margin-bottom: 10px; }
        .date-info { font-size: 16px; color: #666; }
        .stats { display: flex; justify-content: space-around; margin-bottom: 30px; background: #f8f9fa; padding: 15px; border-radius: 8px; }
        .stat-item { text-align: center; }
        .stat-number { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .stat-label { font-size: 14px; color: #666; }
        .present { color: #10b981; }
        .absent { color: #ef4444; }
        .unmarked { color: #6b7280; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #4f46e5; color: white; font-weight: bold; }
        .present-row { background-color: #d4edda; }
        .absent-row { background-color: #f8d7da; }
        .unmarked-row { background-color: #f8f9fa; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">📅 Daily Attendance Report</div>
        <div class="date-info">Grade: ${grade.grade}${grade.grade_part || ''} | Date: ${selectedDate}</div>
    </div>

    <div class="stats">
        <div class="stat-item">
            <div class="stat-number">${grade.students?.length || 0}</div>
            <div class="stat-label">Total Students</div>
        </div>
        <div class="stat-item">
            <div class="stat-number present">${Object.values(savedAttendance).filter(status => status === 1).length}</div>
            <div class="stat-label">Present</div>
        </div>
        <div class="stat-item">
            <div class="stat-number absent">${Object.values(savedAttendance).filter(status => status === 0).length}</div>
            <div class="stat-label">Absent</div>
        </div>
        <div class="stat-item">
            <div class="stat-number unmarked">${grade.students?.length - Object.keys(savedAttendance).length}</div>
            <div class="stat-label">Unmarked</div>
        </div>
        <div class="stat-item">
            <div class="stat-number">${Object.keys(savedAttendance).length > 0 ? Math.round((Object.values(savedAttendance).filter(status => status === 1).length / Object.keys(savedAttendance).length) * 100) : 0}%</div>
            <div class="stat-label">Attendance Rate</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Student Name</th>
                <th>Student ID</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${grade.students?.map((student, index) => {
                const status = savedAttendance[student.id];
                const statusText = status === 1 ? 'Present' : status === 0 ? 'Absent' : 'Unmarked';
                const statusClass = status === 1 ? 'present-row' : status === 0 ? 'absent-row' : 'unmarked-row';
                const statusSymbol = status === 1 ? '✓' : status === 0 ? '✗' : '-';
                
                return `
                    <tr class="${statusClass}">
                        <td>${index + 1}</td>
                        <td>${student.first_name} ${student.last_name}</td>
                        <td>#${student.id}</td>
                        <td><strong>${statusSymbol}</strong> ${statusText}</td>
                    </tr>
                `;
            }).join('') || '<tr><td colspan="4" style="text-align: center;">No students found in this grade</td></tr>'}
        </tbody>
    </table>

    <div class="footer">
        <p>Generated on ${new Date().toLocaleString()} | EduTrack Attendance Management System</p>
    </div>
</body>
</html>
    `;

    // Create and download PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(pdfContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  };

  // Generate PDF for individual student monthly attendance
  const generateStudentMonthlyPDF = (student: any, grade: Grade) => {
    const allDaysInMonth = getAllDaysInMonth(selectedDate);
    const attendanceData = allDaysInMonth.map(date => {
      const attendance = getStudentAttendanceForDate(student.id, date);
      const isWeekendDay = isWeekend(date);
      return {
        date: date,
        status: attendance,
        display: getAttendanceDisplay(attendance, isWeekendDay),
        isWeekend: isWeekendDay
      };
    });
    
    const weekdaysData = attendanceData.filter(d => !d.isWeekend);
    const presentCount = weekdaysData.filter(d => d.status === 1).length;
    const absentCount = weekdaysData.filter(d => d.status === 0).length;
    const unmarkedCount = weekdaysData.filter(d => d.status === null).length;
    const attendanceRate = (presentCount + absentCount) > 0 ? Math.round((presentCount / (presentCount + absentCount)) * 100) : 0;
    
    const pdfContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Monthly Attendance Report - ${student.first_name} ${student.last_name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; color: #4f46e5; margin-bottom: 10px; }
        .student-info { font-size: 16px; color: #666; margin-bottom: 5px; }
        .stats { display: flex; justify-content: space-around; margin-bottom: 30px; background: #f8f9fa; padding: 15px; border-radius: 8px; }
        .stat-item { text-align: center; }
        .stat-number { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .stat-label { font-size: 14px; color: #666; }
        .present { color: #10b981; }
        .absent { color: #ef4444; }
        .unmarked { color: #6b7280; }
        .weekend { color: #ef4444; }
        .calendar { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin-bottom: 30px; }
        .day-header { text-align: center; font-weight: bold; color: #4f46e5; padding: 10px; background: #f8f9fa; border-radius: 4px; }
        .day-cell { text-align: center; padding: 8px; border-radius: 4px; border: 1px solid #ddd; min-height: 60px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
        .day-number { font-size: 12px; font-weight: bold; margin-bottom: 4px; }
        .attendance-symbol { font-size: 16px; font-weight: bold; }
        .present-bg { background-color: #d4edda; border-color: #10b981; }
        .absent-bg { background-color: #f8d7da; border-color: #ef4444; }
        .unmarked-bg { background-color: #f8f9fa; border-color: #6b7280; }
        .weekend-bg { background-color: #fee2e2; border-color: #ef4444; opacity: 0.7; }
        .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .summary-table th, .summary-table td { border: 1px solid #ddd; padding: 12px; text-align: center; }
        .summary-table th { background-color: #4f46e5; color: white; font-weight: bold; }
        .weekend-row { background-color: #fee2e2; color: #ef4444; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
        .note { background: #fef3c7; border: 1px solid #f59e0b; padding: 10px; border-radius: 4px; margin-bottom: 20px; font-size: 14px; color: #92400e; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">📅 Monthly Attendance Report</div>
        <div class="student-info">Student: ${student.first_name} ${student.last_name}</div>
        <div class="student-info">ID: #${student.id}</div>
        <div class="student-info">Grade: ${grade.grade}${grade.grade_part || ''}</div>
        <div class="student-info">Month: ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
    </div>

    <div class="note">
        <strong>Note:</strong> Weekends (Saturday & Sunday) are holidays and excluded from attendance calculations.
    </div>

    <div class="stats">
        <div class="stat-item">
            <div class="stat-number">${weekdaysData.length}</div>
            <div class="stat-label">School Days</div>
        </div>
        <div class="stat-item">
            <div class="stat-number present">${presentCount}</div>
            <div class="stat-label">Present</div>
        </div>
        <div class="stat-item">
            <div class="stat-number absent">${absentCount}</div>
            <div class="stat-label">Absent</div>
        </div>
        <div class="stat-item">
            <div class="stat-number unmarked">${unmarkedCount}</div>
            <div class="stat-label">Unmarked</div>
        </div>
        <div class="stat-item">
            <div class="stat-number">${attendanceRate}%</div>
            <div class="stat-label">Attendance Rate</div>
        </div>
    </div>

    <h3 style="color: #4f46e5; margin-bottom: 15px;">📅 Monthly Calendar View</h3>
    <div class="calendar">
        <div class="day-header">Sun</div>
        <div class="day-header">Mon</div>
        <div class="day-header">Tue</div>
        <div class="day-header">Wed</div>
        <div class="day-header">Thu</div>
        <div class="day-header">Fri</div>
        <div class="day-header">Sat</div>
        ${attendanceData.map((day, index) => {
            const dayOfWeek = new Date(day.date).getDay();
            const dayClass = day.isWeekend ? 'weekend-bg' : day.status === 1 ? 'present-bg' : day.status === 0 ? 'absent-bg' : 'unmarked-bg';
            
            return `
                <div class="day-cell ${dayClass}" style="grid-column: ${index === 0 ? dayOfWeek + 1 : 'auto'};">
                    <div class="day-number">${day.date.split('-')[2]}</div>
                    <div class="attendance-symbol">${day.display.symbol}</div>
                </div>
            `;
        }).join('')}
    </div>

    <h3 style="color: #4f46e5; margin-bottom: 15px;">📊 Daily Attendance Summary</h3>
    <table class="summary-table">
        <thead>
            <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Status</th>
                <th>Attendance</th>
            </tr>
        </thead>
        <tbody>
            ${attendanceData.map(day => {
                const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
                const rowClass = day.isWeekend ? 'weekend-row' : day.status === 1 ? 'present-row' : day.status === 0 ? 'absent-row' : 'unmarked-row';
                
                return `
                    <tr class="${rowClass}">
                        <td>${day.date}</td>
                        <td>${dayName}</td>
                        <td>${day.display.symbol}</td>
                        <td>${day.isWeekend ? 'Holiday' : day.status === 1 ? 'Present' : day.status === 0 ? 'Absent' : 'Unmarked'}</td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    </table>

    <div class="footer">
        <p>Generated on ${new Date().toLocaleString()} | EduTrack Attendance Management System</p>
    </div>
</body>
</html>
    `;

    // Create and download PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(pdfContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  };

  // Generate all months in a year
  const getMonthsInYear = (date: string) => {
    const [year] = date.split('-');
    const months = [];
    
    for (let month = 1; month <= 12; month++) {
      const monthStr = month.toString().padStart(2, '0');
      months.push(`${year}-${monthStr}`);
    }
    
    return months;
  };

  // Generate PDF for individual student yearly attendance
  const generateStudentYearlyPDF = (student: any, grade: Grade) => {
    const [year] = selectedDate.split('-');
    const monthsInYear = getMonthsInYear(selectedDate);
    
    let yearlyStats = {
      totalSchoolDays: 0,
      present: 0,
      absent: 0,
      unmarked: 0,
      monthlyData: [] as any[]
    };
    
    // Process each month
    monthsInYear.forEach(monthStr => {
      const allDaysInMonth = getAllDaysInMonth(`${monthStr}-01`);
      const attendanceData = allDaysInMonth.map(date => {
        const attendance = getStudentAttendanceForDate(student.id, date);
        const isWeekendDay = isWeekend(date);
        return {
          date: date,
          status: attendance,
          isWeekend: isWeekendDay
        };
      });
      
      const weekdaysData = attendanceData.filter(d => !d.isWeekend);
      const presentCount = weekdaysData.filter(d => d.status === 1).length;
      const absentCount = weekdaysData.filter(d => d.status === 0).length;
      const unmarkedCount = weekdaysData.filter(d => d.status === null).length;
      const attendanceRate = (presentCount + absentCount) > 0 ? Math.round((presentCount / (presentCount + absentCount)) * 100) : 0;
      
      yearlyStats.totalSchoolDays += weekdaysData.length;
      yearlyStats.present += presentCount;
      yearlyStats.absent += absentCount;
      yearlyStats.unmarked += unmarkedCount;
      
      yearlyStats.monthlyData.push({
        month: monthStr,
        monthName: new Date(`${monthStr}-01`).toLocaleDateString('en-US', { month: 'long' }),
        schoolDays: weekdaysData.length,
        present: presentCount,
        absent: absentCount,
        unmarked: unmarkedCount,
        attendanceRate: attendanceRate
      });
    });
    
    const overallAttendanceRate = (yearlyStats.present + yearlyStats.absent) > 0 ? 
      Math.round((yearlyStats.present / (yearlyStats.present + yearlyStats.absent)) * 100) : 0;
    
    const pdfContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Yearly Attendance Report - ${student.first_name} ${student.last_name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 28px; font-weight: bold; color: #4f46e5; margin-bottom: 10px; }
        .student-info { font-size: 16px; color: #666; margin-bottom: 5px; }
        .stats { display: flex; justify-content: space-around; margin-bottom: 30px; background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .stat-item { text-align: center; }
        .stat-number { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
        .stat-label { font-size: 14px; color: #666; }
        .present { color: #10b981; }
        .absent { color: #ef4444; }
        .unmarked { color: #6b7280; }
        .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .summary-table th, .summary-table td { border: 1px solid #ddd; padding: 12px; text-align: center; }
        .summary-table th { background-color: #4f46e5; color: white; font-weight: bold; }
        .excellent { background-color: #d4edda; color: #155724; }
        .good { background-color: #cce5ff; color: #004085; }
        .fair { background-color: #fff3cd; color: #856404; }
        .poor { background-color: #f8d7da; color: #721c24; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
        .note { background: #fef3c7; border: 1px solid #f59e0b; padding: 10px; border-radius: 4px; margin-bottom: 20px; font-size: 14px; color: #92400e; }
        .chart-container { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        .bar-chart { display: flex; align-items: flex-end; height: 200px; gap: 10px; margin-top: 15px; }
        .bar { flex: 1; background: linear-gradient(to top, #4f46e5, #7c3aed); border-radius: 4px 4px 0 0; position: relative; min-height: 5px; }
        .bar-label { position: absolute; bottom: -25px; left: 50%; transform: translateX(-50%); font-size: 10px; white-space: nowrap; }
        .bar-value { position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 10px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">📅 Yearly Attendance Report</div>
        <div class="student-info">Student: ${student.first_name} ${student.last_name}</div>
        <div class="student-info">ID: #${student.id}</div>
        <div class="student-info">Grade: ${grade.grade}${grade.grade_part || ''}</div>
        <div class="student-info">Year: ${year}</div>
    </div>

    <div class="note">
        <strong>Note:</strong> Weekends (Saturday & Sunday) are holidays and excluded from attendance calculations.
    </div>

    <div class="stats">
        <div class="stat-item">
            <div class="stat-number">${yearlyStats.totalSchoolDays}</div>
            <div class="stat-label">Total School Days</div>
        </div>
        <div class="stat-item">
            <div class="stat-number present">${yearlyStats.present}</div>
            <div class="stat-label">Present</div>
        </div>
        <div class="stat-item">
            <div class="stat-number absent">${yearlyStats.absent}</div>
            <div class="stat-label">Absent</div>
        </div>
        <div class="stat-item">
            <div class="stat-number unmarked">${yearlyStats.unmarked}</div>
            <div class="stat-label">Unmarked</div>
        </div>
        <div class="stat-item">
            <div class="stat-number ${overallAttendanceRate >= 95 ? 'present' : overallAttendanceRate >= 85 ? 'good' : overallAttendanceRate >= 75 ? 'fair' : 'poor'}">${overallAttendanceRate}%</div>
            <div class="stat-label">Yearly Attendance</div>
        </div>
    </div>

    <div class="chart-container">
        <h3 style="color: #4f46e5; margin-bottom: 10px;">📊 Monthly Attendance Overview</h3>
        <div class="bar-chart">
            ${yearlyStats.monthlyData.map(month => `
                <div class="bar" style="height: ${(month.attendanceRate / 100) * 180}px;">
                    <div class="bar-value">${month.attendanceRate}%</div>
                    <div class="bar-label">${month.monthName.slice(0, 3)}</div>
                </div>
            `).join('')}
        </div>
    </div>

    <h3 style="color: #4f46e5; margin-bottom: 15px;">📊 Monthly Breakdown</h3>
    <table class="summary-table">
        <thead>
            <tr>
                <th>Month</th>
                <th>School Days</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Unmarked</th>
                <th>Attendance Rate</th>
                <th>Performance</th>
            </tr>
        </thead>
        <tbody>
            ${yearlyStats.monthlyData.map(month => {
                const performanceClass = month.attendanceRate >= 95 ? 'excellent' : 
                                       month.attendanceRate >= 85 ? 'good' : 
                                       month.attendanceRate >= 75 ? 'fair' : 'poor';
                const performanceText = month.attendanceRate >= 95 ? 'Excellent' : 
                                      month.attendanceRate >= 85 ? 'Good' : 
                                      month.attendanceRate >= 75 ? 'Fair' : 'Poor';
                
                return `
                    <tr class="${performanceClass}">
                        <td><strong>${month.monthName}</strong></td>
                        <td>${month.schoolDays}</td>
                        <td>${month.present}</td>
                        <td>${month.absent}</td>
                        <td>${month.unmarked}</td>
                        <td><strong>${month.attendanceRate}%</strong></td>
                        <td>${performanceText}</td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    </table>

    <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        <h4 style="color: #4f46e5; margin-bottom: 10px;">📈 Performance Summary</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div>
                <strong>Best Month:</strong> ${yearlyStats.monthlyData.reduce((best, month) => 
                  month.attendanceRate > (best?.attendanceRate || 0) ? month : best, 
                  yearlyStats.monthlyData[0])?.monthName || 'N/A'}
            </div>
            <div>
                <strong>Needs Improvement:</strong> ${yearlyStats.monthlyData.filter(m => m.attendanceRate < 75).map(m => m.monthName).join(', ') || 'None'}
            </div>
            <div>
                <strong>Consistency:</strong> ${yearlyStats.monthlyData.filter(m => m.attendanceRate >= 85).length}/12 months good attendance
            </div>
            <div>
                <strong>Perfect Months:</strong> ${yearlyStats.monthlyData.filter(m => m.attendanceRate === 100).length} months with 100% attendance
            </div>
        </div>
    </div>

    <div class="footer">
        <p>Generated on ${new Date().toLocaleString()} | EduTrack Attendance Management System</p>
    </div>
</body>
</html>
    `;

    // Create and download PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(pdfContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  };

  // Generate PDF for all grades
  const generateAllGradesPDF = () => {
    let allGradesContent = `
<!DOCTYPE html>
<html>
<head>
    <title>All Grades Attendance Report - ${selectedDate}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; color: #4f46e5; margin-bottom: 10px; }
        .date-info { font-size: 16px; color: #666; }
        .grade-section { margin-bottom: 40px; page-break-inside: avoid; }
        .grade-header { background: #4f46e5; color: white; padding: 15px; border-radius: 8px 8px 0 0; font-size: 18px; font-weight: bold; }
        .stats { display: flex; justify-content: space-around; background: #f8f9fa; padding: 15px; border-left: 1px solid #ddd; border-right: 1px solid #ddd; }
        .stat-item { text-align: center; }
        .stat-number { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
        .stat-label { font-size: 12px; color: #666; }
        .present { color: #10b981; }
        .absent { color: #ef4444; }
        .unmarked { color: #6b7280; }
        table { width: 100%; border-collapse: collapse; border-left: 1px solid #ddd; border-right: 1px solid #ddd; border-bottom: 1px solid #ddd; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .present-row { background-color: #d4edda; }
        .absent-row { background-color: #f8d7da; }
        .unmarked-row { background-color: #f8f9fa; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">📅 All Grades Attendance Report</div>
        <div class="date-info">Date: ${selectedDate}</div>
    </div>
`;

    gradesData.forEach(grade => {
      const attendanceKey = `attendance_${grade.id}_${selectedDate}`;
      const savedAttendance = JSON.parse(localStorage.getItem(attendanceKey) || '{}');
      
      allGradesContent += `
    <div class="grade-section">
        <div class="grade-header">
            📚 Grade ${grade.grade}${grade.grade_part || ''}
        </div>
        <div class="stats">
            <div class="stat-item">
                <div class="stat-number">${grade.students?.length || 0}</div>
                <div class="stat-label">Total</div>
            </div>
            <div class="stat-item">
                <div class="stat-number present">${Object.values(savedAttendance).filter(status => status === 1).length}</div>
                <div class="stat-label">Present</div>
            </div>
            <div class="stat-item">
                <div class="stat-number absent">${Object.values(savedAttendance).filter(status => status === 0).length}</div>
                <div class="stat-label">Absent</div>
            </div>
            <div class="stat-item">
                <div class="stat-number unmarked">${grade.students?.length - Object.keys(savedAttendance).length}</div>
                <div class="stat-label">Unmarked</div>
            </div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>No</th>
                    <th>Student Name</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${grade.students?.map((student, index) => {
                    const status = savedAttendance[student.id];
                    const statusText = status === 1 ? 'Present' : status === 0 ? 'Absent' : 'Unmarked';
                    const statusClass = status === 1 ? 'present-row' : status === 0 ? 'absent-row' : 'unmarked-row';
                    const statusSymbol = status === 1 ? '✓' : status === 0 ? '✗' : '-';
                    
                    return `
                        <tr class="${statusClass}">
                            <td>${index + 1}</td>
                            <td>${student.first_name} ${student.last_name}</td>
                            <td><strong>${statusSymbol}</strong> ${statusText}</td>
                        </tr>
                    `;
                }).join('') || '<tr><td colspan="3" style="text-align: center;">No students found</td></tr>'}
            </tbody>
        </table>
    </div>
`;
    });

    allGradesContent += `
    <div class="footer">
        <p>Generated on ${new Date().toLocaleString()} | EduTrack Attendance Management System</p>
    </div>
</body>
</html>
    `;

    // Create and download PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(allGradesContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  };

  const fetchGrades = async () => {
    setLoading(true);
    try {
      // Use your existing grades API that already includes students
      const response = await fetch('http://localhost:5000/api/grades');
      
      if (response.ok) {
        const result = await response.json();
        const grades = result.data || result;
        
        setGradesData(grades);
        
        // Initialize attendance data for each grade
        const initialAttendanceData: { [gradeId: number]: GradeAttendance } = {};
        grades.forEach((grade: Grade) => {
          const gradeName = `${grade.grade}${grade.grade_part || ''}`;
          initialAttendanceData[grade.id] = {
            grade_id: grade.id,
            grade_name: gradeName,
            students: grade.students || [],
            attendance: {},
            date: selectedDate
          };
        });
        
        setAttendanceData(initialAttendanceData);
        
        // Load existing attendance for today
        loadExistingAttendance(grades, selectedDate);
      } else {
        console.error('Failed to fetch grades');
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingAttendance = (grades: Grade[], date: string) => {
    console.log('=== loadExistingAttendance Called ===');
    console.log('Grades:', grades);
    console.log('Date:', date);
    
    const updatedAttendanceData = { ...attendanceData };
    
    grades.forEach(grade => {
      const attendanceKey = `attendance_${grade.id}_${date}`;
      const savedAttendance = JSON.parse(localStorage.getItem(attendanceKey) || '{}');
      
      console.log(`Attendance key: ${attendanceKey}`);
      console.log(`Saved attendance:`, savedAttendance);
      
      if (!updatedAttendanceData[grade.id]) {
        console.log(`Creating new attendance data for grade ${grade.id}`);
        const gradeName = `${grade.grade}${grade.grade_part || ''}`;
        updatedAttendanceData[grade.id] = {
          grade_id: grade.id,
          grade_name: gradeName,
          students: grade.students || [],
          attendance: savedAttendance,
          date: date
        };
      } else {
        console.log(`Updating existing attendance data for grade ${grade.id}`);
        updatedAttendanceData[grade.id].attendance = savedAttendance;
        updatedAttendanceData[grade.id].date = date;
      }
      
      console.log(`Final attendance data for grade ${grade.id}:`, updatedAttendanceData[grade.id]);
    });
    
    console.log('Setting final attendanceData:', updatedAttendanceData);
    setAttendanceData(updatedAttendanceData);
  };

  const handleGradeClick = (grade: Grade) => {
    console.log('=== handleGradeClick Called ===');
    console.log('Grade clicked:', grade);
    
    setSelectedGrade(grade);
    
    // Initialize attendance data for this grade if not already loaded
    if (!attendanceData[grade.id]) {
      console.log('Initializing attendance data for grade:', grade.id);
      const gradeName = `${grade.grade}${grade.grade_part || ''}`;
      const newGradeData: GradeAttendance = {
        grade_id: grade.id,
        grade_name: gradeName,
        students: grade.students || [],
        attendance: {},
        date: selectedDate
      };
      
      console.log('New grade data:', newGradeData);
      
      setAttendanceData(prev => {
        const updatedData = {
          ...prev,
          [grade.id]: newGradeData
        };
        console.log('Updated attendanceData:', updatedData);
        return updatedData;
      });
    }
    
    // Load existing attendance for the selected date
    console.log('Loading existing attendance...');
    loadExistingAttendance([grade], selectedDate);
  };

  const handleAttendanceChange = (studentId: number, status: number) => {
    if (!selectedGrade) return;
    
    setAttendanceData(prev => {
      const currentGradeData = prev[selectedGrade.id];
      if (!currentGradeData) {
        console.error('No attendance data found for grade:', selectedGrade.id);
        return prev;
      }
      
      const updatedData = {
        ...prev,
        [selectedGrade.id]: {
          ...currentGradeData,
          attendance: {
            ...currentGradeData.attendance,
            [studentId]: status
          }
        }
      };
      
      return updatedData;
    });
  };

  const handleMarkAllPresent = () => {
    if (!selectedGrade) return;
    
    const allPresent: { [student_id: number]: number } = {};
    selectedGrade.students?.forEach(student => {
      allPresent[student.id] = 1;
    });
    
    setAttendanceData(prev => {
      const currentGradeData = prev[selectedGrade.id];
      if (!currentGradeData) {
        console.error('No attendance data found for grade:', selectedGrade.id);
        return prev;
      }
      
      const updatedData = {
        ...prev,
        [selectedGrade.id]: {
          ...currentGradeData,
          attendance: {
            ...currentGradeData.attendance,
            ...allPresent
          }
        }
      };
      
      return updatedData;
    });
  };

  const handleMarkAllAbsent = () => {
    if (!selectedGrade) return;
    
    const allAbsent: { [student_id: number]: number } = {};
    selectedGrade.students?.forEach(student => {
      allAbsent[student.id] = 0;
    });
    
    setAttendanceData(prev => {
      const currentGradeData = prev[selectedGrade.id];
      if (!currentGradeData) {
        console.error('No attendance data found for grade:', selectedGrade.id);
        return prev;
      }
      
      const updatedData = {
        ...prev,
        [selectedGrade.id]: {
          ...currentGradeData,
          attendance: {
            ...currentGradeData.attendance,
            ...allAbsent
          }
        }
      };
      
      return updatedData;
    });
  };

  const handleSaveAttendance = async () => {
    if (!selectedGrade) return;
    
    setSaving(true);
    
    try {
      const gradeAttendance = attendanceData[selectedGrade.id];
      
      // Save to localStorage with multiple keys for different access patterns
      const attendanceKey = `attendance_${selectedGrade.id}_${selectedDate}`;
      localStorage.setItem(attendanceKey, JSON.stringify(gradeAttendance.attendance));
      
      // Save daily summary
      const dailyKey = `daily_attendance_${selectedDate}`;
      const dailyData = JSON.parse(localStorage.getItem(dailyKey) || '{}');
      dailyData[selectedGrade.id] = {
        grade_id: selectedGrade.id,
        grade_name: gradeAttendance.grade_name,
        attendance: gradeAttendance.attendance,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(dailyKey, JSON.stringify(dailyData));
      
      // Save monthly summary
      const [year, month] = selectedDate.split('-');
      const monthlyKey = `monthly_attendance_${year}_${month}`;
      const monthlyData = JSON.parse(localStorage.getItem(monthlyKey) || '{}');
      if (!monthlyData[selectedGrade.id]) {
        monthlyData[selectedGrade.id] = {};
      }
      monthlyData[selectedGrade.id][selectedDate] = gradeAttendance.attendance;
      localStorage.setItem(monthlyKey, JSON.stringify(monthlyData));
      
      // Save student history
      Object.entries(gradeAttendance.attendance).forEach(([studentId, status]) => {
        const studentKey = `student_attendance_${studentId}`;
        const studentData = JSON.parse(localStorage.getItem(studentKey) || '{}');
        if (!studentData[selectedDate]) {
          studentData[selectedDate] = {};
        }
        studentData[selectedDate] = {
          grade_id: selectedGrade.id,
          grade_name: gradeAttendance.grade_name,
          status: status,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem(studentKey, JSON.stringify(studentData));
      });
      
      // Show success message
      alert(`Attendance saved successfully for ${gradeAttendance.grade_name} on ${selectedDate}!\n\n` +
            `Present: ${Object.values(gradeAttendance.attendance).filter(status => status === 1).length}\n` +
            `Absent: ${Object.values(gradeAttendance.attendance).filter(status => status === 0).length}\n` +
            `Unmarked: ${gradeAttendance.students.length - Object.keys(gradeAttendance.attendance).length}`);
      
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getAttendanceStats = () => {
    if (!selectedGrade || !attendanceData[selectedGrade.id]) {
      return { total: 0, present: 0, absent: 0, unmarked: 0, percentage: 0 };
    }
    
    const gradeAttendance = attendanceData[selectedGrade.id];
    const total = gradeAttendance.students.length;
    const present = Object.values(gradeAttendance.attendance).filter(status => status === 1).length;
    const absent = Object.values(gradeAttendance.attendance).filter(status => status === 0).length;
    const unmarked = total - present - absent;
    const percentage = (present + absent) > 0 ? Math.round((present / (present + absent)) * 100) : 0;
    
    return { total, present, absent, unmarked, percentage };
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 25%, #0f172a 50%, #1e1b4b 75%, #0f172a 100%)',
        color: '#e2e8f0'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem',
            animation: 'spin 2s linear infinite'
          }}>
            📚
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>
            Loading Attendance System...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 25%, #0f172a 50%, #1e1b4b 75%, #0f172a 100%)',
      padding: '20px',
      color: '#e2e8f0'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '10px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            📅 Attendance Management
          </h1>
          <p style={{
            fontSize: '1.1rem',
            opacity: 0.8
          }}>
            Track and manage daily attendance for all grades
          </p>
        </div>

        {/* Date and View Controls */}
        <div style={{
          background: 'rgba(79, 70, 229, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '25px',
          marginBottom: '30px',
          border: '1px solid rgba(79, 70, 229, 0.3)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '15px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '8px',
                  border: '1px solid rgba(79, 70, 229, 0.5)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#e2e8f0',
                  fontSize: '0.8rem'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                background: 'rgba(79, 70, 229, 0.2)',
                border: '1px solid rgba(79, 70, 229, 0.5)',
                borderRadius: '12px',
                padding: '2px',
                display: 'flex',
                gap: '2px'
              }}>
                <button
                  onClick={() => setViewMode('daily')}
                  style={{
                    padding: '6px 12px',
                    background: viewMode === 'daily' 
                      ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' 
                      : 'transparent',
                    color: viewMode === 'daily' ? 'white' : '#e0e7ff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: viewMode === 'daily' ? '0 2px 8px rgba(79, 70, 229, 0.4)' : 'none',
                    transform: viewMode === 'daily' ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  Daily
                </button>
                <button
                  onClick={() => setViewMode('monthly')}
                  style={{
                    padding: '6px 12px',
                    background: viewMode === 'monthly' 
                      ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' 
                      : 'transparent',
                    color: viewMode === 'monthly' ? 'white' : '#e0e7ff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: viewMode === 'monthly' ? '0 2px 8px rgba(79, 70, 229, 0.4)' : 'none',
                    transform: viewMode === 'monthly' ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  Monthly
                </button>
              </div>
            </div>
            
            <button
              onClick={generateAllGradesPDF}
              style={{
                padding: '4px 10px',
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.7rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
              }}
            >
              📄 All PDF
            </button>
          </div>
        </div>

        {/* Step 1: Show All Grades */}
        {!selectedGrade && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.95) 50%, rgba(15, 23, 42, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid rgba(79, 70, 229, 0.3)'
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: '600',
              marginBottom: '25px',
              color: '#e0e7ff',
              textAlign: 'center'
            }}>
              📚 Select Grade
            </h2>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              {gradesData.map((grade) => (
                <div
                  key={grade.id}
                  onClick={() => handleGradeClick(grade)}
                  style={{
                    background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.2) 0%, rgba(124, 58, 237, 0.2) 100%)',
                    border: '1px solid rgba(79, 70, 229, 0.5)',
                    borderRadius: '15px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(79, 70, 229, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px'
                  }}>
                    <div style={{
                      fontSize: '2rem',
                      opacity: 0.8
                    }}>
                      📚
                    </div>
                    <div>
                      <div style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '5px' }}>
                        Grade {grade.grade}{grade.grade_part || ''}
                      </div>
                      <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                        {grade.students?.length || 0} students
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {grade.students?.length > 0 && (
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#10b981',
                        padding: '8px 15px',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                      }}>
                        ✓ Has Students
                      </div>
                    )}
                    {(!grade.students || grade.students.length === 0) && (
                      <div style={{
                        background: 'rgba(107, 114, 128, 0.2)',
                        color: '#6b7280',
                        padding: '8px 15px',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        border: '1px solid rgba(107, 114, 128, 0.3)'
                      }}>
                        No Students
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        generateDailyPDF(grade);
                      }}
                      style={{
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
                      }}
                    >
                      📄 PDF
                    </button>
                    <div style={{
                      fontSize: '1.2rem',
                      color: '#a5b4fc',
                      opacity: 0.7
                    }}>
                      →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Show Students in Selected Grade */}
        {selectedGrade && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.95) 50%, rgba(15, 23, 42, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid rgba(79, 70, 229, 0.3)'
          }}>
            {/* Grade Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setSelectedGrade(null)}
                style={{
                  padding: '4px 8px',
                  background: 'rgba(107, 114, 128, 0.3)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(107, 114, 128, 0.5)',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ← Back
              </button>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#e0e7ff',
                margin: 0
              }}>
                📚 Grade {selectedGrade.grade}{selectedGrade.grade_part || ''}
              </h2>
            </div>
              
              {viewMode === 'daily' && (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  <div style={{
                    background: 'rgba(79, 70, 229, 0.4)',
                    color: '#ffffff',
                    padding: '6px 10px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    border: '1px solid rgba(79, 70, 229, 0.6)',
                    display: 'inline-block'
                  }}>
                    Total: {getAttendanceStats().total}
                  </div>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.4)',
                    color: '#ffffff',
                    padding: '6px 10px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    border: '1px solid rgba(16, 185, 129, 0.6)',
                    display: 'inline-block'
                  }}>
                    Present: {getAttendanceStats().present}
                  </div>
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.4)',
                    color: '#ffffff',
                    padding: '6px 10px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    border: '1px solid rgba(239, 68, 68, 0.6)',
                    display: 'inline-block'
                  }}>
                    Absent: {getAttendanceStats().absent}
                  </div>
                  <div style={{
                    background: 'rgba(107, 114, 128, 0.4)',
                    color: '#ffffff',
                    padding: '6px 10px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    border: '1px solid rgba(107, 114, 128, 0.6)',
                    display: 'inline-block'
                  }}>
                    Unmarked: {getAttendanceStats().unmarked}
                  </div>
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.4)',
                    color: '#ffffff',
                    padding: '6px 10px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    border: '1px solid rgba(59, 130, 246, 0.6)',
                    display: 'inline-block'
                  }}>
                    {getAttendanceStats().percentage}%
                  </div>
                </div>
              )}
            </div>

            {/* Monthly View Header */}
            {viewMode === 'monthly' && (
              <div style={{
                marginBottom: '20px',
                padding: '15px',
                background: 'rgba(79, 70, 229, 0.1)',
                borderRadius: '10px',
                border: '1px solid rgba(79, 70, 229, 0.3)'
              }}>
                <h3 style={{
                  margin: '0 0 10px 0',
                  color: '#e0e7ff',
                  fontSize: '1.2rem'
                }}>
                  📅 Monthly Attendance View - {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <div style={{
                  display: 'flex',
                  gap: '20px',
                  fontSize: '0.9rem',
                  color: '#a5b4fc'
                }}>
                  <span>✓ Present</span>
                  <span>✗ Absent</span>
                  <span>- Unmarked</span>
                  <span>🏖 Weekend (Holiday)</span>
                </div>
              </div>
            )}

            {/* Daily View Controls */}
            {viewMode === 'daily' && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '20px'
              }}>
                <button
                  onClick={() => {
                    alert(`Current Date: ${selectedDate}\nGrade ID: ${selectedGrade?.id}\nAttendance Data: ${JSON.stringify(attendanceData[selectedGrade?.id || 0]?.attendance, null, 2)}`);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '15px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
                  }}
                >
                  🔍 Debug Data
                </button>
                <button
                  onClick={handleMarkAllPresent}
                  style={{
                    padding: '6px 12px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '15px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  ✓ All Present
                </button>
                <button
                  onClick={handleMarkAllAbsent}
                  style={{
                    padding: '6px 12px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '15px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  ✗ All Absent
                </button>
                <button
                  onClick={handleSaveAttendance}
                  disabled={saving}
                  style={{
                    padding: '6px 12px',
                    background: saving ? 'rgba(107, 114, 128, 0.5)' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '15px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: saving ? 'none' : '0 2px 8px rgba(79, 70, 229, 0.3)'
                  }}
                >
                  {saving ? '💾 Saving...' : '💾 Save'}
                </button>
              </div>
            )}
                    {/* Students List */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {selectedGrade.students?.map((student) => (
                <div
                  key={student.id}
                  style={{
                    background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
                    border: '1px solid rgba(79, 70, 229, 0.3)',
                    borderRadius: '15px',
                    padding: '20px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {viewMode === 'daily' ? (
                    // Daily View - Original layout
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px'
                      }}>
                        <div style={{
                          fontSize: '1.5rem',
                          opacity: 0.8
                        }}>
                          👤
                        </div>
                        <div>
                          <div style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '3px' }}>
                            {student.first_name} {student.last_name}
                          </div>
                          <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                            ID: #{student.id}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleAttendanceChange(student.id, 1)}
                          style={{
                            padding: '4px 8px',
                            background: attendanceData[selectedGrade.id]?.attendance[student.id] === 1 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(16, 185, 129, 0.3)',
                            color: attendanceData[selectedGrade.id]?.attendance[student.id] === 1 ? 'white' : '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.5)',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => handleAttendanceChange(student.id, 0)}
                          style={{
                            padding: '4px 8px',
                            background: attendanceData[selectedGrade.id]?.attendance[student.id] === 0 ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'rgba(239, 68, 68, 0.3)',
                            color: attendanceData[selectedGrade.id]?.attendance[student.id] === 0 ? 'white' : '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.5)',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          ✗
                        </button>
                        <button
                          onClick={() => generateStudentMonthlyPDF(student, selectedGrade!)}
                          style={{
                            padding: '4px 8px',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '0.65rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 1px 4px rgba(139, 92, 246, 0.3)'
                          }}
                        >
                          📄 M
                        </button>
                        <button
                          onClick={() => generateStudentYearlyPDF(student, selectedGrade!)}
                          style={{
                            padding: '4px 8px',
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '0.65rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 1px 4px rgba(5, 150, 105, 0.3)'
                          }}
                        >
                          📄 Y
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Monthly View - Calendar layout
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        marginBottom: '15px'
                      }}>
                        <div style={{
                          fontSize: '1.5rem',
                          opacity: 0.8
                        }}>
                          👤
                        </div>
                        <div>
                          <div style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '3px' }}>
                            {student.first_name} {student.last_name}
                          </div>
                          <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                            ID: #{student.id}
                          </div>
                        </div>
                      </div>
                      
                      {/* Calendar Days */}
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap',
                        alignItems: 'center'
                      }}>
                        {getAllDaysInMonth(selectedDate).map((date) => {
                          const attendance = getStudentAttendanceForDate(student.id, date);
                          const isWeekendDay = isWeekend(date);
                          const display = getAttendanceDisplay(attendance, isWeekendDay);
                          const dayNumber = date.split('-')[2];
                          
                          return (
                            <div
                              key={date}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '2px',
                                opacity: isWeekendDay ? 0.5 : 1,
                                position: 'relative'
                              }}
                            >
                              <div style={{
                                fontSize: '0.7rem',
                                color: isWeekendDay ? '#ef4444' : '#a5b4fc',
                                fontWeight: '500'
                              }}>
                                {dayNumber}
                              </div>
                              <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '4px',
                                background: display.bg,
                                color: display.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: display.symbol === '✗' ? '1.2rem' : '0.8rem',
                                fontWeight: display.symbol === '✗' ? '900' : '600',
                                border: `1px solid ${display.color}50`,
                                minWidth: '24px'
                              }}>
                                {display.symbol}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceManagement;
