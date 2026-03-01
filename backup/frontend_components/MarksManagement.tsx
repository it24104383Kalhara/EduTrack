import { useState, useEffect } from 'react';
import { markApi, studentApi, subjectApi, streamApi, gradeApi } from '../services/api';
import type { Mark as BackendMark, Student, Subject } from '../services/api';


const MarksManagement = () => {
  const [marksEntries, setMarksEntries] = useState<{[key: string]: string}>({});
  const [existingMarks, setExistingMarks] = useState<{[key: string]: any}>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<BackendMark[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<'6-11' | '12-13'>('6-11');
  const [selectedGradeSection, setSelectedGradeSection] = useState<string>('');
  const [selectedStream, setSelectedStream] = useState<string>('');
  const [availableStreams, setAvailableStreams] = useState<string[]>(['Science', 'Commerce', 'Arts']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedGrade && selectedGradeSection) {
      loadMarksForGradeSection();
    }
  }, [selectedGrade, selectedGradeSection]);

  useEffect(() => {
    // Listen for data updates from other components
    const handleDataUpdate = () => {
      console.log('Data update event received, refreshing...');
      loadData();
    };
    
    window.addEventListener('dataUpdated', handleDataUpdate);
    
    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdate);
    };
  }, []);

  const loadData = async () => {
    try {
      console.log('Loading data from API...');
      setLoading(true);
      
      // Load grades from API
      const gradesData = await gradeApi.getAll();
      console.log('DEBUG - Loaded grades:', gradesData);
      console.log('DEBUG - Grades with students:', gradesData?.map(g => ({
        id: g.id,
        grade: g.grade,
        grade_part: g.grade_part,
        students_count: g.students?.length || 0,
        students: g.students
      })));
      setGrades(gradesData || []);

      // Load students from API
      const studentsData = await studentApi.getAll();
      console.log('All loaded students:', studentsData);
      setStudents(studentsData || []);

      // Load subjects from API
      const subjectsData = await subjectApi.getAll();
      console.log('Loaded subjects:', subjectsData);
      setSubjects(subjectsData || []);

      // Load streams from API
      const streamsData = await streamApi.getAll();
      console.log('Loaded streams:', streamsData);
      
      // Combine API streams with any custom streams (for now just use API streams)
      setAvailableStreams(streamsData?.map(s => s.name) || ['Science', 'Commerce', 'Arts']);

      // Load marks from API
      const marksData = await markApi.getAll();
      console.log('Loaded marks:', marksData);
      setMarks(marksData || []);
    } catch (error) {
      console.error('Error loading data from API:', error);
      // Set empty arrays if API fails
      setStudents([]);
      setSubjects([]);
      setMarks([]);
      setAvailableStreams(['Science', 'Commerce', 'Arts']);
    } finally {
      setLoading(false);
    }
  };

  const handleMarksChange = (subjectId: string, marks: string) => {
    setMarksEntries(prev => ({
      ...prev,
      [subjectId]: marks
    }));
  };

  const saveAllMarks = async () => {
    if (!selectedStudent) {
      alert('Please select a student first');
      return;
    }

    const student = getFilteredStudents().find((s: any) => s.id.toString() === selectedStudent);
    if (!student) return;

    // Create mark entries for all subjects
    const newMarks: BackendMark[] = [];
    getSubjectsForGrade().forEach((subject: any) => {
      const marksValue = marksEntries[subject.id.toString()] || '0';
      newMarks.push({
        student_id: parseInt(selectedStudent),
        subject_id: subject.id,
        grade: parseInt(selectedGrade) || 1,
        marks_obtained: parseFloat(marksValue),
        total_marks: 100,
        exam_type: 'Class Test',
        exam_date: new Date().toISOString().split('T')[0]
      });
    });

    try {
      // Save each mark via API
      for (const markData of newMarks) {
        await markApi.create(markData);
      }
      
      // Reload marks from API
      const updatedMarks = await markApi.getAll();
      setMarks(updatedMarks);
      
      alert('Marks saved successfully!');
      
      // Reset form
      setMarksEntries({});
    } catch (error) {
      console.error('Error saving marks:', error);
      alert('Failed to save marks. Please try again.');
    }
  };

  const resetMarks = () => {
    setMarksEntries({});
    alert('Marks reset successfully!');
  };

  const deleteMark = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this mark?')) {
      try {
        await markApi.delete(id);
        const updatedMarks = marks.filter(mark => mark.id !== id);
        setMarks(updatedMarks);
      } catch (error) {
        console.error('Error deleting mark:', error);
        alert('Failed to delete mark. Please try again.');
      }
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id.toString() === studentId);
    return student ? `${student.first_name} ${student.last_name}` : 'Unknown Student';
  };

  
  const getPercentage = (marks: number, maxMarks: number) => {
    return maxMarks > 0 ? ((marks / maxMarks) * 100).toFixed(1) : '0';
  };

  const getGrade = (percentage: string) => {
    const pct = parseFloat(percentage);
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    return 'F';
  };

  const getAllGrades = () => {
    try {
      // Get grades from grades API first, then supplement with student grades
      const apiGrades = grades.map(g => g.grade.toString());
      const studentGrades = students.map(s => s.grade?.toString() || '').filter(Boolean);
      
      // Combine and deduplicate
      const allGrades = [...new Set([...apiGrades, ...studentGrades])];
      return allGrades.sort((a, b) => parseInt(a) - parseInt(b));
    } catch (error) {
      console.error('Error getting grades:', error);
      return [];
    }
  };

  const getAllStreams = () => {
    return availableStreams;
  };


  const getStudentsByGradeAndSection = () => {
    try {
      const groupedStudents: { [key: string]: Student[] } = {};
      
      // Group students by their grade and section assignments
      grades.forEach(grade => {
        if (grade.students && grade.students.length > 0) {
          const key = `${grade.grade}${(grade as any).grade_part}`;
          groupedStudents[key] = grade.students;
        }
      });
      
      console.log('DEBUG - Grouped students:', groupedStudents);
      return groupedStudents;
    } catch (error) {
      console.error('Error grouping students:', error);
      return {};
    }
  };

  const loadMarksForGradeSection = async () => {
    if (!selectedGrade || !selectedGradeSection) return;
    
    try {
      console.log('Loading marks for', selectedGrade, selectedGradeSection);
      const allMarks = await markApi.getAll();
      
      // Filter marks for this grade and section
      const gradeSectionMarks = allMarks.filter(mark => 
        mark.grade?.toString() === selectedGrade && 
        mark.section === selectedGradeSection
      );
      
      console.log('Found marks for grade-section:', gradeSectionMarks);
      
      // Create a map of existing marks for easy lookup
      const marksMap: {[key: string]: any} = {};
      gradeSectionMarks.forEach(mark => {
        const key = `${mark.student_id}-${mark.subject_id}`;
        marksMap[key] = mark;
      });
      
      setExistingMarks(marksMap);
      
      // Also populate the marks entries with existing values
      const entriesMap: {[key: string]: string} = {};
      gradeSectionMarks.forEach(mark => {
        const key = `${mark.student_id}-${mark.subject_id}`;
        entriesMap[key] = mark.marks_obtained?.toString() || '';
      });
      
      setMarksEntries(entriesMap);
    } catch (error) {
      console.error('Error loading marks:', error);
    }
  };

  const handleMarksChangeForStudent = (studentId: number, subjectId: number, value: string) => {
    setMarksEntries(prev => ({
      ...prev,
      [`${studentId}-${subjectId}`]: value
    }));
  };

  const getMarkForStudent = (studentId: number, subjectId: number) => {
    return marksEntries[`${studentId}-${subjectId}`] || '';
  };

  const hasMarkForStudent = (studentId: number, subjectId: number) => {
    const value = marksEntries[`${studentId}-${subjectId}`];
    return value && value !== '' && value !== '0';
  };

  const saveMarksForSubject = async (subjectId: number) => {
    try {
      console.log('Saving marks for subject:', subjectId);
      
      const subjectMarks: any[] = [];
      const studentsInSection = getStudentsByGradeAndSection()[`${selectedGrade}${selectedGradeSection}`] || [];
      
      studentsInSection.forEach((student: any) => {
        const markValue = marksEntries[`${student.id}-${subjectId}`];
        if (markValue && markValue !== '' && markValue !== '0') {
          subjectMarks.push({
            student_id: student.id,
            subject_id: subjectId,
            mark: parseInt(markValue),
            grade: selectedGrade,
            section: selectedGradeSection,
            created_at: new Date().toISOString()
          });
        }
      });
      
      if (subjectMarks.length > 0) {
        console.log('Saving subject marks:', subjectMarks);
        
        // Save each mark individually
        for (const markData of subjectMarks) {
          try {
            await markApi.create(markData);
          } catch (error) {
            console.error('Error saving mark:', markData, error);
          }
        }
        
        alert(`✅ Successfully saved ${subjectMarks.length} marks for subject`);
        
        // Reload marks to show updated data
        loadMarksForGradeSection();
      } else {
        alert('⚠️ No valid marks to save for this subject');
      }
    } catch (error) {
      console.error('Error saving subject marks:', error);
      alert('❌ Error saving marks. Please try again.');
    }
  };

  const getTotalMarksForStudent = (studentId: number) => {
    const subjects = getSubjectsForGrade();
    let total = 0;
    subjects.forEach((subject: any) => {
      const markValue = marksEntries[`${studentId}-${subject.id}`];
      if (markValue && markValue !== '') {
        total += parseInt(markValue);
      }
    });
    return total;
  };

  const saveAllMarksForClass = async () => {
    try {
      console.log('Saving all marks for students in', selectedGrade, selectedGradeSection);
      
      const allMarks: any[] = [];
      const studentsInSection = getStudentsByGradeAndSection()[`${selectedGrade}${selectedGradeSection}`] || [];
      
      studentsInSection.forEach((student: any) => {
        getSubjectsForGrade().forEach((subject: any) => {
          const markValue = marksEntries[`${student.id}-${subject.id}`];
          if (markValue && markValue !== '' && markValue !== '0') {
            allMarks.push({
              student_id: student.id,
              subject_id: subject.id,
              mark: parseInt(markValue),
              grade: selectedGrade,
              section: selectedGradeSection,
              created_at: new Date().toISOString()
            });
          }
        });
      });
      
      if (allMarks.length > 0) {
        console.log('Saving marks:', allMarks);
        
        // Save each mark individually using the markApi
        for (const markData of allMarks) {
          try {
            await markApi.create(markData);
          } catch (error) {
            console.error('Error saving mark:', markData, error);
          }
        }
        
        alert(`✅ Successfully saved ${allMarks.length} marks for ${studentsInSection.length} students in ${selectedGrade}${selectedGradeSection}`);
        
        // Clear the marks entries after successful save
        setMarksEntries({});
        
        // Reload data to show saved marks
        loadData();
      } else {
        alert('⚠️ No valid marks to save (marks must be between 1-100)');
      }
    } catch (error) {
      console.error('Error saving marks:', error);
      alert('❌ Error saving marks. Please try again.');
    }
  };

  const getFilteredStudents = () => {
    try {
      let filtered = students || [];
      
      console.log('DEBUG - All students:', students);
      console.log('DEBUG - Selected grade:', selectedGrade);
      console.log('DEBUG - Selected section:', selectedGradeSection);
      
      // Get students assigned to grades from grades data
      let assignedStudents: Student[] = [];
      let gradeSections: { [studentId: number]: string } = {};
      
      if (selectedGrade) {
        const selectedGradeData = grades.find(g => g.grade.toString() === selectedGrade);
        if (selectedGradeData && selectedGradeData.students) {
          assignedStudents = selectedGradeData.students;
          console.log('DEBUG - Assigned students from grades data:', assignedStudents);
          console.log('DEBUG - Assigned students with sections:', assignedStudents.map((s: any) => ({
            id: s.id,
            name: `${s.first_name} ${s.last_name}`,
            section: s.section,
            grade: s.grade,
            grade_part: s.grade_part,
            all_keys: Object.keys(s)
          })));
          
          // Create mapping of student to their section from grade data
          // The grade_part (like "A", "B") represents the section
          assignedStudents.forEach((s: any) => {
            if (s.grade_part) {
              gradeSections[s.id] = s.grade_part;
            }
          });
          
          console.log('DEBUG - Grade sections mapping:', gradeSections);
          
          // Log first assigned student details
          if (assignedStudents.length > 0) {
            console.log('DEBUG - First assigned student object:', assignedStudents[0]);
            console.log('DEBUG - First assigned student all fields:', assignedStudents[0]);
          }
        }
      }
      
      // Filter by grade - check both student.grade field and grade assignments
      if (selectedGrade) {
        filtered = filtered.filter((student: any) => {
          // Check if student's grade field matches
          const gradeFieldMatches = student.grade?.toString() === selectedGrade;
          
          // Check if student is in the assigned students list for this grade
          const assignedMatches = assignedStudents.some((assignedStudent: any) => 
            assignedStudent.id === student.id
          );
          
          const matches = gradeFieldMatches || assignedMatches;
          console.log(`DEBUG - Student ${student.first_name} ${student.last_name}: grade=${student.grade}, gradeFieldMatches=${gradeFieldMatches}, assignedMatches=${assignedMatches}, matches=${matches}`);
          return matches;
        });
      }
      
      // Filter by section - check both student.section field and grade assignments
      if (selectedGradeSection) {
        filtered = filtered.filter((student: any) => {
          // Check if student's section field matches
          const sectionFieldMatches = student.section === selectedGradeSection;
          
          // Check if student is in the assigned students list for this section
          // Use the grade sections mapping to get the student's assigned section
          const assignedSection = gradeSections[student.id];
          const assignedMatches = assignedSection === selectedGradeSection;
          
          const matches = sectionFieldMatches || assignedMatches;
          console.log(`DEBUG - Student ${student.first_name} ${student.last_name}: section=${student.section}, assignedSection=${assignedSection}, sectionFieldMatches=${sectionFieldMatches}, assignedMatches=${assignedMatches}, matches=${matches}`);
          return matches;
        });
      }
      
      if (selectedStream) {
        filtered = filtered.filter((student: any) => student.stream === selectedStream);
      }
      
      console.log('DEBUG - Final filtered students:', filtered);
      return filtered;
    } catch (error) {
      console.error('Error filtering students:', error);
      return [];
    }
  };

  const getSubjectsForGrade = () => {
    try {
      if (!selectedGrade) return [];
      
      return (subjects || []).filter(subject => 
        subject.grades.includes(selectedGrade) && 
        subject.type === selectedSection
      );
    } catch (error) {
      console.error('Error getting subjects for grade:', error);
      return [];
    }
  };

  const getSectionsForGrade = () => {
    try {
      if (!selectedGrade) return [];
      
      // Get unique grade_part values for the selected grade
      const sections = new Set<string>();
      grades.forEach(grade => {
        if (grade.grade.toString() === selectedGrade && grade.grade_part) {
          sections.add(grade.grade_part);
        }
      });
      
      return Array.from(sections).sort();
    } catch (error) {
      console.error('Error getting sections for grade:', error);
      return [];
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#e2e8f0',
        fontSize: '1.5rem'
      }}>
        Loading marks data...
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#10b981',
          margin: 0
        }}>
          📊 Marks Management
        </h1>
        <button
          onClick={resetMarks}
          style={{
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}
        >
          🗑️ Clear All Marks
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
            🎓 Select Grade
          </label>
          <select
            value={selectedGrade}
            onChange={(e) => {
              setSelectedGrade(e.target.value);
              setSelectedGradeSection(''); // Reset section when grade changes
            }}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #4a5568',
              background: '#2d3748',
              color: '#e2e8f0',
              fontSize: '0.95rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <option value="">All Grades</option>
            {getAllGrades().map(grade => (
              <option key={grade} value={grade}>
                Grade {grade}
              </option>
            ))}
          </select>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
            📚 Select Section
          </label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value as '6-11' | '12-13')}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #4a5568',
              background: '#2d3748',
              color: '#e2e8f0',
              fontSize: '0.95rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <option value="6-11">Grades 6-11</option>
            <option value="12-13">Grades 12-13</option>
          </select>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
            🏫 Select Class Section
          </label>
          <select
            value={selectedGradeSection}
            onChange={(e) => setSelectedGradeSection(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #4a5568',
              background: '#2d3748',
              color: '#e2e8f0',
              fontSize: '0.95rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <option value="">All Sections</option>
            {getSectionsForGrade().map(section => (
              <option key={section} value={section}>
                Section {section}
              </option>
            ))}
          </select>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
            🎯 Select Stream
          </label>
          <select
            value={selectedStream}
            onChange={(e) => setSelectedStream(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #4a5568',
              background: '#2d3748',
              color: '#e2e8f0',
              fontSize: '0.95rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <option value="">All Streams</option>
            {getAllStreams().map(stream => (
              <option key={stream} value={stream}>
                {stream}
              </option>
            ))}
          </select>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
            👨‍🎓 Select Student
          </label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '0.9rem'
            }}
          >
            <option value="">Select Student</option>
            {getFilteredStudents().map(student => (
              <option key={student.id} value={student.id.toString()}>
                {student.first_name} {student.last_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Display grade and subjects information */}
      {selectedGrade && selectedGradeSection && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{
              color: '#10b981',
              fontSize: '1.2rem',
              fontWeight: '600',
              margin: 0
            }}>
              📚 Grade {selectedGrade}{selectedGradeSection}
            </h3>
            
            <div style={{
              color: '#e2e8f0',
              fontSize: '0.9rem'
            }}>
              Total Students: {getStudentsByGradeAndSection()[`${selectedGrade}${selectedGradeSection}`]?.length || 0}
            </div>
          </div>
          
          <div style={{
            marginTop: '15px',
            display: 'flex',
            gap: '10px'
          }}>
            <button
              onClick={saveAllMarksForClass}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#059669';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#10b981';
              }}
            >
              💾 Save All Marks
            </button>
          </div>
          
          {/* Display subjects for this grade */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            padding: '15px'
          }}>
            <h4 style={{
              color: '#10b981',
              marginBottom: '10px',
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              📖 Subjects for Grade {selectedGrade}
            </h4>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              {getSubjectsForGrade().map(subject => (
                <div key={subject.id} style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#e2e8f0',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: '500'
                }}>
                  {subject.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Display students for selected grade and section only */}
      {selectedGrade && selectedGradeSection && getStudentsByGradeAndSection()[`${selectedGrade}${selectedGradeSection}`] && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          padding: '25px',
          borderRadius: '16px',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          marginBottom: '30px'
        }}>
          <h3 style={{
            color: '#3b82f6',
            marginBottom: '20px',
            fontSize: '1.3rem'
          }}>
            📚 Students in {selectedGrade}{selectedGradeSection}
          </h3>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '20px',
            overflowX: 'auto',
            maxWidth: '100%'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '800px'
            }}>
              <thead>
                <tr style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#e2e8f0'
                }}>
                  <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: '600' }}>ID</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                  {getSubjectsForGrade().map(subject => (
                    <th key={subject.id} style={{ 
                      padding: '8px 4px', 
                      textAlign: 'center', 
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      minWidth: '90px'
                    }}>
                      <div>
                        {subject.name}
                      </div>
                      <button
                        onClick={() => saveMarksForSubject(subject.id)}
                        style={{
                          marginTop: '3px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          padding: '3px 6px',
                          borderRadius: '3px',
                          fontSize: '0.65rem',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#2563eb';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = '#3b82f6';
                        }}
                      >
                        💾 Save
                      </button>
                    </th>
                  ))}
                  <th style={{ 
                    padding: '12px 15px', 
                    textAlign: 'center', 
                    fontWeight: '600',
                    backgroundColor: 'rgba(59, 130, 246, 0.3)',
                    minWidth: '100px'
                  }}>
                    📊 Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {getStudentsByGradeAndSection()[`${selectedGrade}${selectedGradeSection}`]?.map((student: any, index: number) => (
                  <tr key={student.id} style={{
                    background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
                    color: '#e2e8f0'
                  }}>
                    <td style={{ padding: '10px 15px' }}>{student.id}</td>
                    <td style={{ padding: '10px 15px', fontWeight: '500' }}>
                      {student.first_name} {student.last_name}
                    </td>
                    {getSubjectsForGrade().map(subject => (
                      <td key={`${student.id}-${subject.id}`} style={{ 
                        padding: '4px 2px',
                        textAlign: 'center',
                        minWidth: '90px'
                      }}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0-100"
                          style={{
                            width: '45px',
                            height: '28px',
                            padding: '2px',
                            borderRadius: '3px',
                            border: hasMarkForStudent(student.id, subject.id) ? '2px solid #10b981' : '1px solid #4a5568',
                            background: hasMarkForStudent(student.id, subject.id) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.9)',
                            color: hasMarkForStudent(student.id, subject.id) ? '#10b981' : '#e2e8f0',
                            fontSize: '0.75rem',
                            textAlign: 'center',
                            fontWeight: hasMarkForStudent(student.id, subject.id) ? '600' : '400'
                          }}
                          onChange={(e) => handleMarksChangeForStudent(student.id, subject.id, e.target.value)}
                          value={getMarkForStudent(student.id, subject.id)}
                        />
                        {existingMarks[`${student.id}-${subject.id}`] && (
                          <div style={{
                            marginTop: '4px',
                            fontSize: '0.7rem',
                            color: '#10b981',
                            fontWeight: '500'
                          }}>
                            Saved: {existingMarks[`${student.id}-${subject.id}`].marks_obtained}
                          </div>
                        )}
                      </td>
                    ))}
                    <td style={{ 
                      padding: '10px 15px', 
                      textAlign: 'center',
                      fontWeight: '600',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6',
                      fontSize: '1rem'
                    }}>
                      {getTotalMarksForStudent(student.id)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{
            marginTop: '15px',
            color: '#94a3b8',
            fontSize: '0.9rem'
          }}>
            Total Students: {getStudentsByGradeAndSection()[`${selectedGrade}${selectedGradeSection}`].length}
          </div>
        </div>
      )}

      {/* Show message when no grade/section selected */}
      {(!selectedGrade || !selectedGradeSection) && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          textAlign: 'center',
          color: '#f87171',
          marginBottom: '30px'
        }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '500', marginBottom: '8px' }}>
            📝 Please select both Grade and Section
          </div>
          <div style={{ fontSize: '0.9rem', color: '#fca5a5' }}>
            Select a grade and section to view students in that class
          </div>
        </div>
      )}

      {/* Show message when no students found for selected grade-section */}
      {selectedGrade && selectedGradeSection && !getStudentsByGradeAndSection()[`${selectedGrade}${selectedGradeSection}`] && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          textAlign: 'center',
          color: '#f87171',
          marginBottom: '30px'
        }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '500', marginBottom: '8px' }}>
            😔 No students found
          </div>
          <div style={{ fontSize: '0.9rem', color: '#fca5a5' }}>
            No students are assigned to {selectedGrade}{selectedGradeSection}
          </div>
        </div>
      )}

      {/* Display existing marks for selected student */}
      {selectedStudent && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          marginBottom: '30px'
        }}>
          <h3 style={{
            color: '#10b981',
            marginBottom: '15px',
            fontSize: '1.2rem'
          }}>
            📊 Existing Marks for Student ID: {selectedStudent}
          </h3>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            padding: '15px',
            overflowX: 'auto',
            maxWidth: '100%'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '500px'
            }}>
              <thead>
                <tr style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#e2e8f0'
                }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600' }}>Subject</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600' }}>Marks</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {marks
                  .filter(mark => mark.student_id?.toString() === selectedStudent)
                  .map((mark: any, index: number) => (
                    <tr key={mark.id} style={{
                      background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
                      color: '#e2e8f0'
                    }}>
                      <td style={{ padding: '10px 12px', fontWeight: '500' }}>
                        {mark.subject_id}
                      </td>
                      <td style={{ 
                        padding: '10px 12px', 
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#10b981',
                        fontSize: '1rem'
                      }}>
                        {mark.marks_obtained}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        {mark.exam_date || new Date(mark.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            
            {marks.filter(mark => mark.student_id?.toString() === selectedStudent).length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: '#94a3b8',
                fontSize: '0.9rem'
              }}>
                No existing marks found for this student
              </div>
            )}
          </div>
        </div>
      )}
      
      {selectedStudent && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          padding: '30px',
          borderRadius: '16px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          marginBottom: '30px'
        }}>
          <h2 style={{
            color: '#10b981',
            marginBottom: '20px',
            fontSize: '1.5rem'
          }}>
            📝 Enter Marks for {getStudentName(selectedStudent)}
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}>
            {getSubjectsForGrade().map(subject => (
              <div key={subject.id} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontWeight: '600',
                  color: '#e2e8f0'
                }}>
                  {subject.name}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={marksEntries[subject.id.toString()] || ''}
                  onChange={(e) => handleMarksChange(subject.id.toString(), e.target.value)}
                  placeholder="Enter marks (0-100)"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <button
              onClick={saveAllMarks}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
              }}
            >
              💾 Save All Marks
            </button>
            <button
              onClick={resetMarks}
              style={{
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              🔄 Reset
            </button>
          </div>
        </div>
      )}

      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '30px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h2 style={{
          color: '#3b82f6',
          marginBottom: '20px',
          fontSize: '1.5rem'
        }}>
          📊 Existing Marks
        </h2>
        
        {marks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#9ca3af',
            fontSize: '1.1rem'
          }}>
            No marks found. Start by selecting a student and entering their marks.
          </div>
        ) : (
          <div style={{
            overflowX: 'auto',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <thead>
                <tr style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: 'white'
                }}>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Student</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Subject</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600' }}>Marks</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600' }}>Percentage</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600' }}>Grade</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((mark, index) => (
                  <tr key={mark.id || index} style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#e2e8f0'
                  }}>
                    <td style={{ padding: '15px' }}>
                      {students.find(s => s.id === mark.student_id)?.first_name} {students.find(s => s.id === mark.student_id)?.last_name}
                    </td>
                    <td style={{ padding: '15px' }}>
                      {subjects.find(s => s.id === mark.subject_id)?.name}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      {mark.marks_obtained || 0}/{mark.total_marks || 0}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      {getPercentage(mark.marks_obtained || 0, mark.total_marks || 0)}%
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        background: getGrade(getPercentage(mark.marks_obtained || 0, mark.total_marks || 0)) === 'A+' ? '#10b981' :
                                   getGrade(getPercentage(mark.marks_obtained || 0, mark.total_marks || 0)) === 'A' ? '#059669' :
                                   getGrade(getPercentage(mark.marks_obtained || 0, mark.total_marks || 0)) === 'B' ? '#3b82f6' :
                                   getGrade(getPercentage(mark.marks_obtained || 0, mark.total_marks || 0)) === 'C' ? '#f59e0b' :
                                   getGrade(getPercentage(mark.marks_obtained || 0, mark.total_marks || 0)) === 'D' ? '#f97316' : '#ef4444',
                        color: 'white'
                      }}>
                        {getGrade(getPercentage(mark.marks_obtained || 0, mark.total_marks || 0))}
                      </span>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <button
                        onClick={() => mark.id && deleteMark(mark.id)}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarksManagement;
