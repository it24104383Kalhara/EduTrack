import React, { useState, useEffect } from 'react';
import { gradeApi, studentApi } from '../services/api';
import type { Grade, Student } from '../services/api';
import MarksEntry from './MarksEntry';

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
        padding: '24px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        color: '#e2e8f0',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', marginBottom: '8px' }}>⏳</div>
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
        background: '#F9FAFB',
        padding: '12px',
        fontFamily: 'Inter, sans-serif',
        position: 'relative'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 4px 20px rgba(99, 49, 148, 0.1)',
          padding: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid #E5E7EB'
          }}>
            <div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#633194',
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif'
              }}>
                📚 Select Term - {selectedGrade.grade}-{selectedGrade.grade_part}
              </h1>
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                margin: 0,
                fontFamily: 'Inter, sans-serif'
              }}>
                {getGradeStudents().length} students assigned • Choose a term to manage marks
              </p>
            </div>
            <button
              onClick={closeTermSelection}
              style={{
                background: 'linear-gradient(135deg, #633194 0%, #4B2380 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 2px 8px rgba(99, 49, 148, 0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              ← Back to Grades
            </button>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '32px 16px'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
              color: '#633194',
              filter: 'drop-shadow(0 2px 4px rgba(99, 49, 148, 0.2))'
            }}>
              📅
            </div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '600',
              color: '#1F2937',
              marginBottom: '12px',
              fontFamily: 'Inter, sans-serif'
            }}>
              Select Academic Term
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              marginBottom: '32px',
              maxWidth: '600px',
              margin: '0 auto 32px',
              lineHeight: '1.6',
              fontFamily: 'Inter, sans-serif'
            }}>
              Choose the academic term for which you want to manage marks and assessments
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              maxWidth: '850px',
              margin: '0 auto'
            }}>
              {[
                { 
                  term: 'First Term', 
                  number: '01', 
                  icon: '🌱',
                  color: '#633194',
                  bgColor: '#F4F0FF',
                  borderColor: '#633194',
                  description: 'Start of year'
                },
                { 
                  term: 'Second Term', 
                  number: '02', 
                  icon: '🌿',
                  color: '#633194',
                  bgColor: '#F4F0FF',
                  borderColor: '#633194',
                  description: 'Mid-term eval'
                },
                { 
                  term: 'Third Term', 
                  number: '03', 
                  icon: '🌳',
                  color: '#633194',
                  bgColor: '#F4F0FF',
                  borderColor: '#633194',
                  description: 'Final assessments'
                }
              ].map((termData) => (
                <div
                  key={termData.term}
                  onClick={() => handleTermSelect(termData.term)}
                  style={{
                    background: termData.bgColor,
                    border: `2px solid ${termData.borderColor}`,
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 6px 15px rgba(99, 49, 148, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: '32px',
                      marginBottom: '8px'
                    }}>
                      {termData.icon}
                    </div>
                    
                    <div style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      color: termData.color,
                      marginBottom: '4px',
                      textTransform: 'uppercase'
                    }}>
                      Term {termData.number}
                    </div>
                    
                    <h3 style={{
                      fontSize: '17px',
                      fontWeight: '600',
                      color: '#1F2937',
                      marginBottom: '4px',
                      margin: '0 0 4px 0'
                    }}>
                      {termData.term}
                    </h3>
                    
                    <p style={{
                      fontSize: '12px',
                      color: '#6B7280',
                      margin: '0 0 12px 0'
                    }}>
                      {termData.description}
                    </p>
                    
                    <div style={{
                      background: termData.color,
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>Select Term</span>
                      <span style={{ fontSize: '14px' }}>→</span>
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

  // Show marks entry page when grade and term are selected
  if (showMarksPage && selectedGrade && selectedTerm) {
    return (
      <MarksEntry
        grade={selectedGrade}
        term={selectedTerm}
        onBack={() => {
          setShowMarksPage(false);
          setSelectedTerm(null);
          setSelectedGrade(null);
        }}
      />
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      padding: '12px',
      fontFamily: 'Inter, sans-serif',
      position: 'relative'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 4px 20px rgba(99, 49, 148, 0.1)',
        padding: '24px'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '0px 24px 24px 24px'
        }}>
          <div style={{
            fontSize: '40px',
            marginBottom: '16px',
            color: '#633194',
            filter: 'drop-shadow(0 2px 4px rgba(99, 49, 148, 0.2))'
          }}>
            📝
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: '#633194',
            marginBottom: '12px',
            fontFamily: 'Inter, sans-serif'
          }}>
            Marks Management
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            marginBottom: '24px',
            maxWidth: '700px',
            fontFamily: 'Inter, sans-serif',
            margin: '0 auto 24px',
            lineHeight: '1.6',
            fontWeight: '400'
          }}>
            Select a grade to manage student marks, assessments, and academic performance tracking
          </p>
          
          {/* Grades Grid */}
          <div style={{
            background: '#F4F0FF',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            padding: '24px',
            marginTop: '16px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#633194',
              marginBottom: '20px',
              textAlign: 'center',
              marginTop: 0,
              fontFamily: 'Inter, sans-serif'
            }}>
              📚 Available Grades ({grades.length})
            </h2>
            
            {grades.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '32px',
                color: '#6B7280',
                fontFamily: 'Inter, sans-serif'
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px', color: '#633194' }}>📚</div>
                <div style={{ fontSize: '16px', marginBottom: '6px', fontWeight: '600', color: '#1F2937' }}>No grades found</div>
                <div style={{ fontSize: '13px' }}>Please create grades in Grade Management first</div>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {grades.map((grade, index) => (
                  <div
                    key={grade.id}
                    onClick={() => handleGradeSelect(grade)}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(99, 49, 148, 0.15)';
                      e.currentTarget.style.borderColor = '#633194';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                      e.currentTarget.style.borderColor = '#E5E7EB';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #633194 0%, #4B2380 100%)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        color: 'white',
                        fontWeight: '600',
                        flexShrink: 0,
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        {index + 1}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: '#1F2937',
                          marginBottom: '6px',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          Grade {grade.grade}-{grade.grade_part}
                        </div>
                        
                        <div style={{
                          fontSize: '13px',
                          color: '#6B7280',
                          marginBottom: '4px',
                          lineHeight: '1.4',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          📅 Created: {new Date(grade.created_at || '').toLocaleDateString()}
                        </div>
                        
                        <div style={{
                          fontSize: '14px',
                          color: '#10b981',
                          fontWeight: '500',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          👥 {grade.students?.length || 0} students assigned
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'linear-gradient(135deg, #633194 0%, #4B2380 100%)',
                      color: 'white',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      textAlign: 'center',
                      boxShadow: '0 2px 8px rgba(99, 49, 148, 0.3)',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontFamily: 'Inter, sans-serif',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 49, 148, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 49, 148, 0.3)';
                    }}>
                      📝 Manage
                      <span style={{ fontSize: '14px' }}>→</span>
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
