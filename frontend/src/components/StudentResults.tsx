import React, { useState, useEffect } from 'react';
import { gradeApi, resultsApi, reportCardApi } from '../services/api';
import type { Grade } from '../services/api';

const StudentResults: React.FC = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  
  const [classResults, setClassResults] = useState<any[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  
  const [selectedStudentResult, setSelectedStudentResult] = useState<any | null>(null);
  const [studentResultLoading, setStudentResultLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    fetchGrades();
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

  const handleGradeSelect = (grade: Grade) => {
    setSelectedGrade(grade);
    setSelectedTerm(null);
    setSelectedStudentResult(null);
  };

  const handleTermSelect = (term: string) => {
    setSelectedTerm(term);
    setSelectedStudentResult(null);
    fetchClassResults(selectedGrade!.id!, term);
  };

  const fetchClassResults = async (gradeId: number, term: string) => {
    try {
      setResultsLoading(true);
      const data = await resultsApi.getMeritList(gradeId, term);
      setClassResults(data || []);
    } catch (error) {
      console.error('Failed to fetch class results:', error);
      setClassResults([]);
    } finally {
      setResultsLoading(false);
    }
  };

  const handleViewResult = async (studentId: number) => {
    if (!selectedGrade || !selectedTerm) return;
    
    try {
      setStudentResultLoading(true);
      const data = await resultsApi.getStudentResultWithRank(studentId, selectedGrade.id!, selectedTerm);
      setSelectedStudentResult({ ...data, studentId });
    } catch (error) {
      console.error('Failed to fetch student result:', error);
    } finally {
      setStudentResultLoading(false);
    }
  };

  const handleDownloadReportCard = async (studentId: number) => {
    if (!selectedGrade || !selectedTerm) return;
    
    try {
      setGeneratingPdf(true);
      const blob = await reportCardApi.downloadReportCard(studentId, selectedGrade.id!, selectedTerm);
      
      // Create object URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Report_Card_${studentId}_${selectedTerm.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Failed to download report card:', error);
      alert('Failed to generate report card PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', marginBottom: '8px' }}>⏳</div>
          <div>Loading Results System...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '12px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px', boxShadow: '0 4px 20px rgba(99, 49, 148, 0.1)' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', paddingBottom: '24px', borderBottom: '1px solid #E5E7EB', marginBottom: '24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px', color: '#633194' }}>📊</div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#633194', margin: '0 0 12px 0' }}>Class Results & Report Cards</h1>
          <p style={{ color: '#6B7280', margin: 0 }}>View class rankings, generate student report cards, and analyze performance.</p>
        </div>

        {/* Selection State 1: Choose Grade */}
        {!selectedGrade && (
          <div>
            <h2 style={{ fontSize: '20px', color: '#1F2937', marginBottom: '16px' }}>1. Select a Grade</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {grades.map(grade => (
                <div
                  key={grade.id}
                  onClick={() => handleGradeSelect(grade)}
                  style={{
                    background: '#F4F0FF', border: '2px solid transparent', borderRadius: '12px', padding: '20px',
                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#633194'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📚</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937' }}>Grade {grade.grade}-{grade.grade_part}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selection State 2: Choose Term */}
        {selectedGrade && !selectedTerm && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', color: '#1F2937', margin: 0 }}>
                2. Select Term for Grade {selectedGrade.grade}-{selectedGrade.grade_part}
              </h2>
              <button onClick={() => setSelectedGrade(null)} style={{ background: 'none', border: 'none', color: '#633194', cursor: 'pointer', fontWeight: '500' }}>← Back to Grades</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              {['First Term', 'Second Term', 'Third Term'].map((term, index) => (
                <div
                  key={term}
                  onClick={() => handleTermSelect(term)}
                  style={{
                    background: '#FFFFFF', border: '2px solid #E5E7EB', borderRadius: '12px', padding: '16px',
                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#633194'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 12px -3px rgba(0, 0, 0, 0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{['🌱', '🌿', '🌳'][index]}</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937' }}>{term}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* State 3: Show Class Results Array OR Individual Result */}
        {selectedGrade && selectedTerm && (
           <div>
             {/* Result Detail View */}
             {selectedStudentResult ? (
               <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                    <div>
                      <h2 style={{ fontSize: '24px', color: '#1F2937', margin: '0 0 8px 0' }}>Detailed Report Card</h2>
                      <div style={{ fontSize: '14px', color: '#6B7280' }}>{selectedStudentResult.result.student_name} • Grade {selectedGrade.grade}-{selectedGrade.grade_part} • {selectedTerm}</div>
                    </div>
                    <button onClick={() => setSelectedStudentResult(null)} style={{ background: '#F3F4F6', border: 'none', color: '#633194', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>← Back to Merit List</button>
                  </div>

                  {studentResultLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>Loading result details...</div>
                  ) : (
                    <div>
                      {/* Summary Cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center', border: '1px solid #E5E7EB' }}>
                          <div style={{ fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Rank</div>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#633194' }}>{selectedStudentResult.rank}</div>
                        </div>

                        <div style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center', border: '1px solid #E5E7EB' }}>
                          <div style={{ fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Total Marks</div>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981' }}>{selectedStudentResult.result.total_marks_obtained}</div>
                        </div>

                        <div style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center', border: '1px solid #E5E7EB' }}>
                          <div style={{ fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Percentage</div>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3B82F6' }}>{selectedStudentResult.result.overall_percentage.toFixed(1)}%</div>
                        </div>

                        <div style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center', border: '1px solid #E5E7EB' }}>
                          <div style={{ fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Class Average</div>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F59E0B' }}>{selectedStudentResult.class_average.toFixed(1)}%</div>
                        </div>
                      </div>

                      {/* Subject Marks Table */}
                      <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #E5E7EB' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#F3F4F6' }}>
                              <th style={{ padding: '12px 16px', color: '#374151', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #E5E7EB' }}>Subject</th>
                              <th style={{ padding: '12px 16px', color: '#374151', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #E5E7EB' }}>Marks</th>
                              <th style={{ padding: '12px 16px', color: '#374151', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #E5E7EB' }}>Grade</th>
                              <th style={{ padding: '12px 16px', color: '#374151', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #E5E7EB' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                             {selectedStudentResult.result.subject_marks.map((mark: any, index: number) => {
                               const isAbsent = mark.grade_obtained === 'AB';
                               const isPass = !isAbsent && mark.grade_obtained !== 'F';
                               const marksDisplay = isAbsent ? 'AB' : `${mark.marks_obtained}/${mark.max_marks}`;
                               return (
                                 <tr key={index} style={{ borderBottom: '1px solid #E5E7EB' }}>
                                   <td style={{ padding: '12px 16px', color: '#1F2937', fontSize: '14px' }}>{mark.subject_name} ({mark.subject_code})</td>
                                   <td style={{ padding: '12px 16px', color: '#1F2937', fontSize: '14px', fontWeight: '500' }}>{marksDisplay}</td>
                                   <td style={{ padding: '12px 16px', color: '#1F2937', fontSize: '14px', fontWeight: 'bold' }}>{mark.grade_obtained}</td>
                                   <td style={{ padding: '12px 16px', color: isAbsent ? '#6B7280' : (isPass ? '#10B981' : '#EF4444'), fontSize: '14px', fontWeight: '500' }}>
                                     {isAbsent ? 'Absent' : (isPass ? 'Pass' : 'Fail')}
                                   </td>
                                 </tr>
                               );
                             })}
                          </tbody>
                        </table>
                      </div>

                      {/* Download PDF Section */}
                      <div style={{ marginTop: '24px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleDownloadReportCard(selectedStudentResult.studentId)}
                          disabled={generatingPdf}
                          style={{
                            background: generatingPdf ? '#9CA3AF' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 24px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: generatingPdf ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)',
                            transition: 'all 0.2s'
                          }}
                        >
                          <span>{generatingPdf ? 'Generating PDF...' : '⬇️ Download Official Report Card'}</span>
                        </button>
                      </div>
                    </div>
                  )}
               </div>
             ) : (
               /* Class Merit List Table */
               <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                      <div>
                        <h2 style={{ fontSize: '24px', color: '#1F2937', margin: '0 0 8px 0' }}>Class Merit List</h2>
                        <div style={{ fontSize: '14px', color: '#6B7280' }}>Grade {selectedGrade.grade}-{selectedGrade.grade_part} • {selectedTerm}</div>
                      </div>
                      <button onClick={() => setSelectedTerm(null)} style={{ background: '#F3F4F6', border: 'none', color: '#374151', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>← Change Term</button>
                  </div>

                  {resultsLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>Loading merit list...</div>
                  ) : classResults.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                      No results found for this term. Ensure marks have been entered for students.
                    </div>
                  ) : (
                      <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                            <tr>
                              <th style={{ padding: '16px', color: '#374151', fontWeight: '600' }}>Rank</th>
                              <th style={{ padding: '16px', color: '#374151', fontWeight: '600' }}>Student Name</th>
                              <th style={{ padding: '16px', color: '#374151', fontWeight: '600' }}>Total Marks</th>
                              <th style={{ padding: '16px', color: '#374151', fontWeight: '600' }}>Percentage</th>
                              <th style={{ padding: '16px', color: '#374151', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {classResults.map((row, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB', ':hover': { backgroundColor: '#F9FAFB' } } as any}>
                                <td style={{ padding: '16px', fontWeight: 'bold', color: row.rank <= 3 ? '#633194' : '#4B5563' }}>
                                  {row.rank} {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : ''}
                                </td>
                                <td style={{ padding: '16px', color: '#1F2937' }}>{row.student_name}</td>
                                <td style={{ padding: '16px', color: '#1F2937', fontWeight: '500' }}>{row.total_marks} <span style={{ color: '#9CA3AF', fontSize: '12px' }}>/ {row.max_marks}</span></td>
                                <td style={{ padding: '16px', color: '#1F2937' }}>{row.overall_percentage?.toFixed(1) || '0.0'}%</td>
                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                  <button
                                    onClick={() => handleViewResult(row.student_id)}
                                    style={{
                                      background: 'white',
                                      border: '1px solid #D1D5DB',
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      color: '#374151',
                                      cursor: 'pointer',
                                      fontWeight: '500',
                                      fontSize: '13px',
                                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#9CA3AF'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
                                  >
                                    📄 View Report Card
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                  )}
               </div>
             )}
           </div>
        )}
      </div>
    </div>
  );
};

export default StudentResults;
