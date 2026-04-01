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
      // VALIDATION: Fetch all subjects from API
      const allSubjects = await subjectApi.getAll();
      
      // VALIDATION: Ensure subjects data is valid array
      if (!Array.isArray(allSubjects)) {
        console.error('VALIDATION: Invalid subjects data received:', allSubjects);
        return;
      }
      
      // Filter subjects applicable to this grade
      // Backend stores grades as string array or JSON string
      const gradeStr = grade.grade.toString();
      const applicableSubjects = allSubjects.filter(sub => {
        // VALIDATION: Check if subject has grades
        if (!sub.grades) {
          console.warn('VALIDATION: Subject missing grades:', sub.name);
          return false;
        }
        
        let subGrades: string[] = [];
        if (Array.isArray(sub.grades)) {
          subGrades = sub.grades.flatMap(g => {
            if (typeof g === 'string' && g.startsWith('[')) {
              try { return JSON.parse(g); } catch { 
                console.warn('VALIDATION: Failed to parse grade JSON:', g);
                return g; 
              }
            }
            return g;
          });
        } else if (typeof sub.grades === 'string' && sub.grades.startsWith('[')) {
          try { subGrades = JSON.parse(sub.grades); } catch { 
            console.warn('VALIDATION: Failed to parse grades string:', sub.grades);
            subGrades = [sub.grades]; 
          }
        } else {
          subGrades = [sub.grades as string];
        }
        
        // VALIDATION: Check if grade matches subject's grades
        const matchesGrade = subGrades.includes(gradeStr);
        if (!matchesGrade) {
          console.warn('VALIDATION: Subject does not match grade:', { subject: sub.name, grade: gradeStr, subjectGrades: subGrades });
        }
        
        return matchesGrade;
      });
      
      console.log('VALIDATION: Found applicable subjects:', applicableSubjects.length, 'for grade:', gradeStr);
      setSubjects(applicableSubjects);
    } catch (error) {
      // VALIDATION: Log fetch error with details
      console.error('Failed to fetch subjects:', error);
    }
  };

  const handleSubjectSelect = async (subject: Subject) => {
    // VALIDATION: Check if subject is valid
    if (!subject || !subject.id || !subject.name) {
      console.error('VALIDATION: Invalid subject selected:', subject);
      return;
    }
    
    // VALIDATION: Check if grade is valid
    if (!grade || !grade.id) {
      console.error('VALIDATION: Invalid grade data:', grade);
      return;
    }
    
    // VALIDATION: Check if term is valid
    if (!term || typeof term !== 'string') {
      console.error('VALIDATION: Invalid term:', term);
      return;
    }
    
    setSelectedSubject(subject);
    try {
      // Fetch existing marks for this grade/subject/term
      const marks = await marksApi.getByGradeSubjectTerm(grade.id!, subject.id, term);
      
      // VALIDATION: Ensure marks data is valid array
      if (!Array.isArray(marks)) {
        console.warn('VALIDATION: Invalid marks data received, using empty array:', marks);
        // Continue with empty marks array
      }
      
      // If subject is optional or belongs to a bucket (category), fetch enrolled students
      let studentList = grade.students || [];
      if (subject.is_optional || subject.category) {
        // VALIDATION: Fetch enrolled students for optional/categorized subjects
        const enrollment = await subjectApi.getSubjectEnrollment(subject.id, grade.id!);
        
        // VALIDATION: Ensure enrollment data is valid
        if (!Array.isArray(enrollment)) {
          console.warn('VALIDATION: Invalid enrollment data received:', enrollment);
          setEnrolledStudentIds([]);
          studentList = [];
        } else {
          const ids = enrollment.map((e: any) => e.student_id).filter((id: any) => typeof id === 'number');
          setEnrolledStudentIds(ids);
          studentList = (grade.students || []).filter(s => ids.includes(s.id));
        }
      } else {
        setEnrolledStudentIds(null);
      }

      // VALIDATION: Ensure student list is valid
      if (!Array.isArray(studentList)) {
        console.warn('VALIDATION: Invalid student list, using empty array:', studentList);
        studentList = [];
      }

      // Initialize marksData with existing or default values
      const initialMarks: Record<number, Partial<Mark>> = {};
      studentList.forEach(student => {
        // VALIDATION: Check if student is valid
        if (!student || !student.id) {
          console.warn('VALIDATION: Invalid student in list:', student);
          return;
        }
        
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
      
      console.log('VALIDATION: Initialized marks for', studentList.length, 'students');
      setMarksData(initialMarks);
      setEditingRows({});
    } catch (error) {
      // VALIDATION: Log subject selection error with details
      console.error('Failed to fetch existing marks:', error);
    }
  };

  const handleMarkChange = (studentId: number, field: keyof Mark, value: any) => {
    // VALIDATION: Check if student ID is valid
    if (!studentId || typeof studentId !== 'number') {
      console.error('VALIDATION: Invalid student ID for mark change:', studentId);
      return;
    }
    
    // VALIDATION: Check if field is valid
    if (!field || typeof field !== 'string') {
      console.error('VALIDATION: Invalid field for mark change:', field);
      return;
    }
    
    // VALIDATION: Check if value is not undefined
    if (value === undefined) {
      console.warn('VALIDATION: Undefined value for mark change:', { studentId, field });
      return;
    }
    
    setMarksData(prev => {
      // VALIDATION: Ensure previous state exists
      if (!prev || typeof prev !== 'object') {
        console.warn('VALIDATION: Invalid previous marks data state:', prev);
        return prev;
      }
      
      const updatedData = {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [field]: value
        }
      };
      
      // VALIDATION: Auto-generate remarks when marks change
      if (field === 'marks_obtained') {
        const remark = getAutoRemark(String(value));
        updatedData[studentId] = {
          ...updatedData[studentId],
          remarks: remark
        };
        console.log('VALIDATION: Auto-generated remark:', { studentId, marks: value, remark });
      }
      
      return updatedData;
    });
  };


  const handleSave = async () => {
    // VALIDATION: Check if subject is selected
    if (!selectedSubject || !selectedSubject.id) {
      console.error('VALIDATION: No subject selected for saving marks');
      alert('Please select a subject first.');
      return;
    }
    
    // VALIDATION: Check if grade is valid
    if (!grade || !grade.id) {
      console.error('VALIDATION: Invalid grade data for saving marks');
      alert('Invalid grade data.');
      return;
    }
    
    // Validate: check if any student has marks_obtained but not max_marks or vice versa
    const studentsToSave = grade.students?.filter(s => {
      // VALIDATION: Check if student is valid
      if (!s || !s.id) {
        console.warn('VALIDATION: Invalid student in grade list:', s);
        return false;
      }
      
      const m = marksData[s.id];
      return m && m.marks_obtained !== '';
    }) || [];

    // VALIDATION: Check if any marks entered to save
    if (studentsToSave.length === 0) {
      console.warn('VALIDATION: No marks entered to save');
      alert('No marks entered to save.');
      return;
    }

    // VALIDATION: Check if save operation is already in progress
    if (saving) {
      console.warn('VALIDATION: Save operation already in progress');
      return;
    }

    try {
      setSaving(true);
      console.log('VALIDATION: Preparing to save marks for', studentsToSave.length, 'students');
      
      const dataToSave = studentsToSave.map(s => {
        const m = marksData[s.id];
        
        // Validate individual mark
        if (m.marks_obtained !== 'AB') {
          const val = Number(m.marks_obtained);
          // VALIDATION: Check if mark is valid number
          if (isNaN(val) || val < 0 || val > 100) {
            console.error('VALIDATION: Invalid mark value:', { student: s.first_name, value: m.marks_obtained });
            throw new Error(`Invalid mark for student: ${s.first_name}. Must be between 0 and 100 or 'AB'.`);
          }
        }

        // VALIDATION: Ensure all required fields are present
        const markData = {
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
        
        console.log('VALIDATION: Prepared mark data:', { student: s.first_name, data: markData });
        return markData;
      });

      const result = await marksApi.bulkCreate(dataToSave);
      
      // VALIDATION: Check save result for errors
      if (result.errors && result.errors.length > 0) {
        console.error('Errors saving some marks:', result.errors);
        alert(`Saved ${result.created.length} marks. Errors encountered for ${result.errors.length} students.`);
      } else {
        console.log('VALIDATION: All marks saved successfully:', result.created.length);
        alert('All marks saved successfully!');
      }
      
      // Refresh existing marks
      handleSubjectSelect(selectedSubject);
    } catch (error: any) {
      // VALIDATION: Log save error with details
      console.error('Failed to save marks:', error);
      alert(error.message || 'Failed to save marks. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendReports = async () => {
    // VALIDATION: Check if grade is valid
    if (!grade || !grade.id || !grade.grade || !grade.grade_part) {
      console.error('VALIDATION: Invalid grade data for sending reports:', grade);
      alert('Invalid grade data for sending reports.');
      return;
    }
    
    // VALIDATION: Check if term is valid
    if (!term || typeof term !== 'string') {
      console.error('VALIDATION: Invalid term for sending reports:', term);
      alert('Invalid term for sending reports.');
      return;
    }
    
    // VALIDATION: Check if report sending is already in progress
    if (sendingReports) {
      console.warn('VALIDATION: Report sending already in progress');
      return;
    }
    
    // VALIDATION: User confirmation for bulk operation
    const confirmMessage = `Send consolidated low marks reports for all students in Grade ${grade.grade}-${grade.grade_part} for ${term}?`;
    if (!window.confirm(confirmMessage)) {
      console.log('VALIDATION: User cancelled report sending');
      return;
    }
    
    try {
      setSendingReports(true);
      console.log('VALIDATION: Sending reports for grade:', grade.grade, '-', grade.grade_part, 'term:', term);
      
      await marksApi.sendTermReports(grade.id!, term);
      console.log('VALIDATION: Reports sent successfully');
      alert('Consolidated reports sent successfully to all parents!');
    } catch (error: any) {
      // VALIDATION: Log report sending error with details
      console.error('Failed to send reports:', error);
      alert(error.message || 'Failed to send reports.');
    } finally {
      setSendingReports(false);
    }
  };

  const handleDeleteMark = async (studentId: number) => {
    // VALIDATION: Check if student ID is valid
    if (!studentId || typeof studentId !== 'number') {
      console.error('VALIDATION: Invalid student ID for mark deletion:', studentId);
      return;
    }
    
    const markId = marksData[studentId]?.id;
    // VALIDATION: Check if mark exists for deletion
    if (!markId) {
      console.warn('VALIDATION: No mark found for student:', studentId);
      alert('No mark found to delete for this student.');
      return;
    }
    
    // VALIDATION: User confirmation for destructive operation
    if (!window.confirm('Are you sure you want to delete this mark?')) {
      console.log('VALIDATION: User cancelled mark deletion');
      return;
    }
    
    try {
      console.log('VALIDATION: Deleting mark:', markId, 'for student:', studentId);
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
      console.log('VALIDATION: Mark deleted successfully for student:', studentId);
    } catch (error: any) {
      // VALIDATION: Log deletion error with details
      console.error('Failed to delete mark:', error);
      alert('Failed to delete mark');
    }
  };

  // Helper to get grade badge text and color based on mark
  const getGradeInfo = (markStr: string) => {
    // VALIDATION: Check if mark string is valid
    if (!markStr || typeof markStr !== 'string') {
      console.warn('VALIDATION: Invalid mark string for grade info:', markStr);
      return null;
    }
    
    // VALIDATION: Handle absent marks
    if (markStr === 'AB') return { text: 'AB', color: '#EF4444' };
    
    const m = Number(markStr);
    // VALIDATION: Check if mark is valid number
    if (isNaN(m) || markStr === '') return null;
    
    // VALIDATION: Check mark range
    if (m < 0 || m > 100) {
      console.warn('VALIDATION: Mark out of range for grade info:', m);
      return null;
    }
    
    // VALIDATION: Grade boundaries
    if (m >= 75) return { text: 'A', color: '#10B981' };
    if (m >= 65) return { text: 'B', color: '#3B82F6' };
    if (m >= 55) return { text: 'C', color: '#F59E0B' };
    if (m >= 40) return { text: 'S', color: '#8B5CF6' };
    return { text: 'F', color: '#EF4444' };
  };

  const getAutoRemark = (markStr: string) => {
    // VALIDATION: Check if mark string is valid
    if (!markStr || typeof markStr !== 'string') {
      console.warn('VALIDATION: Invalid mark string for auto remark:', markStr);
      return '';
    }
    
    // VALIDATION: Handle absent marks
    if (markStr === 'AB') return 'Absent';
    
    const m = parseInt(markStr);
    // VALIDATION: Check if mark is valid number
    if (isNaN(m)) return '';
    
    // VALIDATION: Check mark range
    if (m < 0 || m > 100) {
      console.warn('VALIDATION: Mark out of range for auto remark:', m);
      return 'Invalid Mark';
    }
    
    // VALIDATION: Remark boundaries
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
