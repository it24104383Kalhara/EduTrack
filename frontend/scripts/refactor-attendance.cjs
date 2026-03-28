const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/AttendanceManagement.tsx');
let originalContent = fs.readFileSync(filePath, 'utf-8');

const loadingMatch = originalContent.indexOf('if (loading) {');
if (loadingMatch === -1) {
    console.error('Could not find loading block');
    process.exit(1);
}

const dateStudentsMatch = originalContent.indexOf('const DateStudentsView: React.FC<{');
if (dateStudentsMatch === -1) {
    console.error('Could not find DateStudentsView');
    process.exit(1);
}

let newImports = originalContent.substring(0, originalContent.indexOf('const AttendanceManagement: React.FC = () => {'));
if (!newImports.includes('AttendanceManagement.css')) {
    newImports = newImports.trim() + '\nimport \'./AttendanceManagement.css\';\n\n';
}

const logicPart = originalContent.substring(
    originalContent.indexOf('const AttendanceManagement: React.FC = () => {'),
    dateStudentsMatch
);

const newUI = `
  const DateStudentsView: React.FC<{
    grade: Grade;
    date: string;
    students: Student[];
  }> = ({ grade, date, students }) => {
    const [dateAttendanceData, setDateAttendanceData] = useState<{[key: number]: 'present' | 'absent' | 'late' | 'not-marked'}>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadDateAttendance = async () => {
        try {
          const attendanceData = await attendanceMarkApi.getByGradeSectionDate(
            grade.grade,
            grade.grade_part,
            date
          );
          
          const attendanceMap: {[key: number]: 'present' | 'absent' | 'late' | 'not-marked'} = {};
          attendanceData.attendance.forEach(record => {
            attendanceMap[record.student_id] = record.status;
          });
          
          setDateAttendanceData(attendanceMap);
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
          <div className="am-loader-icon">⏳</div>
          <div>Loading attendance data...</div>
        </div>
      );
    }

    const presentCount = students.filter(s => dateAttendanceData[s.id] === 'present').length;
    const absentCount = students.filter(s => dateAttendanceData[s.id] === 'absent').length;
    const lateCount = students.filter(s => dateAttendanceData[s.id] === 'late').length;
    const notMarkedCount = students.filter(s => !dateAttendanceData[s.id]).length;

    return (
      <div>
        <div className="am-counters">
          <div className="am-counter-card bg-success">
            <div className="am-counter-val">{presentCount}</div>
            <div className="am-counter-label">Present</div>
          </div>
          <div className="am-counter-card bg-danger">
            <div className="am-counter-val">{absentCount}</div>
            <div className="am-counter-label">Absent</div>
          </div>
          <div className="am-counter-card bg-warning">
            <div className="am-counter-val">{lateCount}</div>
            <div className="am-counter-label">Late</div>
          </div>
          <div className="am-counter-card bg-neutral">
            <div className="am-counter-val">{notMarkedCount}</div>
            <div className="am-counter-label">Not Marked</div>
          </div>
        </div>

        <div className="am-list">
          {students.map(student => {
            const status = dateAttendanceData[student.id] || 'not-marked';
            const statusDisplay = status === 'present' ? '✅ Present' : 
                                 status === 'absent' ? '❌ Absent' : 
                                 status === 'late' ? '⏰ Late' : '⏸️ Not Marked';
            const badgeClass = status === 'present' ? 'am-badge-present' :
                               status === 'absent' ? 'am-badge-absent' :
                               status === 'late' ? 'am-badge-late' : 'am-badge-unmarked';

            return (
              <div key={student.id} className="am-list-item">
                <div className="am-student-info">
                  <div className="am-student-name">
                    {student.first_name} {student.last_name}
                  </div>
                  <div className="am-student-meta">
                    ID: {student.id} | 📱 {student.parent_phone}
                  </div>
                </div>
                <div className={"am-badge " + badgeClass}>
                  {statusDisplay}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="am-loader-container">
        <div className="am-loader">
          <div className="am-loader-icon">⏳</div>
          <h2 style={{fontWeight: 600}}>Loading Attendance System...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="am-container">
      <div className="am-card">
        <div className="am-header">
          <div className="am-icon">📅</div>
          <h1 className="am-title">Attendance Management</h1>
          <p className="am-subtitle">
            Track student attendance, generate beautiful reports, and manage daily attendance records seamlessly.
          </p>
        </div>
        
        {/* Grades Grid */}
        <div className="am-grid-container">
          <h2 className="am-grid-title">📚 Available Grades ({grades.length})</h2>
          
          {grades.length === 0 ? (
            <div className="am-empty-state">
              <div className="am-empty-icon">📚</div>
              <div style={{fontWeight: 600, fontSize: '18px', color: 'var(--text-primary)', marginBottom: '4px'}}>No grades available</div>
              <div>Please create grades in Grade Management first</div>
            </div>
          ) : (
            <div className="am-grades-grid">
              {grades.map(grade => (
                <div key={grade.id} className="am-grade-card" onClick={() => setSelectedGrade(grade)}>
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div className="am-grade-badge">
                      {grade.grade}
                    </div>
                    
                    <div className="am-grade-info">
                      <div className="am-grade-name">
                        Grade {grade.grade}-{grade.grade_part}
                      </div>
                      
                      <div className="am-grade-meta">
                        <span>👥 {grade.students?.length || 0} students</span>
                        <span>📅 {new Date(grade.created_at || '').toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="am-btn-group">
                    <button
                      className="am-btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTakeAttendance(grade);
                      }}
                    >
                      📝 Take
                    </button>
                    <button
                      className="am-btn-secondary"
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
      {showDateSelection && (
        <div className="am-modal-overlay">
          <div className="am-modal am-modal-sm">
            <h2 className="am-modal-title">Select Date</h2>
            <p className="am-modal-subtitle" style={{marginBottom: '20px'}}>
              Grade: {selectedGrade?.grade}-{selectedGrade?.grade_part}
            </p>
            <input
              type="date"
              className="am-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{marginBottom: '24px'}}
            />
            <div className="am-btn-group" style={{justifyContent: 'flex-end'}}>
              <button className="am-btn-secondary" onClick={closeDateSelection}>Cancel</button>
              <button className="am-btn-primary" onClick={handleDateSelect}>Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* Students Attendance Modal */}
      {showStudentsModal && selectedGrade && (
        <div className="am-modal-overlay">
          <div className="am-modal am-modal-lg">
            <div className="am-modal-header">
              <div>
                <h2 className="am-modal-title">Mark Attendance</h2>
                <p className="am-modal-subtitle">
                  Grade: {selectedGrade.grade}-{selectedGrade.grade_part} | Date: {selectedDate}
                </p>
              </div>
              <button className="am-close-btn" onClick={closeStudentsModal}>×</button>
            </div>

            <div className="am-counters">
              <div className="am-counter-card bg-success">
                <div className="am-counter-val">{Object.values(attendanceData).filter(status => status === 'present').length}</div>
                <div className="am-counter-label">Present</div>
              </div>
              <div className="am-counter-card bg-danger">
                <div className="am-counter-val">{Object.values(attendanceData).filter(status => status === 'absent').length}</div>
                <div className="am-counter-label">Absent</div>
              </div>
              <div className="am-counter-card bg-warning">
                <div className="am-counter-val">{Object.values(attendanceData).filter(status => status === 'late').length}</div>
                <div className="am-counter-label">Late</div>
              </div>
              <div className="am-counter-card bg-neutral">
                <div className="am-counter-val">{getGradeStudents().length - Object.keys(attendanceData).length}</div>
                <div className="am-counter-label">Not Marked</div>
              </div>
            </div>

            <div className="am-list">
              {getGradeStudents().map(student => (
                <div key={student.id} className={"am-list-item " + (Object.keys(attendanceData).includes(student.id.toString()) ? 'selected' : '')}>
                  <div className="am-student-info">
                    <div className="am-student-name">
                      {student.first_name} {student.last_name}
                    </div>
                    <div className="am-student-meta">
                      ID: {student.id}
                    </div>
                  </div>
                  <div className="am-btn-group">
                    {(['present', 'absent', 'late', 'not-marked'] as const).map(status => {
                      const isActive = attendanceData[student.id] === status;
                      const activeClass = isActive ? 
                        (status === 'present' ? 'active-present' : 
                         status === 'absent' ? 'active-absent' : 
                         status === 'late' ? 'active-late' : 'active-unmarked') : '';
                      
                      const label = status === 'present' ? '✅ Present' : 
                                    status === 'absent' ? '❌ Absent' : 
                                    status === 'late' ? '⏰ Late' : '⏸️ Not Marked';

                      return (
                        <button
                          key={status}
                          className={"am-status-btn " + activeClass}
                          onClick={() => toggleAttendance(student.id, status)}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="am-modal-footer">
              <button className="am-btn-secondary" onClick={closeStudentsModal}>Cancel</button>
              <button className="am-btn-primary" onClick={handleSubmitAttendance}>Submit Attendance</button>
            </div>
          </div>
        </div>
      )}

      {/* Reports Modal */}
      {showReportsModal && selectedGrade && (
        <div className="am-modal-overlay">
          <div className="am-modal am-modal-md">
            <div className="am-modal-header">
              <div>
                <h2 className="am-modal-title">Attendance Reports</h2>
                <p className="am-modal-subtitle">
                  Grade: {selectedGrade.grade}-{selectedGrade.grade_part}
                </p>
              </div>
              <button className="am-close-btn" onClick={closeReportsModal}>×</button>
            </div>

            <div style={{marginBottom: '24px'}}>
              <h3 style={{fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)'}}>
                Available Dates ({attendanceDates.length})
              </h3>
              {attendanceDates.length === 0 ? (
                <div className="am-empty-state">
                  <div className="am-empty-icon">📅</div>
                  <div>No attendance records found</div>
                </div>
              ) : (
                <div className="am-list">
                  {attendanceDates.map(date => (
                    <div key={date} className="am-list-item">
                      <div className="am-student-name" style={{marginBottom: 0}}>
                        {date}
                      </div>
                      <div className="am-btn-group">
                        <button
                          className="am-btn-blue"
                          onClick={() => {
                            setSelectedReportDate(date);
                            setShowDateStudents(true);
                          }}
                        >
                          View Details
                        </button>
                        <button
                          className="am-btn-success"
                          onClick={() => downloadSingleDatePDF(date)}
                        >
                          Download PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="am-modal-footer">
              <button className="am-btn-primary" onClick={downloadCompleteAttendancePDF}>Download Complete Report</button>
            </div>
          </div>
        </div>
      )}

      {/* Date Students Modal */}
      {showDateStudents && selectedGrade && selectedReportDate && (
        <div className="am-modal-overlay">
          <div className="am-modal am-modal-lg">
            <div className="am-modal-header">
              <div>
                <h2 className="am-modal-title">Attendance Details</h2>
                <p className="am-modal-subtitle">
                  Grade: {selectedGrade.grade}-{selectedGrade.grade_part} | Date: {selectedReportDate}
                </p>
              </div>
              <button className="am-close-btn" onClick={() => setShowDateStudents(false)}>×</button>
            </div>

            <DateStudentsView 
              grade={selectedGrade}
              date={selectedReportDate}
              students={getGradeStudents()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;
`;

const finalCode = newImports + logicPart + newUI;
fs.writeFileSync(filePath, finalCode, 'utf-8');
console.log('Successfully refactored AttendanceManagement.tsx');
