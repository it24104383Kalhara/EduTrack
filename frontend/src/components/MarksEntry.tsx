import React, { useState, useEffect } from 'react'; 
import { Pencil, Trash2, X } from 'lucide-react'; 
import { subjectApi, marksApi } from '../services/api';
import type { Grade, Subject, Mark } from '../services/api';

interface MarksEntryProps {
  grade: Grade;
  term: string;
  onBack: () => void;
}

const MarksEntry: React.FC<MarksEntryProps> = ({ grade, term, onBack }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const [saving, setSaving] = useState(false);
  const [sendingReports, setSendingReports] = useState(false);
  const [editingRows, setEditingRows] = useState<Record<number, boolean>>({});
  
  // Marks state: Map studentId -> Mark object
  const [marksData, setMarksData] = useState<Record<number, Partial<Mark>>>({});
  const [enrolledStudentIds, setEnrolledStudentIds] = useState<number[] | null>(null);

  useEffect(() => {
    fetchSubjects();
  }, [grade.id]);

  const fetchSubjects = async () => {
    try {
      const allSubjects = await subjectApi.getAll();
      
      // Filter subjects applicable to this grade
      // Backend stores grades as string array or JSON string
      const gradeStr = grade.grade.toString();
      const applicableSubjects = allSubjects.filter(sub => {
        if (!sub.grades) return false;
        let subGrades: string[] = [];
        if (Array.isArray(sub.grades)) {
          subGrades = sub.grades.flatMap(g => {
            if (typeof g === 'string' && g.startsWith('[')) {
              try { return JSON.parse(g); } catch { return g; }
            }
            return g;
          });
        } else if (typeof sub.grades === 'string' && sub.grades.startsWith('[')) {
          try { subGrades = JSON.parse(sub.grades); } catch { subGrades = [sub.grades]; }
        } else {
          subGrades = [sub.grades as string];
        }
        return subGrades.includes(gradeStr);
      });
      
      setSubjects(applicableSubjects);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const handleSubjectSelect = async (subject: Subject) => {
    setSelectedSubject(subject);
    try {
      // Fetch existing marks for this grade/subject/term
      const marks = await marksApi.getByGradeSubjectTerm(grade.id!, subject.id, term);
      
      // If subject is optional or belongs to a bucket (category), fetch enrolled students
      let studentList = grade.students || [];
      if (subject.is_optional || subject.category) {
        const enrollment = await subjectApi.getSubjectEnrollment(subject.id, grade.id!);
        const ids = enrollment.map((e: any) => e.student_id);
        setEnrolledStudentIds(ids);
        studentList = (grade.students || []).filter(s => ids.includes(s.id));
      } else {
        setEnrolledStudentIds(null);
      }

      // Initialize marksData with existing or default values
      const initialMarks: Record<number, Partial<Mark>> = {};
      studentList.forEach(student => {
        const existing = marks.find(m => m.student_id === student.id);
        if (existing) {
          initialMarks[student.id] = {
            id: existing.id,
            marks_obtained: existing.marks_obtained,
            max_marks: 100,
            exam_type: 'final_term',
            remarks: existing.remarks || '',
            exam_date: existing.exam_date.split('T')[0] // Format for date input
          };
        } else {
          initialMarks[student.id] = {
            marks_obtained: '',
            max_marks: 100,
            exam_type: 'final_term',
            remarks: '',
            exam_date: new Date().toISOString().split('T')[0]
          };
        }
      });
      setMarksData(initialMarks);
      setEditingRows({});
    } catch (error) {
      console.error('Failed to fetch existing marks:', error);
    }
  };

  const handleMarkChange = (studentId: number, field: keyof Mark, value: any) => {
    setMarksData(prev => {
      const updatedData = {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [field]: value
        }
      };
      
      if (field === 'marks_obtained') {
        updatedData[studentId] = {
          ...updatedData[studentId],
          remarks: getAutoRemark(String(value))
        };
      }
      
      return updatedData;
    });
  };


  const handleSave = async () => {
    if (!selectedSubject) return;
    
    // Validate: check if any student has marks_obtained but not max_marks or vice versa
    const studentsToSave = grade.students?.filter(s => {
      const m = marksData[s.id];
      return m && m.marks_obtained !== '';
    }) || [];

    if (studentsToSave.length === 0) {
      alert('No marks entered to save.');
      return;
    }

    try {
      setSaving(true);
      const dataToSave = studentsToSave.map(s => {
        const m = marksData[s.id];
        
        // Validate individual mark
        if (m.marks_obtained !== 'AB') {
          const val = Number(m.marks_obtained);
          if (isNaN(val) || val < 0 || val > 100) {
            throw new Error(`Invalid mark for student: ${s.first_name}. Must be between 0 and 100 or 'AB'.`);
          }
        }

        return {
          student_id: s.id,
          subject_id: selectedSubject.id,
          grade_id: grade.id!,
          term: term,
          exam_type: m.exam_type || 'final_term',
          marks_obtained: m.marks_obtained === 'AB' ? 'AB' : Number(m.marks_obtained),
          max_marks: Number(m.max_marks) || 100,
          remarks: m.remarks || '',
          exam_date: m.exam_date || new Date().toISOString().split('T')[0]
        } as Omit<Mark, 'id' | 'grade_obtained' | 'created_at' | 'updated_at'>;
      });

      const result = await marksApi.bulkCreate(dataToSave);
      
      if (result.errors && result.errors.length > 0) {
        console.error('Errors saving some marks:', result.errors);
        alert(`Saved ${result.created.length} marks. Errors encountered for ${result.errors.length} students.`);
      } else {
        alert('All marks saved successfully!');
      }
      
      // Refresh existing marks
      handleSubjectSelect(selectedSubject);
    } catch (error: any) {
      console.error('Failed to save marks:', error);
      alert(error.message || 'Failed to save marks. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendReports = async () => {
    if (!window.confirm(`Send consolidated low marks reports for all students in Grade ${grade.grade}-${grade.grade_part} for ${term}?`)) {
      return;
    }
    
    try {
      setSendingReports(true);
      await marksApi.sendTermReports(grade.id!, term);
      alert('Consolidated reports sent successfully to all parents!');
    } catch (error: any) {
      console.error('Failed to send reports:', error);
      alert(error.message || 'Failed to send reports.');
    } finally {
      setSendingReports(false);
    }
  };

  const handleDeleteMark = async (studentId: number) => {
    const markId = marksData[studentId]?.id;
    if (!markId) return; 
    
    if (!window.confirm('Are you sure you want to delete this mark?')) return;
    
    try {
      await marksApi.delete(markId);
      // Reset local state for this student
      setMarksData(prev => ({
        ...prev,
        [studentId]: {
          marks_obtained: '',
          max_marks: 100,
          exam_type: 'final_term',
          remarks: '',
          exam_date: new Date().toISOString().split('T')[0]
        }
      }));
      setEditingRows(prev => ({...prev, [studentId]: false}));
    } catch (error: any) {
      console.error('Failed to delete mark:', error);
      alert('Failed to delete mark');
    }
  };

  // Helper to get grade badge text and color based on mark
  const getGradeInfo = (markStr: string) => {
    if (markStr === 'AB') return { text: 'AB', color: '#EF4444' };
    const m = Number(markStr);
    if (isNaN(m) || markStr === '') return null;
    if (m >= 75) return { text: 'A', color: '#10B981' };
    if (m >= 65) return { text: 'B', color: '#3B82F6' };
    if (m >= 55) return { text: 'C', color: '#F59E0B' };
    if (m >= 40) return { text: 'S', color: '#8B5CF6' };
    return { text: 'F', color: '#EF4444' };
  };

  const getAutoRemark = (markStr: string) => {
    if (markStr === 'AB') return 'Absent';
    const m = parseInt(markStr);
    if (isNaN(m)) return '';
    if (m >= 90) return 'Excellent';
    if (m >= 80) return 'Very Good';
    if (m >= 75) return 'Good';
    if (m >= 70) return 'Satisfaction';
    if (m >= 40) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <div style={{ padding: '0px', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#5B21B6', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📝 Marks Entry - {grade.grade}-{grade.grade_part} • {term}
          </h1>
          <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>
            {grade.students?.length || 0} students • {subjects.length} subjects
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleSendReports} 
            disabled={sendingReports}
            style={{ background: '#EF4444', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', border: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: sendingReports ? 'wait' : 'pointer' }}>
            {sendingReports ? 'Sending...' : '📧 Send Emails'}
          </button>

          <button onClick={onBack} style={{ background: '#4B5563', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', border: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            ← Back to Grades
          </button>
        </div>
      </div>

      {/* Subjects Banner */}
      <div style={{ background: '#F5F3FF', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#5B21B6', textAlign: 'center', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          📚 Select Subject
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          {subjects.map(subject => (
            <button
              key={subject.id}
              onClick={() => handleSubjectSelect(subject)}
              style={{
                background: selectedSubject?.id === subject.id ? '#5B21B6' : 'white',
                color: selectedSubject?.id === subject.id ? 'white' : '#111827',
                border: selectedSubject?.id === subject.id ? 'none' : '1px solid #E5E7EB',
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                minWidth: '140px'
              }}
            >
              {subject.name}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Subject Form */}
      {selectedSubject && (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#5B21B6', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#5B21B6', fontWeight: '700' }}>{selectedSubject.code}</span>
                {selectedSubject.name}
              </h2>
              <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>
                Enter marks for {enrolledStudentIds ? enrolledStudentIds.length : (grade.students?.length || 0)} students
              </p>
            </div>
            <button
               onClick={handleSave}
               disabled={saving}
               style={{ background: '#10B981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {saving ? 'Saving...' : '💾 Save Marks'}
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '16px', fontSize: '14px', fontWeight: '700', color: '#374151' }}>Student</th>
                <th style={{ padding: '16px', fontSize: '14px', fontWeight: '700', color: '#374151', width: '250px' }}>Marks</th>
                <th style={{ padding: '16px', fontSize: '14px', fontWeight: '700', color: '#374151' }}>Remarks</th>
                <th style={{ padding: '16px', fontSize: '14px', fontWeight: '700', color: '#374151', width: '150px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {grade.students?.filter(s => !enrolledStudentIds || enrolledStudentIds.includes(s.id)).map((student) => {
                const markValue = marksData[student.id]?.marks_obtained ?? '';
                const isAb = markValue === 'AB';
                const gradeInfo = getGradeInfo(String(markValue));
                
                const hasExistingMark = !!marksData[student.id]?.id;
                const isEditing = !hasExistingMark || editingRows[student.id];
                
                return (
                  <tr key={student.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#5B21B6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px' }}>
                          {student.first_name[0]}{student.last_name[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: '#374151', fontSize: '14px' }}>{student.first_name} {student.last_name}</div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>ID: {student.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="text"
                              disabled={!isEditing || isAb}
                              value={isAb ? '' : markValue}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || (!isNaN(Number(val)) && Number(val) <= 100)) {
                                  handleMarkChange(student.id, 'marks_obtained', val);
                                }
                              }}
                              style={{ width: '60px', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px', textAlign: 'center', outline: 'none', background: (!isEditing || isAb) ? '#FAFAFA' : 'white', cursor: !isEditing ? 'not-allowed' : 'text', color: '#111827', WebkitTextFillColor: (!isEditing || isAb) ? '#4B5563' : '#111827', opacity: 1 }}
                            />
                            <span style={{ color: '#9CA3AF', fontSize: '12px' }}>/100</span>
                          </div>
                          {gradeInfo && !isAb && (
                            <div style={{ fontSize: '11px', fontWeight: '700', color: gradeInfo.color, textAlign: 'center', width: '60px' }}>
                              {gradeInfo.text}
                            </div>
                          )}
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: !isEditing ? 'not-allowed' : 'pointer', fontSize: '13px', color: '#6B7280' }}>
                          <input 
                            type="checkbox"
                            checked={isAb}
                            disabled={!isEditing}
                            onChange={(e) => handleMarkChange(student.id, 'marks_obtained', e.target.checked ? 'AB' : '')}
                            style={{ width: '14px', height: '14px', accentColor: '#5B21B6', cursor: !isEditing ? 'not-allowed' : 'pointer' }}
                          />
                          AB
                        </label>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={marksData[student.id]?.remarks || ''}
                        onChange={(e) => handleMarkChange(student.id, 'remarks', e.target.value)}
                        style={{ width: '100%', maxWidth: '250px', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', outline: 'none', fontSize: '14px', color: '#374151', background: !isEditing ? '#FAFAFA' : 'white', cursor: !isEditing ? 'not-allowed' : 'text', WebkitTextFillColor: !isEditing ? '#6B7280' : '#374151', opacity: 1 }}
                      />
                      <div style={{ fontSize: '11px', color: '#9CA3AF', fontStyle: 'italic', marginTop: '4px' }}>
                        Optional feedback for student
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                        {hasExistingMark && !isEditing ? (
                          <button title="Edit Mark" onClick={() => setEditingRows(prev => ({...prev, [student.id]: true}))} style={{ background: '#5B21B6', color: 'white', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Pencil size={14} />
                          </button>
                        ) : hasExistingMark && isEditing ? (
                          <button title="Cancel Edit" onClick={() => setEditingRows(prev => ({...prev, [student.id]: false}))} style={{ background: '#4B5563', color: 'white', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={14} />
                          </button>
                        ) : null}
                        
                        {hasExistingMark && (
                          <button title="Delete Mark" onClick={() => handleDeleteMark(student.id)} style={{ background: '#EF4444', color: 'white', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MarksEntry;
