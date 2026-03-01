import React, { useState, useEffect } from 'react';
import { gradeApi, studentApi } from '../services/api';
import type { Grade, Student } from '../services/api';
import jsPDF from 'jspdf';

const GradeManagement: React.FC = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGrade, setNewGrade] = useState({ grade: 0, grade_part: '' });
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [showStudentAssignment, setShowStudentAssignment] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAllAssignments, setShowAllAssignments] = useState(false);
  const [allAssignments, setAllAssignments] = useState<any[]>([]);

  useEffect(() => {
    fetchGrades();
    fetchStudents();
  }, []);

  // Fetch students from backend API
  const fetchStudents = async () => {
    try {
      const studentsData = await studentApi.getAll();
      setStudents(studentsData);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setStudents([]);
    }
  };

  // Fetch all assignments
  const fetchAllAssignments = async () => {
    try {
      const assignmentsData = await gradeApi.getAllAssignments();
      setAllAssignments(assignmentsData);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      setAllAssignments([]);
    }
  };

  const fetchGrades = async () => {
    try {
      setLoading(true);
      
      // Fetch grades from backend API
      const gradesData = await gradeApi.getAll();
      setGrades(gradesData);
      
      // Always fetch students to ensure we have the latest data
      await fetchStudents();
      
      // Refresh dashboard counts
      if (window.refreshDashboard) {
        await window.refreshDashboard();
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGrade = async () => {
    if (newGrade.grade && newGrade.grade_part) {
      try {
        await gradeApi.create({
          grade: newGrade.grade,
          grade_part: newGrade.grade_part
        });
        
        setNewGrade({ grade: 0, grade_part: '' });
        await fetchGrades();
      } catch (error) {
        console.error('Failed to create grade:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to create grade. Please try again.';
        alert(errorMessage);
      }
    }
  };

  const handleAssignStudent = async (studentId: number, gradeId: number) => {
    console.log('handleAssignStudent called with:', { studentId, gradeId });
    
    try {
      const grade = grades.find(g => g.id === gradeId);
      if (!grade) {
        console.error('Grade not found:', gradeId);
        alert('Grade not found');
        return;
      }
      
      console.log('Found grade:', grade);
      
      // Get student from backend API
      const student = students.find((s: Student) => s.id === studentId);
      if (!student) {
        console.error('Student not found:', studentId);
        alert('Student not found in registered students');
        return;
      }
      
      console.log('Found student:', student);
      
      const isStudentAssigned = grade.students?.some(s => s.id === studentId) || false;
      console.log('Is student assigned?', isStudentAssigned);
      
      if (isStudentAssigned) {
        // Remove student from grade
        console.log('Removing student from grade...');
        try {
          await gradeApi.removeStudent(gradeId, studentId);
          console.log(`Removed student ${student.first_name} ${student.last_name} from grade ${grade.grade}-${grade.grade_part}`);
        } catch (error) {
          console.error('Removal API error:', error);
          throw error;
        }
      } else {
        // Check if student is already assigned to any other grade
        const isAssignedElsewhere = grades.some(g => 
          g.id !== gradeId && g.students?.some(s => s.id === studentId)
        );
        
        if (isAssignedElsewhere) {
          alert('This student is already assigned to another grade. A student can only be assigned to one grade at a time.');
          return;
        }
        
        // Assign student to grade
        console.log('Assigning student to grade...');
        try {
          await gradeApi.assignStudent(gradeId, studentId);
          console.log(`Assigned student ${student.first_name} ${student.last_name} to grade ${grade.grade}-${grade.grade_part}`);
        } catch (error) {
          console.error('Assignment API error:', error);
          throw error;
        }
      }
      
      console.log('Refreshing grades...');
      await fetchGrades();
      console.log('Done!');
    } catch (error) {
      console.error('Failed to assign/remove student:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update student assignment. Please try again.';
      alert(errorMessage);
    }
  };

  const openStudentAssignment = (gradeId: number) => {
    setSelectedGrade(gradeId);
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

  const handleDownloadPDF = (grade: Grade) => {
    // Create PDF document
    const doc = new jsPDF();
    
    // Generate PDF content
    generateGradePDF(doc, grade);
    
    // Save the PDF
    doc.save(`Grade-${grade.grade}-${grade.grade_part}-Students.pdf`);
  };

  const generateGradePDF = (doc: jsPDF, grade: Grade) => {
    const students = grade.students || [];
    const currentDate = new Date().toLocaleDateString();
    
    // Set font
    doc.setFont('helvetica');
    
    // Title
    doc.setFontSize(20);
    doc.text('EduTrack Management System', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text(`Grade ${grade.grade}-${grade.grade_part} Student List`, 105, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${currentDate}`, 105, 37, { align: 'center' });
    
    // Line separator
    doc.setLineWidth(0.5);
    doc.line(20, 42, 190, 42);
    
    let yPosition = 55;
    
    if (students.length > 0) {
      // Total students
      doc.setFontSize(12);
      doc.text(`Total Students: ${students.length}`, 20, yPosition);
      yPosition += 10;
      
      // Table headers
      doc.setFontSize(10);
      doc.text('No.', 20, yPosition);
      doc.text('Student Name', 35, yPosition);
      doc.text('Parent Phone', 100, yPosition);
      doc.text('Assigned Date', 150, yPosition);
      
      // Line under headers
      doc.line(20, yPosition + 2, 190, yPosition + 2);
      yPosition += 8;
      
      // Student data
      students.forEach((student, index) => {
        if (yPosition > 270) {
          // Add new page if needed
          doc.addPage();
          yPosition = 20;
          
          // Repeat headers on new page
          doc.text('No.', 20, yPosition);
          doc.text('Student Name', 35, yPosition);
          doc.text('Parent Phone', 100, yPosition);
          doc.text('Assigned Date', 150, yPosition);
          doc.line(20, yPosition + 2, 190, yPosition + 2);
          yPosition += 8;
        }
        
        doc.text((index + 1).toString(), 20, yPosition);
        doc.text(`${student.first_name} ${student.last_name}`, 35, yPosition);
        doc.text(student.parent_phone, 100, yPosition);
        doc.text(student.assigned_at ? new Date(student.assigned_at).toLocaleDateString() : 'N/A', 150, yPosition);
        
        yPosition += 7;
      });
    } else {
      doc.setFontSize(12);
      doc.text('No students assigned to this grade yet.', 20, yPosition);
    }
    
    // Footer
    const footerY = 280;
    doc.line(20, footerY, 190, footerY);
    
    doc.setFontSize(10);
    doc.text(`Grade: ${grade.grade}-${grade.grade_part}`, 20, footerY + 5);
    doc.text(`Total Students: ${students.length}`, 60, footerY + 5);
    doc.text('Report Type: Student List', 110, footerY + 5);
    
    doc.setFontSize(8);
    doc.text('© EduTrack Management System', 105, footerY + 15, { align: 'center' });
  };

  const handleUpdateGrade = async () => {
    if (editingGrade) {
      try {
        // Update grade via API
        await gradeApi.update(editingGrade.id, {
          grade: editingGrade.grade,
          grade_part: editingGrade.grade_part
        });
        
        await fetchGrades();
        setShowEditModal(false);
        setEditingGrade(null);
      } catch (error) {
        console.error('Failed to update grade:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update grade. Please try again.';
        alert(errorMessage);
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
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete grade. Please try again.';
            alert(errorMessage);
          }
    }
  };

  const clearAllGrades = async () => {
    if (confirm('Are you sure you want to delete all grades? This action cannot be undone.')) {
      try {
        await gradeApi.clearAll();
        await fetchGrades();
      } catch (error) {
            console.error('Failed to clear grades:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to clear grades. Please try again.';
            alert(errorMessage);
          }
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0e27 0%, #151923 25%, #0a0e27 50%, #151923 75%, #0a0e27 100%)',
        padding: '20px',
        fontFamily: '"SF Mono", "Fira Code", "JetBrains Mono", monospace',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#e2e8f0'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
          <div>Loading Grade Management System...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f766e 0%, #134e4a 25%, #115e59 50%, #134e4a 75%, #0f766e 100%)',
      padding: '20px',
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      color: '#e2e8f0',
      position: 'relative'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '16px',
        border: '3px solid #000000',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)',
        padding: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#10b981',
              marginBottom: '8px',
              textShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
            }}>
              📚 Grade Management
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#94a3b8',
              margin: 0
            }}>
              Create and manage school grades with student assignments
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                fetchAllAssignments();
                setShowAllAssignments(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
              }}
            >
              📋 View All Assignments
            </button>
            <button
              onClick={clearAllGrades}
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
              }}
            >
              🗑️ Clear All
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '30px'
        }}>
          <div>
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '12px',
              border: '2px solid #10b981',
              padding: '20px'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#10b981',
                marginBottom: '20px',
                marginTop: 0
              }}>
                ➕ Add New Grade
              </h2>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#94a3b8',
                    marginBottom: '6px',
                    fontWeight: '500'
                  }}>
                    Grade Number *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="13"
                    value={newGrade.grade || ''}
                    onChange={(e) => setNewGrade({...newGrade, grade: parseInt(e.target.value) || 0})}
                    placeholder="Enter Grade (e.g., 12)"
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#e2e8f0',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#94a3b8',
                    marginBottom: '6px',
                    fontWeight: '500'
                  }}>
                    Stream/Section *
                  </label>
                  <input
                    type="text"
                    value={newGrade.grade_part}
                    onChange={(e) => setNewGrade({...newGrade, grade_part: e.target.value})}
                    placeholder="e.g., Science A, Commerce A"
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#e2e8f0',
                      outline: 'none',
                      textTransform: 'capitalize'
                    }}
                  />
                </div>
                <button
                  onClick={handleAddGrade}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  ✨ Create Grade
                </button>
              </div>
            </div>
          </div>

          <div>
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              borderRadius: '12px',
              border: '2px solid #6366f1',
              padding: '20px',
              maxHeight: '600px',
              overflowY: 'auto'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#6366f1',
                marginBottom: '20px',
                marginTop: 0
              }}>
                📋 Registered Grades ({grades.length})
              </h2>
              {grades.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#94a3b8'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>No grades registered yet</div>
                  <div style={{ fontSize: '14px' }}>Create your first grade to get started</div>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gap: '15px'
                }}>
                  {grades.map(grade => (
                    <div
                      key={grade.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '2px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '12px',
                        padding: '20px',
                        position: 'relative'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '20px',
                            fontWeight: '700',
                            color: '#6366f1',
                            marginBottom: '8px'
                          }}>
                            {grade.grade}-{grade.grade_part}
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: '#94a3b8',
                            marginBottom: '12px'
                          }}>
                            📅 Created: {new Date(grade.created_at || '').toLocaleDateString()}
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: '#10b981',
                            fontWeight: '600',
                            marginBottom: '8px'
                          }}>
                            👥 {grade.students?.length || 0} students assigned
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: '8px'
                        }}>
                          <button
                            onClick={() => openStudentAssignment(grade.id)}
                            style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px 16px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            👥 Assign
                          </button>
                          <button
                            onClick={() => handleEditGrade(grade)}
                            style={{
                              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px 16px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(grade)}
                            style={{
                              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px 16px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            📄 PDF
                          </button>
                          <button
                            onClick={() => handleDeleteGrade(grade.id)}
                            style={{
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px 16px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Student Assignment Modal */}
        {showStudentAssignment && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '2px solid #10b981',
              borderRadius: '16px',
              padding: '30px',
              maxWidth: '700px',
              width: '90%',
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
                    color: '#10b981',
                    margin: '0 0 8px 0'
                  }}>
                    🎓 Student Assignment
                  </h2>
                  <p style={{
                    fontSize: '14px',
                    color: '#94a3b8',
                    margin: 0
                  }}>
                    Target: {grades.find(g => g.id === selectedGrade)?.grade}-{grades.find(g => g.id === selectedGrade)?.grade_part}
                  </p>
                </div>
                <button
                  onClick={closeStudentAssignment}
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

              {students.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#94a3b8'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>No students registered</div>
                  <div style={{ fontSize: '14px' }}>Register students first before assigning them to grades</div>
                </div>
              ) : (
                <>
                  {/* Assigned to Current Grade Section */}
                  {(() => {
                    const assignedToCurrentGrade = students.filter(student => 
                      grades.find(g => g.id === selectedGrade)?.students?.some(s => s.id === student.id)
                    );
                    
                    if (assignedToCurrentGrade.length > 0) {
                      return (
                        <div style={{ marginBottom: '20px' }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#10b981',
                            marginBottom: '12px',
                            textAlign: 'center'
                          }}>
                            ✅ Assigned to This Grade ({assignedToCurrentGrade.length})
                          </h3>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}>
                            {assignedToCurrentGrade.map(student => (
                              <div
                                key={student.id}
                                style={{
                                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)',
                                  border: '2px solid #10b981',
                                  borderRadius: '8px',
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  position: 'relative',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px'
                                }}
                                onClick={() => handleAssignStudent(student.id, selectedGrade!)}
                              >
                                <div style={{
                                  position: 'absolute',
                                  top: '6px',
                                  right: '6px',
                                  background: '#10b981',
                                  color: 'white',
                                  borderRadius: '4px',
                                  padding: '2px 6px',
                                  fontSize: '10px',
                                  fontWeight: '600'
                                }}>
                                  ✓
                                </div>
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '16px',
                                  color: 'white',
                                  fontWeight: '700',
                                  flexShrink: 0
                                }}>
                                  {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#ffffff',
                                    marginBottom: '2px',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
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
                                <div style={{
                                  fontSize: '11px',
                                  color: '#10b981',
                                  fontWeight: '600',
                                  opacity: 0.8
                                }}>
                                  Click to remove
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  
                  {/* Available Students Section */}
                  {(() => {
                    const availableStudents = students.filter(student => {
                      // Check if student is assigned to ANY grade
                      const isAssignedToAnyGrade = grades.some(g => 
                        g.students?.some(s => s.id === student.id)
                      );
                      // Only show students who are not assigned to any grade
                      return !isAssignedToAnyGrade;
                    });
                    
                    if (availableStudents.length > 0) {
                      return (
                        <div>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#6366f1',
                            marginBottom: '12px',
                            textAlign: 'center'
                          }}>
                            ➕ Available to Assign ({availableStudents.length})
                          </h3>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}>
                            {availableStudents.map(student => (
                              <div
                                key={student.id}
                                style={{
                                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                                  border: '2px solid #6366f1',
                                  borderRadius: '8px',
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px'
                                }}
                                onClick={() => handleAssignStudent(student.id, selectedGrade!)}
                              >
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '16px',
                                  color: 'white',
                                  fontWeight: '700',
                                  flexShrink: 0
                                }}>
                                  {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#1e293b',
                                    marginBottom: '2px',
                                    textShadow: '0 1px 2px rgba(255,255,255,0.3)'
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
                                <div style={{
                                  fontSize: '11px',
                                  color: '#6366f1',
                                  fontWeight: '600',
                                  opacity: 0.8
                                }}>
                                  Click to assign
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </>
              )}
            </div>
          </div>
        )}

        {/* Edit Grade Modal */}
        {showEditModal && editingGrade && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '2px solid #3b82f6',
              borderRadius: '16px',
              padding: '30px',
              maxWidth: '500px',
              width: '90%'
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
                    ✏️ Edit Grade
                  </h2>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#94a3b8',
                    marginBottom: '6px',
                    fontWeight: '500'
                  }}>
                    Grade Number *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="13"
                    value={editingGrade.grade}
                    onChange={(e) => setEditingGrade({...editingGrade, grade: parseInt(e.target.value) || 0})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#e2e8f0',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#94a3b8',
                    marginBottom: '6px',
                    fontWeight: '500'
                  }}>
                    Stream/Section *
                  </label>
                  <input
                    type="text"
                    value={editingGrade.grade_part}
                    onChange={(e) => setEditingGrade({...editingGrade, grade_part: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#e2e8f0',
                      outline: 'none',
                      textTransform: 'capitalize'
                    }}
                  />
                </div>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '10px'
                }}>
                  <button
                    onClick={handleUpdateGrade}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    💾 Update Grade
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Assignments Modal */}
        {showAllAssignments && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #0f766e 0%, #134e4a 100%)',
              borderRadius: '16px',
              border: '3px solid #000000',
              padding: '30px',
              maxWidth: '900px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              color: '#e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#10b981',
                  margin: 0
                }}>
                  📋 All Student Assignments
                </h2>
                <button
                  onClick={() => setShowAllAssignments(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#e2e8f0',
                    fontSize: '24px',
                    cursor: 'pointer'
                  }}
                >
                  ❌
                </button>
              </div>

              {allAssignments.length > 0 ? (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse'
                  }}>
                    <thead>
                      <tr style={{
                        borderBottom: '2px solid #10b981'
                      }}>
                        <th style={{ padding: '10px', textAlign: 'left', color: '#10b981' }}>Student ID</th>
                        <th style={{ padding: '10px', textAlign: 'left', color: '#10b981' }}>Student Name</th>
                        <th style={{ padding: '10px', textAlign: 'left', color: '#10b981' }}>Grade</th>
                        <th style={{ padding: '10px', textAlign: 'left', color: '#10b981' }}>Section</th>
                        <th style={{ padding: '10px', textAlign: 'left', color: '#10b981' }}>Assigned At</th>
                        <th style={{ padding: '10px', textAlign: 'left', color: '#10b981' }}>Updated At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allAssignments.map((assignment, index) => (
                        <tr key={index} style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <td style={{ padding: '10px' }}>{assignment.student_id}</td>
                          <td style={{ padding: '10px' }}>
                            {assignment.first_name} {assignment.last_name}
                          </td>
                          <td style={{ padding: '10px' }}>{assignment.grade}</td>
                          <td style={{ padding: '10px' }}>{assignment.section}</td>
                          <td style={{ padding: '10px' }}>
                            {new Date(assignment.assigned_at).toLocaleString()}
                          </td>
                          <td style={{ padding: '10px' }}>
                            {assignment.updated_at ? new Date(assignment.updated_at).toLocaleString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#94a3b8'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
                  <div>No student assignments found</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeManagement;
