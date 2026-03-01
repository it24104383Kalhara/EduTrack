import React, { useState, useEffect } from 'react';
import { gradeApi, studentApi } from '../services/api';
import type { Grade, Student } from '../services/api';

const MarksManagement: React.FC = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [showMarksPage, setShowMarksPage] = useState(false);
  const [showTermSelection, setShowTermSelection] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);

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

  const handleGradeSelect = (grade: Grade) => {
    setSelectedGrade(grade);
    setShowTermSelection(true);
  };

  const handleTermSelect = (term: string) => {
    setSelectedTerm(term);
    setShowTermSelection(false);
    setShowMarksPage(true);
  };

  const closeMarksPage = () => {
    setShowMarksPage(false);
    setSelectedTerm(null);
    setSelectedGrade(null);
  };

  const closeTermSelection = () => {
    setShowTermSelection(false);
    setSelectedGrade(null);
  };

  const getGradeStudents = () => {
    if (!selectedGrade) return [];
    return students.filter(student => 
      selectedGrade.students?.some(s => s.id === student.id)
    );
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f766e 0%, #134e4a 25%, #115e59 50%, #134e4a 75%, #0f766e 100%)',
        padding: '40px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '18px',
        color: '#e2e8f0',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
          <div>Loading Marks Management System...</div>
        </div>
      </div>
    );
  }

  // Show term selection when grade is selected
  if (showTermSelection && selectedGrade) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f766e 0%, #134e4a 25%, #115e59 50%, #134e4a 75%, #0f766e 100%)',
        padding: '40px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '18px',
        color: '#e2e8f0',
        position: 'relative'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '24px',
          border: '3px solid #000000',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          padding: '60px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
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
                📚 Select Term - {selectedGrade.grade}-{selectedGrade.grade_part}
              </h1>
              <p style={{
                fontSize: '16px',
                color: '#94a3b8',
                margin: 0
              }}>
                {getGradeStudents().length} students assigned • Choose a term to manage marks
              </p>
            </div>
            <button
              onClick={closeTermSelection}
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
              }}
            >
              ← Back to Grades
            </button>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '60px 40px'
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '20px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 4px 8px rgba(99, 102, 241, 0.3))',
              animation: 'float 3s ease-in-out infinite'
            }}>
              📅
            </div>
            <h2 style={{
              fontSize: '32px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '16px',
              margin: '0 0 16px 0',
              letterSpacing: '-0.5px'
            }}>
              Select Academic Term
            </h2>
            <p style={{
              fontSize: '18px',
              color: '#94a3b8',
              marginBottom: '50px',
              maxWidth: '600px',
              margin: '0 auto 50px',
              lineHeight: '1.6'
            }}>
              Choose the academic term for which you want to manage marks and assessments
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '30px',
              maxWidth: '1000px',
              margin: '0 auto'
            }}>
              {[
                { 
                  term: 'First Term', 
                  number: '01', 
                  icon: '🌱',
                  color: '#10b981',
                  bgColor: 'rgba(16, 185, 129, 0.1)',
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                  description: 'Beginning of academic journey'
                },
                { 
                  term: 'Second Term', 
                  number: '02', 
                  icon: '🌿',
                  color: '#f59e0b',
                  bgColor: 'rgba(245, 158, 11, 0.1)',
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                  description: 'Mid-term progress evaluation'
                },
                { 
                  term: 'Third Term', 
                  number: '03', 
                  icon: '🌳',
                  color: '#8b5cf6',
                  bgColor: 'rgba(139, 92, 246, 0.1)',
                  borderColor: 'rgba(139, 92, 246, 0.3)',
                  description: 'Final term assessments'
                }
              ].map((termData) => (
                <div
                  key={termData.term}
                  onClick={() => handleTermSelect(termData.term)}
                  style={{
                    background: `linear-gradient(135deg, ${termData.bgColor} 0%, rgba(255, 255, 255, 0.02) 100%)`,
                    border: `2px solid ${termData.borderColor}`,
                    borderRadius: '20px',
                    padding: '40px 30px',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                    e.currentTarget.style.boxShadow = `0 20px 40px ${termData.borderColor}`;
                    e.currentTarget.style.borderColor = termData.color;
                    e.currentTarget.style.background = `linear-gradient(135deg, ${termData.bgColor} 0%, ${termData.borderColor} 100%)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = termData.borderColor;
                    e.currentTarget.style.background = `linear-gradient(135deg, ${termData.bgColor} 0%, rgba(255, 255, 255, 0.02) 100%)`;
                  }}
                >
                  {/* Background decoration */}
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '100px',
                    height: '100px',
                    background: `linear-gradient(135deg, ${termData.color} 0%, transparent 70%)`,
                    borderRadius: '50%',
                    opacity: '0.1'
                  }} />
                  
                  <div style={{ 
                    position: 'absolute',
                    bottom: '-20px',
                    left: '-20px',
                    width: '80px',
                    height: '80px',
                    background: `linear-gradient(135deg, ${termData.color} 0%, transparent 70%)`,
                    borderRadius: '50%',
                    opacity: '0.1'
                  }} />

                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{
                      fontSize: '48px',
                      marginBottom: '16px',
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                    }}>
                      {termData.icon}
                    </div>
                    
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      color: termData.color,
                      marginBottom: '8px',
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      opacity: '0.8'
                    }}>
                      Term {termData.number}
                    </div>
                    
                    <h3 style={{
                      fontSize: '24px',
                      fontWeight: '800',
                      color: termData.color,
                      marginBottom: '12px',
                      margin: '0 0 12px 0',
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {termData.term}
                    </h3>
                    
                    <p style={{
                      fontSize: '15px',
                      color: '#94a3b8',
                      marginBottom: '24px',
                      lineHeight: '1.5',
                      fontStyle: 'italic'
                    }}>
                      {termData.description}
                    </p>
                    
                    <div style={{
                      background: `linear-gradient(135deg, ${termData.color} 0%, ${termData.color}dd 100%)`,
                      color: 'white',
                      padding: '14px 28px',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '700',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: `0 8px 20px ${termData.color}40`,
                      transition: 'all 0.3s ease'
                    }}>
                      <span>Select Term</span>
                      <span style={{ 
                        fontSize: '18px',
                        transition: 'transform 0.3s ease'
                      }}>
                        →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show empty marks page when grade and term are selected
  if (showMarksPage && selectedGrade && selectedTerm) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f766e 0%, #134e4a 25%, #115e59 50%, #134e4a 75%, #0f766e 100%)',
        padding: '40px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '18px',
        color: '#e2e8f0',
        position: 'relative'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '24px',
          border: '3px solid #000000',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          padding: '60px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
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
                📝 Marks Entry - {selectedGrade.grade}-{selectedGrade.grade_part} • {selectedTerm}
              </h1>
              <p style={{
                fontSize: '16px',
                color: '#94a3b8',
                margin: 0
              }}>
                {getGradeStudents().length} students assigned • Ready for marks implementation
              </p>
            </div>
            <button
              onClick={closeMarksPage}
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
              }}
            >
              ← Back to Grades
            </button>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '80px 40px',
            background: 'rgba(99, 102, 241, 0.1)',
            borderRadius: '16px',
            border: '2px solid #6366f1'
          }}>
            <div style={{
              fontSize: '72px',
              marginBottom: '30px',
              opacity: '0.8'
            }}>
              📝
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#6366f1',
              marginBottom: '16px',
              margin: '0 0 16px 0'
            }}>
              Empty Marks Page
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#94a3b8',
              marginBottom: '24px',
              lineHeight: '1.6',
              maxWidth: '600px',
              margin: '0 auto 24px'
            }}>
              This is the empty page where marks entry functionality will be implemented.<br/>
              You can add forms for entering marks, assessments, and evaluations here.
            </p>
            <div style={{
              display: 'flex',
              gap: '20px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '2px solid #10b981',
                borderRadius: '12px',
                padding: '20px',
                minWidth: '200px'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '12px' }}>📊</div>
                <div style={{ fontSize: '14px', color: '#10b981', fontWeight: '600' }}>Assessment Types</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Exams, Tests, Assignments</div>
              </div>
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '2px solid #f59e0b',
                borderRadius: '12px',
                padding: '20px',
                minWidth: '200px'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '12px' }}>📈</div>
                <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: '600' }}>Performance Tracking</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Grades & Analytics</div>
              </div>
              <div style={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '2px solid #8b5cf6',
                borderRadius: '12px',
                padding: '20px',
                minWidth: '200px'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '12px' }}>📋</div>
                <div style={{ fontSize: '14px', color: '#8b5cf6', fontWeight: '600' }}>Report Generation</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Progress Reports</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f766e 0%, #134e4a 25%, #115e59 50%, #134e4a 75%, #0f766e 100%)',
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
          padding: '0px 40px 40px 40px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px',
            filter: 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.5))',
            animation: 'pulse 2s infinite'
          }}>
            📝
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            color: '#10b981',
            marginBottom: '16px',
            textShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
            letterSpacing: '-1px'
          }}>
            Marks Management
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
            Select a grade to manage student marks, assessments, and academic performance tracking
          </p>
          
          {/* Grades Grid */}
          <div style={{
            background: 'rgba(99, 102, 241, 0.1)',
            borderRadius: '16px',
            border: '2px solid #6366f1',
            padding: '30px',
            marginTop: '20px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#6366f1',
              marginBottom: '25px',
              textAlign: 'center',
              marginTop: 0
            }}>
              📚 Available Grades ({grades.length})
            </h2>
            
            {grades.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#94a3b8'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>No grades found</div>
                <div style={{ fontSize: '14px' }}>Please create grades in Grade Management first</div>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
              }}>
                {grades.map((grade, index) => (
                  <div
                    key={grade.id}
                    onClick={() => handleGradeSelect(grade)}
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                      border: '2px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '16px',
                      padding: '20px 25px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(5px)';
                      e.currentTarget.style.boxShadow = '0 15px 40px rgba(99, 102, 241, 0.3)';
                      e.currentTarget.style.borderColor = '#6366f1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        color: 'white',
                        fontWeight: '700',
                        flexShrink: 0
                      }}>
                        {index + 1}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '22px',
                          fontWeight: '700',
                          color: '#6366f1',
                          marginBottom: '8px',
                          textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                          Grade {grade.grade}-{grade.grade_part}
                        </div>
                        
                        <div style={{
                          fontSize: '14px',
                          color: '#94a3b8',
                          marginBottom: '6px',
                          lineHeight: '1.4'
                        }}>
                          📅 Created: {new Date(grade.created_at || '').toLocaleDateString()}
                        </div>
                        
                        <div style={{
                          fontSize: '15px',
                          color: '#10b981',
                          fontWeight: '600'
                        }}>
                          👥 {grade.students?.length || 0} students assigned
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      padding: '12px 20px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      textAlign: 'center',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      📝 Manage Marks
                      <span style={{ fontSize: '16px' }}>→</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarksManagement;
