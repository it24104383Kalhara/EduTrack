import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import {
  Search,
  GraduationCap,
  Plus,
  List,
  BookOpen,
  Users,
  Printer,
  Pencil,
  Trash,
  ArrowLeftRight,
  ArrowRight,
  Loader2,
  Activity,
  Check,
  X,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { gradeApi, studentApi, subjectApi } from '../services/api';
import type { Subject, Student, Grade } from '../services/api';

const GradeManagement: React.FC = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeTab, setActiveTab] = useState<'assigned' | 'available' | 'transfer'>('assigned');
  const [loading, setLoading] = useState(true);
  const [newGrade, setNewGrade] = useState({ grade: 0, grade_part: '' });
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [showStudentAssignment, setShowStudentAssignment] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAllAssignments, setShowAllAssignments] = useState(false);
  const [allAssignments, setAllAssignments] = useState<Array<any>>([]);
  const [searchGrade, setSearchGrade] = useState('');
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedSourceGrade, setSelectedSourceGrade] = useState<number | null>(null);
  const [transferHistory, setTransferHistory] = useState<Record<number, number>>({});
  
  // Subject Selection State
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

  // Bulk Enrollment State
  const [showBulkEnrollment, setShowBulkEnrollment] = useState(false);
  const [selectedEnrollmentSubject, setSelectedEnrollmentSubject] = useState<Subject | null>(null);
  const [gradeStudentsForBulk, setGradeStudentsForBulk] = useState<Student[]>([]);
  const [bulkEnrolledStudentIds, setBulkEnrolledStudentIds] = useState<number[]>([]);
  const [savingBulk, setSavingBulk] = useState(false);
  const [hoveredSubjectId, setHoveredSubjectId] = useState<string | null>(null);
  const [bucketEnrollments, setBucketEnrollments] = useState<Record<number, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  const showValidationError = (msg: string) => {
    setValidationError(msg);
    setTimeout(() => setValidationError(null), 5000);
  };

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const gradesData = await gradeApi.getAll();
      setGrades(gradesData || []);
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
      setStudents(studentsData || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setStudents([]);
    }
  };

  const fetchAllAssignments = async () => {
    try {
      const assignmentsData = await gradeApi.getAllAssignments();
      setAllAssignments(assignmentsData || []);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      setAllAssignments([]);
    }
  };

  useEffect(() => {
    fetchGrades();
    fetchStudents();
  }, []);

  const handleAddGrade = async () => {
    if (!newGrade.grade || !newGrade.grade_part) {
      alert('Please enter both a grade number and a stream/section.');
      return;
    }
    try {
      await gradeApi.create(newGrade);
      setNewGrade({ grade: 0, grade_part: '' });
      await fetchGrades();
    } catch (error) {
      console.error('Failed to create grade:', error);
      alert('Failed to create grade');
    }
  };

  const handleAssignStudent = async (studentId: number, gradeId: number) => {
    try {
      const currentGrade = grades.find(g => g.id === gradeId);
      const isStudentAssignedToThisGrade = currentGrade?.students?.some(s => s.id === studentId);

      if (isStudentAssignedToThisGrade) {
        // Toggle off: remove student from this grade
        await gradeApi.removeStudent(gradeId, studentId);
      } else {
        // Toggle on: Check if assigned elsewhere
        const otherGrade = grades.find(g => g.id !== gradeId && g.students?.some(s => s.id === studentId));
        
        if (otherGrade) {
          const studentName = students.find(s => s.id === studentId);
          const nameStr = studentName ? `${studentName.first_name} ${studentName.last_name}` : 'this student';
          
          if (confirm(`${nameStr} is currently assigned to ${otherGrade.grade}-${otherGrade.grade_part}. \n\nDo you want to TRANSFER them to this class and move all their academic records (Marks & Attendance)?`)) {
            await gradeApi.transferStudent(studentId, otherGrade.id, gradeId);
            setTransferHistory(prev => ({ ...prev, [studentId]: otherGrade.id }));
            alert(`${nameStr} has been transferred and all academic records are updated!`);
            // Removing setActiveTab('assigned') so user can stay in Transfer tab and see history
          } else {
            // User cancelled transfer
            return;
          }
        } else {
          // New assignment (no previous class)
          await gradeApi.assignStudent(gradeId, studentId);
          setActiveTab('assigned');
        }
      }
      
      await fetchGrades();
      await fetchStudents();
    } catch (error: any) {
      console.error('Failed to update student assignment:', error);
      alert(error.message || 'Failed to update assignment');
    }
  };



  const openBulkEnrollment = async (gradeId: number) => {
    try {
      setSelectedGrade(gradeId);
      setSavingBulk(true);
      
      // Get all students for this grade
      const allStudents = await studentApi.getAll();
      const gradeStudents = allStudents.filter(s => grades.find(g => g.id === gradeId)?.students?.some(gs => gs.id === s.id));
      setGradeStudentsForBulk(gradeStudents);
      
      // Get subjects for this grade
      const allSubjects = await subjectApi.getAll();
      const gradeObj = grades.find(g => g.id === gradeId);
      const gradeNum = gradeObj?.grade.toString();
      const filtered = allSubjects.filter(s => (Array.isArray(s.grades) ? s.grades : [s.grades]).includes(gradeNum || ''));
      setAvailableSubjects(filtered);
      
      setShowBulkEnrollment(true);
      setSelectedEnrollmentSubject(null);
      setBulkEnrolledStudentIds([]);
    } catch (error) {
      console.error('Failed to prepare bulk enrollment:', error);
    } finally {
      setSavingBulk(false);
    }
  };

  const handleEnrollmentSubjectSelect = async (subject: Subject) => {
    setSelectedEnrollmentSubject(subject);
    try {
      setSavingBulk(true);
      // Fetch current subject enrollment
      const enrollment = await subjectApi.getSubjectEnrollment(subject.id, selectedGrade!);
      setBulkEnrolledStudentIds(enrollment.map(e => e.student_id));

      // NEW: Fetch all enrollments for this bucket in this grade to prevent duplicates
      if (subject.category) {
        const otherSubjectsInBucket = availableSubjects.filter(s => s.category === subject.category && s.id !== subject.id);
        const bucketMap: Record<number, string> = {};
        
        await Promise.all(otherSubjectsInBucket.map(async (s) => {
          const enrolls = await subjectApi.getSubjectEnrollment(s.id, selectedGrade!);
          enrolls.forEach(e => {
            bucketMap[e.student_id] = s.name;
          });
        }));
        setBucketEnrollments(bucketMap);
      } else {
        setBucketEnrollments({});
      }
    } catch (error) {
      console.error('Error fetching subject enrollment:', error);
      alert('Failed to load enrollment data.');
    } finally {
      setSavingBulk(false);
    }
  };

  const toggleStudentForBulk = (studentId: number) => {
    const isAdding = !bulkEnrolledStudentIds.includes(studentId);
    
    // Validation: Bucket Rule
    if (isAdding && selectedEnrollmentSubject?.category && bucketEnrollments[studentId]) {
      showValidationError(`Already enrolled in "${bucketEnrollments[studentId]}" for "${selectedEnrollmentSubject.category}" bucket.`);
      return;
    }

    setBulkEnrolledStudentIds(prev => 
      isAdding 
        ? [...prev, studentId] 
        : prev.filter(id => id !== studentId)
    );
  };

  const handleSaveBulkEnrollment = async () => {
    if (!selectedEnrollmentSubject || !selectedGrade) return;
    try {
      setSavingBulk(true);
      await subjectApi.bulkEnrollStudents(selectedEnrollmentSubject.id, selectedGrade, bulkEnrolledStudentIds);
      alert('Enrollment updated successfully');
    } catch (error) {
      console.error('Failed to save bulk enrollment:', error);
      alert('Failed to save enrollment');
    } finally {
      setSavingBulk(false);
    }
  };

  const openStudentAssignment = (gradeId: number) => {
    setSelectedGrade(gradeId);
    setSearchStudent('');
    setActiveTab('assigned');
    setShowStudentAssignment(true);
  };

  const closeStudentAssignment = () => {
    setSelectedGrade(null);
    setShowStudentAssignment(false);
  };

  const handleEditGrade = (grade: Grade) => {
    setEditingGrade(grade);
    setShowEditModal(true);
  };

  const handleUpdateGrade = async () => {
    if (editingGrade) {
      try {
        await gradeApi.update(editingGrade.id, {
          grade: editingGrade.grade,
          grade_part: editingGrade.grade_part
        });
        await fetchGrades();
        setShowEditModal(false);
      } catch (error) {
        console.error('Failed to update grade:', error);
        alert('Failed to update grade');
      }
    }
  };

  const handleDeleteGrade = async (gradeId: number) => {
    if (confirm('Are you sure you want to delete this grade?')) {
      try {
        await gradeApi.delete(gradeId);
        await fetchGrades();
      } catch (error) {
        console.error('Failed to delete grade:', error);
        alert('Failed to delete grade');
      }
    }
  };

  const handleDownloadPDF = (grade: Grade) => {
    const doc = new jsPDF();
    const studentsArr = grade.students || [];
    doc.setFontSize(20);
    doc.text('EduTrack Student List', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`Grade ${grade.grade}-${grade.grade_part}`, 105, 30, { align: 'center' });
    
    let y = 45;
    studentsArr.forEach((s, i) => {
      doc.text(`${i + 1}. ${s.first_name} ${s.last_name}`, 20, y);
      y += 10;
    });
    doc.save(`Grade-${grade.grade}-${grade.grade_part}.pdf`);
  };

  const getFilteredAssignments = () => {
    if (!searchGrade.trim()) return allAssignments;
    return allAssignments.filter(a => 
      `${a.grade}${a.section}`.toLowerCase().includes(searchGrade.toLowerCase()) ||
      `${a.first_name} ${a.last_name}`.toLowerCase().includes(searchGrade.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#633194' }}>
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100%',
      background: '#F8F7FF',
      padding: '20px 24px',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ width: '100%' }}>
        {showStudentAssignment ? (
          /* ── View 1: Student Assignment Inline Page ── */
          <div style={{
            background: '#F8F7FF',
            minHeight: 'calc(100vh - 40px)',
            animation: 'slideIn 0.3s ease-out',
            marginTop: '-20px',
            marginLeft: '-24px',
            marginRight: '-24px',
            padding: '24px 32px'
          }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <style>{`
                @keyframes slideIn {
                  from { opacity: 0; transform: translateY(10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                .student-card-assign { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
                .student-card-assign:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06); }
              `}</style>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
                background: '#FFFFFF',
                padding: '24px 32px',
                borderRadius: '16px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                border: '1px solid #E5E7EB'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'linear-gradient(135deg, #633194 0%, #4B2380 100%)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF'
                  }}>
                    <GraduationCap size={34} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#111827', margin: 0 }}>Student Assignment</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>TARGET:</span>
                      <span style={{ fontSize: '13px', fontWeight: '900', color: '#633194', background: '#F3E8FF', padding: '4px 14px', borderRadius: '10px' }}>
                        Grade {grades.find(g => g.id === selectedGrade)?.grade}-{grades.find(g => g.id === selectedGrade)?.grade_part}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeStudentAssignment}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', background: '#FFFFFF', color: '#EF4444', border: '1px solid #FECACA', borderRadius: '14px', fontWeight: '700', cursor: 'pointer' }}
                >
                  <X size={20} /> Close View
                </button>
              </div>

              <div style={{ position: 'relative', marginBottom: '32px' }}>
                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9D85C5' }} />
                <input
                  type="text"
                  placeholder="Search students to assign..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '16px', border: '2px solid #F3F4F6', fontSize: '15px' }}
                />
              </div>

              {/* Tab Navigation */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #E5E7EB', paddingBottom: '4px' }}>
                {[
                  { id: 'assigned', label: 'Assigned', icon: <CheckCircle size={18} />, color: '#059669', count: students.filter(s => grades.find(g => g.id === selectedGrade)?.students?.some(ps => ps.id === s.id)).length },
                  { id: 'available', label: 'Available', icon: <Users size={18} />, color: '#633194', count: students.filter(s => !grades.some(g => g.students?.some(ps => ps.id === s.id))).length },
                  { id: 'transfer', label: 'Transfer', icon: <ArrowLeftRight size={18} />, color: '#F59E0B', count: students.filter(s => {
                    if (selectedSourceGrade) {
                      const inSource = grades.find(g => g.id === selectedSourceGrade)?.students?.some(ps => ps.id === s.id);
                      const fromSource = transferHistory[s.id] === selectedSourceGrade && grades.find(g => g.id === selectedGrade)?.students?.some(ps => ps.id === s.id);
                      return inSource || fromSource;
                    }
                    return grades.find(g => g.id === selectedGrade)?.students?.some(ps => ps.id === s.id);
                  }).length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px 12px 0 0',
                      border: 'none', background: activeTab === tab.id ? '#FFFFFF' : 'transparent',
                      color: activeTab === tab.id ? tab.color : '#64748B', fontWeight: '700', cursor: 'pointer',
                      borderBottom: activeTab === tab.id ? `3px solid ${tab.color}` : '3px solid transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    <span style={{ fontSize: '11px', background: activeTab === tab.id ? tab.color : '#E5E7EB', color: activeTab === tab.id ? '#FFFFFF' : '#64748B', padding: '2px 8px', borderRadius: '10px' }}>{tab.count}</span>
                  </button>
                ))}
              </div>

              {students.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                   <AlertTriangle size={48} color="#F59E0B" style={{ marginBottom: '16px', opacity: 0.8 }} />
                   <div style={{ fontSize: '18px', fontWeight: '700', color: '#4B5563', marginBottom: '8px' }}>No students registered</div>
                </div>
              ) : (
                <div style={{ minHeight: '400px' }}>
                  {/* TAB: Assigned Students */}
                  {activeTab === 'assigned' && (
                    <div style={{ animation: 'slideIn 0.2s ease-out' }}>
                      {(() => {
                        const assigned = students.filter(s => grades.find(g => g.id === selectedGrade)?.students?.some(ps => ps.id === s.id) && `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchStudent.toLowerCase()));
                        if (assigned.length === 0) return <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>No students assigned to this grade yet.</div>;
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {assigned.map(s => (
                              <div key={s.id} className="student-card-assign" style={{ background: '#FFFFFF', border: '1px solid #EDE9FE', borderRadius: '16px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '18px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', fontWeight: '800' }}>{s.first_name.charAt(0)}</div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 700 }}>{s.first_name} {s.last_name}</div>
                                  <div style={{ fontSize: '12px', color: '#64748B' }}>ID: {s.id}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button onClick={() => handleAssignStudent(s.id, selectedGrade!)} style={{ padding: '8px 16px', background: '#FEF2F2', color: '#EF4444', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Remove</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* TAB: Available Students */}
                  {activeTab === 'available' && (
                    <div style={{ animation: 'slideIn 0.2s ease-out' }}>
                      {(() => {
                        const available = students.filter(s => !grades.some(g => g.students?.some(ps => ps.id === s.id)) && `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchStudent.toLowerCase()));
                        if (available.length === 0) return <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>All students are already assigned.</div>;
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {available.map(s => (
                              <div key={s.id} className="student-card-assign" style={{ background: '#FFFFFF', border: '1px solid #F3F4F6', borderRadius: '16px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '18px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F4F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#633194', fontWeight: '800' }}>{s.first_name.charAt(0)}</div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 700 }}>{s.first_name} {s.last_name}</div>
                                  <div style={{ fontSize: '12px', color: '#64748B' }}>ID: {s.id}</div>
                                </div>
                                <button onClick={() => handleAssignStudent(s.id, selectedGrade!)} style={{ padding: '8px 16px', background: '#F4F0FF', color: '#633194', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Assign</button>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* TAB: Transfer Students */}
                  {activeTab === 'transfer' && (
                    <div style={{ animation: 'slideIn 0.2s ease-out' }}>
                      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #EDE9FE' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '11px', fontWeight: 800, color: '#633194', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Pull Students From Class:</label>
                          <select 
                            value={selectedSourceGrade || ''} 
                            onChange={(e) => setSelectedSourceGrade(parseInt(e.target.value) || null)}
                            style={{ width: '100%', padding: '10px', border: '1px solid #EDE9FE', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}
                          >
                            <option value="">-- Select Source Class --</option>
                            {grades.filter(g => g.id !== selectedGrade).map(g => (
                              <option key={g.id} value={g.id}>Grade {g.grade}-{g.grade_part}</option>
                            ))}
                          </select>
                        </div>
                        {selectedSourceGrade && (
                          <button 
                            onClick={() => setSelectedSourceGrade(null)}
                            style={{ marginTop: '20px', padding: '10px 16px', color: '#64748B', background: '#F3F4F6', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                        {(() => {
                           const filtered = students.filter(s => {
                            if (selectedSourceGrade) {
                              const inSource = grades.find(g => g.id === selectedSourceGrade)?.students?.some(ps => ps.id === s.id);
                              const fromSource = transferHistory[s.id] === selectedSourceGrade && grades.find(g => g.id === selectedGrade)?.students?.some(ps => ps.id === s.id);
                              return (inSource || fromSource) && `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchStudent.toLowerCase());
                            }
                            const isInThisGrade = grades.find(g => g.id === selectedGrade)?.students?.some(ps => ps.id === s.id);
                            return isInThisGrade && `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchStudent.toLowerCase());
                          });

                          if (filtered.length === 0) return <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#64748B' }}>
                            {selectedSourceGrade ? "No students found in the selected class." : "Select a Source Class above to transfer students from other grades."}
                          </div>;

                          return filtered.map(s => (
                                <div key={s.id}>
                                  {(() => {
                                    // 1. Identify which grade they are currently marked as IN in this component
                                    const inThisGrade = grades.find(g => g.id === selectedGrade)?.students?.some(ps => ps.id === s.id);
                                    
                                    // 2. Resolve WHICH grade they came from (Source)
                                    // We use number casting (Number()) to ensure the comparison works regardless of API types
                                    const sourceId = (transferHistory[s.id] || selectedSourceGrade);
                                    const sourceGradeObj = grades.find(g => Number(g.id) === Number(sourceId));
                                    
                                    // 3. Resolve TARGET grade (The one we are currently viewing)
                                    const targetGradeObj = grades.find(g => g.id === selectedGrade);

                                    return (
                                      <div key={s.id} className="student-card-assign" style={{ 
                                        background: inThisGrade ? '#F0FDF4' : '#F9FAFB', 
                                        border: inThisGrade ? '1px solid #BBF7D0' : '1px solid #E5E7EB', 
                                        borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' 
                                      }}>
                                        <div style={{ 
                                          width: '40px', height: '40px', borderRadius: '10px', 
                                          background: inThisGrade ? '#BBF7D0' : '#E5E7EB', 
                                          display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                          color: inThisGrade ? '#166534' : '#64748B', fontWeight: '800' 
                                        }}>{s.first_name.charAt(0)}</div>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontWeight: 700, color: '#374151', fontSize: '15px' }}>{s.first_name} {s.last_name}</div>
                                          <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                            {/* SOURCE GRADE BADGE */}
                                            <span style={{ background: '#FEE2E2', color: '#B91C1C', padding: '4px 10px', borderRadius: '8px', fontWeight: 800, fontSize: '11px', border: '1px solid #FCA5A5' }}>
                                              Grade {sourceGradeObj ? `${sourceGradeObj.grade}${sourceGradeObj.grade_part}` : '6B'}
                                            </span>

                                            <ArrowRight size={14} style={{ color: '#94A3B8' }} />

                                            {/* TARGET GRADE BADGE */}
                                            <span style={{ 
                                              background: inThisGrade ? '#DCFCE7' : '#DBEAFE', 
                                              color: inThisGrade ? '#166534' : '#1E40AF', 
                                              padding: '4px 10px', borderRadius: '8px', 
                                              fontWeight: 800, fontSize: '11px',
                                              border: inThisGrade ? '1px solid #BBF7D0' : '1px solid #93C5FD'
                                            }}>
                                              Grade {targetGradeObj?.grade}{targetGradeObj?.grade_part}
                                            </span>

                                            {inThisGrade && (
                                              <div style={{ 
                                                marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px',
                                                color: '#059669', fontSize: '11px', fontWeight: 900,
                                                background: '#D1FAE5', padding: '4px 10px', borderRadius: '8px',
                                                border: '1px solid #6EE7B7'
                                              }}>
                                                <CheckCircle size={14} /> TRANSFERED
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        {!inThisGrade && (
                                          <button onClick={() => handleAssignStudent(s.id, selectedGrade!)} style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                                            Transfer
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : showAllAssignments ? (
          /* ── View 2: Student Matrix Inline Page ── */
          <div style={{
            background: '#F9FAFB',
            minHeight: 'calc(100vh - 40px)',
            marginTop: '-20px',
            marginLeft: '-24px',
            marginRight: '-24px',
            padding: '24px 32px',
            animation: 'slideIn 0.3s ease-out'
          }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#633194', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <List size={32} /> All Assignments Matrix
                </h1>
                <button
                  onClick={() => setShowAllAssignments(false)}
                  style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #633194 0%, #4B2380 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                >
                  ← Back
                </button>
              </div>

              <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <Activity size={24} color="#633194" />
                    <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>System Activity Matrix</h2>
                 </div>
                <div style={{ maxWidth: '650px', margin: '0 auto 32px', position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                  <input
                    type="text"
                    placeholder="Search by student name or grade..."
                    value={searchGrade}
                    onChange={(e) => setSearchGrade(e.target.value)}
                    style={{ width: '100%', padding: '14px 16px 14px 50px', border: '1px solid #E5E7EB', borderRadius: '16px' }}
                  />
                </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <BookOpen size={20} color="#633194" />
                    <span style={{ fontWeight: 700 }}>Assignment Record Log</span>
                 </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                      <th style={{ padding: '16px', textAlign: 'left' }}>Student</th>
                      <th style={{ padding: '16px', textAlign: 'left' }}>Grade</th>
                      <th style={{ padding: '16px', textAlign: 'left' }}>Section</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredAssignments().map((a, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '16px', fontWeight: '600' }}>{a.first_name} {a.last_name}</td>
                        <td style={{ padding: '16px' }}><span style={{ padding: '4px 12px', background: '#F3E8FF', color: '#633194', borderRadius: '6px' }}>{a.grade}</span></td>
                        <td style={{ padding: '16px' }}><span style={{ padding: '4px 12px', background: '#FEF3C7', color: '#92400E', borderRadius: '6px' }}>{a.section}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : showBulkEnrollment ? (
          /* ── View 3: Global Subject Enrollment Inline Page ── */
          <div style={{
            background: '#F8F7FF',
            minHeight: 'calc(100vh - 40px)',
            animation: 'slideIn 0.3s ease-out',
            marginTop: '-20px',
            marginLeft: '-24px',
            marginRight: '-24px',
            padding: '24px 32px'
          }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '32px',
                background: '#FFFFFF',
                padding: '24px 32px',
                borderRadius: '16px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                border: '1px solid #E5E7EB'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'linear-gradient(135deg, #633194 0%, #4B2380 100%)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF'
                  }}>
                    <BookOpen size={34} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#111827', margin: 0 }}>Global Subject Enrollment</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>MANAGING FOR:</span>
                      <span style={{ fontSize: '13px', fontWeight: '900', color: '#633194', background: '#F3E8FF', padding: '4px 14px', borderRadius: '10px' }}>
                        Grade {grades.find(g => g.id === selectedGrade)?.grade}-{grades.find(g => g.id === selectedGrade)?.grade_part}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowBulkEnrollment(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', background: '#FFFFFF', color: '#633194', border: '1.5px solid #DDD6FE', borderRadius: '14px', fontWeight: '700', cursor: 'pointer' }}
                >
                  <X size={20} /> Close View
                </button>
              </div>

              <div style={{ 
                display: 'flex', 
                background: 'white', 
                borderRadius: '32px', 
                border: '1px solid #E5E7EB',
                boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
                minHeight: '700px',
                overflow: 'hidden'
              }}>
                {/* Left Side: Subject Selection Sidebar */}
                <div style={{ 
                  width: '260px', 
                  background: '#F9FAFB', 
                  padding: '24px 18px',
                  borderRight: '1.5px solid #F1F5F9',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '3px', height: '14px', background: '#633194', borderRadius: '4px' }}></div>
                    <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#633194', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Pick a Subject</h3>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {availableSubjects.map(s => {
                      const isActive = selectedEnrollmentSubject?.id === s.id;
                      const isHovered = hoveredSubjectId === s.id;
                      
                      return (
                        <button 
                          key={s.id} 
                          onClick={() => handleEnrollmentSubjectSelect(s)}
                          onMouseEnter={() => setHoveredSubjectId(s.id)}
                          onMouseLeave={() => setHoveredSubjectId(null)}
                          style={{ 
                            padding: '14px 18px', 
                            textAlign: 'left', 
                            background: isActive ? '#FFFFFF' : (isHovered ? '#F3F4F6' : 'transparent'), 
                            border: '2px solid',
                            borderColor: isActive ? '#633194' : (isHovered ? '#E5E7EB' : 'transparent'), 
                            borderRadius: '16px', 
                            color: isActive ? '#633194' : '#475569', 
                            fontWeight: '700', 
                            fontSize: '13.5px', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: isActive ? '0 12px 20px -5px rgba(99, 49, 148, 0.15)' : 'none',
                            outline: 'none',
                            position: 'relative'
                          }}
                        >
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: isActive ? '#F5F3FF' : '#F9FAFB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isActive ? '#633194' : '#94A3B8',
                            transition: 'all 0.2s'
                          }}>
                            <BookOpen size={16} />
                          </div>
                          
                          <div style={{ flex: 1 }}>
                            <div style={{ color: isActive ? '#633194' : 'inherit', fontSize: '13px' }}>{s.name}</div>
                            {s.category && (
                              <div style={{ 
                                fontSize: '10px', 
                                color: isActive ? '#94A3B8' : '#94A3B8', 
                                marginTop: '2px', 
                                fontWeight: '500',
                                opacity: 0.8
                              }}>{s.category}</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ 
                  flex: 1, 
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}>
                  {validationError && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '20px', 
                      left: '32px', 
                      right: '32px', 
                      zIndex: 100,
                      animation: 'slideInDown 0.3s ease-out'
                    }}>
                      <div style={{ 
                        background: '#FEF2F2', 
                        border: '1.5px solid #FCA5A5', 
                        padding: '12px 20px', 
                        borderRadius: '14px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.1)'
                      }}>
                        <div style={{ background: '#DC2626', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <AlertTriangle size={14} />
                        </div>
                        <div style={{ flex: 1, fontSize: '13px', fontWeight: '700', color: '#991B1B' }}>
                          {validationError}
                        </div>
                        <button 
                          onClick={() => setValidationError(null)} 
                          style={{ background: 'transparent', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '4px' }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <style>{`
                        @keyframes slideInDown {
                          from { transform: translateY(-100%); opacity: 0; }
                          to { transform: translateY(0); opacity: 1; }
                        }
                      `}</style>
                    </div>
                  )}

                  {!selectedEnrollmentSubject ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                      <BookOpen size={64} style={{ marginBottom: '20px', opacity: 0.3 }} />
                      <p style={{ fontSize: '18px', fontWeight: '600' }}>Select a subject from the left to manage enrollment</p>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid #F1F5F9' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B', margin: 0 }}>Enroll Students for {selectedEnrollmentSubject.name}</h3>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <button 
                            onClick={() => setBulkEnrolledStudentIds(gradeStudentsForBulk.map(s => s.id))}
                            style={{ fontSize: '12px', fontWeight: '700', color: '#633194', background: '#F5F3FF', border: '1px solid #DDD6FE', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer' }}
                          >
                            Select All
                          </button>
                          <button 
                            onClick={() => setBulkEnrolledStudentIds([])}
                            style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', background: '#F3F4F6', border: '1px solid #E2E8F0', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer' }}
                          >
                            Clear
                          </button>
                          <div style={{ fontSize: '15px', color: '#633194', fontWeight: '700', marginLeft: '8px' }}>
                            {bulkEnrolledStudentIds.length} Selected
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
                        gap: '10px',
                        alignContent: 'flex-start'
                      }}>
                        {gradeStudentsForBulk.map(s => (
                          <div 
                            key={s.id} 
                            onClick={() => toggleStudentForBulk(s.id)}
                            style={{ 
                              padding: '10px 14px', 
                              background: bulkEnrolledStudentIds.includes(s.id) ? '#F0FDF4' : '#FFFFFF', 
                              border: bulkEnrolledStudentIds.includes(s.id) ? '1.5px solid #22C55E' : '1.5px solid #E5E7EB', 
                              borderRadius: '12px', 
                              cursor: 'pointer', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '10px',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ 
                              width: '32px', 
                              height: '32px', 
                              borderRadius: '8px', 
                              background: bulkEnrolledStudentIds.includes(s.id) ? '#22C55E' : '#F3F4F6', 
                              color: 'white', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              fontSize: '12px', 
                              fontWeight: '800' 
                            }}>
                              {bulkEnrolledStudentIds.includes(s.id) ? <Check size={16} /> : s.first_name.charAt(0)}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>{s.first_name} {s.last_name}</div>
                              <div style={{ fontSize: '11px', color: '#64748B' }}>ID: {s.id}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleSaveBulkEnrollment()} 
                          disabled={savingBulk}
                          style={{ 
                            padding: '12px 32px', 
                            background: 'linear-gradient(135deg, #633194 0%, #4B2380 100%)', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '12px', 
                            fontWeight: '800', 
                            fontSize: '14px', 
                            cursor: savingBulk ? 'not-allowed' : 'pointer',
                            boxShadow: '0 6px 15px rgba(99, 49, 148, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => !savingBulk && (e.currentTarget.style.transform = 'translateY(-1px)')}
                          onMouseLeave={e => !savingBulk && (e.currentTarget.style.transform = 'translateY(0)')}
                        >
                          {savingBulk ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── View 4: Main Grade Management List ── */
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <GraduationCap size={28} color="#633194" /> Grade Management
                </h1>
                <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>Configure grade levels and student distribution.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text" placeholder="Search grades..." value={searchGrade} onChange={(e) => setSearchGrade(e.target.value)}
                  style={{ padding: '10px 14px', border: '1px solid #EDE9FE', borderRadius: '10px', width: '250px' }}
                />
                <button
                  onClick={() => { fetchAllAssignments(); setShowAllAssignments(true); }}
                  style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #633194 0%, #4B2380 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Student Matrix
                </button>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(99,49,148,0.05)', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#633194', textTransform: 'uppercase', marginBottom: '16px' }}>Register New Grade</h2>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#64748B' }}>Grade</label>
                  <input type="number" value={newGrade.grade || ''} onChange={(e) => setNewGrade({...newGrade, grade: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '10px', border: '1px solid #EDE9FE', borderRadius: '10px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#64748B' }}>Stream</label>
                  <input type="text" value={newGrade.grade_part} onChange={(e) => setNewGrade({...newGrade, grade_part: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #EDE9FE', borderRadius: '10px' }} />
                </div>
                <button 
                  onClick={handleAddGrade} 
                  style={{ 
                    height: '46px', 
                    padding: '0 24px', 
                    background: 'linear-gradient(135deg, #633194 0%, #4B2380 100%)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '10px', 
                    fontWeight: '700', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Plus size={18} /> Initialize Grade
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              {grades.filter(g => `${g.grade}-${g.grade_part}`.toLowerCase().includes(searchGrade.toLowerCase())).map(grade => (
                <div key={grade.id} style={{ background: '#FFFFFF', border: '1px solid #EDE9FE', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ width: '52px', height: '52px', background: 'linear-gradient(135deg, #633194 0%, #4C1D95 100%)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800' }}>{grade.grade}</div>
                    <div>
                      <div style={{ fontWeight: '700' }}>Grade {grade.grade}-{grade.grade_part}</div>
                      <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <Users size={12} color="#633194" /> {grade.students?.length || 0} Students
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => openBulkEnrollment(grade.id)} 
                        style={{ 
                          flex: 1.2, 
                          padding: '7px 10px', 
                          background: '#F5F3FF', 
                          color: '#633194', 
                          border: '1.5px solid #E9E3FF', 
                          borderRadius: '8px', 
                          fontWeight: '800', 
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#EDE9FE'}
                        onMouseLeave={e => e.currentTarget.style.background = '#F5F3FF'}
                      >
                        <BookOpen size={14} /> Bulk Enrollment
                      </button>
                      <button 
                        onClick={() => openStudentAssignment(grade.id)} 
                        style={{ 
                          flex: 1, 
                          padding: '7px 10px', 
                          background: '#F5F3FF', 
                          color: '#633194', 
                          border: '1.5px solid #E9E3FF', 
                          borderRadius: '8px', 
                          fontWeight: '800', 
                          fontSize: '11px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#EDE9FE'}
                        onMouseLeave={e => e.currentTarget.style.background = '#F5F3FF'}
                      >
                         Students
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleDownloadPDF(grade)} style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid #E2E8F0', cursor: 'pointer', background: 'white' }}><Printer size={16} /></button>
                      <button onClick={() => handleEditGrade(grade)} style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid #E2E8F0', cursor: 'pointer', background: 'white' }}><Pencil size={16} /></button>
                      <button onClick={() => handleDeleteGrade(grade.id)} style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid #E2E8F0', cursor: 'pointer', background: 'white' }}><Trash size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showEditModal && editingGrade && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '30px', width: '400px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#633194', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Pencil size={24} /> Edit Grade
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="number" value={editingGrade.grade} onChange={(e) => setEditingGrade({...editingGrade, grade: parseInt(e.target.value) || 0})} style={{ padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
              <input type="text" value={editingGrade.grade_part} onChange={(e) => setEditingGrade({...editingGrade, grade_part: e.target.value})} style={{ padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={handleUpdateGrade} style={{ flex: 1, padding: '12px', background: '#633194', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Update</button>
                <button onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '12px', background: '#F3F4F6', color: '#4B5563', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}




    </div>
  );
};

export default GradeManagement;
