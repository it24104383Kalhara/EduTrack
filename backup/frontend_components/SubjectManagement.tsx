import React, { useState } from 'react';

interface Subject {
  id: string;
  name: string;
  code: string;
  grades: string[];
  stream?: string | string[];
  type: '6-11' | '12-13';
}

const SubjectManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [streams, setStreams] = useState<string[]>([]);
  const [nextId, setNextId] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    grades: [] as string[]
  });

  // Form states for Grade 6-11
  const [subject6to11, setSubject6to11] = useState({
    name: '',
    code: '',
    grades: [] as string[]
  });

  // Form states for Grade 12-13
  const [subject12to13, setSubject12to13] = useState({
    name: '',
    code: '',
    grades: [] as string[],
    streams: [] as string[]
  });

  const handleGrade6to11Change = (grade: string) => {
    setSubject6to11(prev => ({
      ...prev,
      grades: prev.grades.includes(grade)
        ? prev.grades.filter(g => g !== grade)
        : [...prev.grades, grade]
    }));
  };

  const handleGrade12to13Change = (grade: string) => {
    setSubject12to13(prev => ({
      ...prev,
      grades: prev.grades.includes(grade)
        ? prev.grades.filter(g => g !== grade)
        : [...prev.grades, grade]
    }));
  };

  const handleStreamChange = (stream: string) => {
    setSubject12to13(prev => ({
      ...prev,
      streams: prev.streams.includes(stream)
        ? prev.streams.filter(s => s !== stream)
        : [...prev.streams, stream]
    }));
  };

  const deleteSubject = (id: string) => {
    const subject = subjects.find(s => s.id === id);
    if (subject && confirm(`Are you sure you want to delete "${subject.name}"?`)) {
      setSubjects(prev => prev.filter(s => s.id !== id));
      alert(`Subject "${subject.name}" deleted successfully!`);
    }
  };

  const editSubject = (id: string) => {
    const subject = subjects.find(s => s.id === id);
    if (subject) {
      setEditForm({
        name: subject.name,
        code: subject.code,
        grades: subject.grades
      });
      setEditingId(id);
    }
  };

  const saveEdit = () => {
    if (!editingId) return;
    
    if (!editForm.name.trim() || !editForm.code.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (editForm.grades.length === 0) {
      alert('Please select at least one grade');
      return;
    }

    // Check for duplicate subject codes (excluding current subject)
    const existingCode = subjects.find(s => 
      s.code.toLowerCase() === editForm.code.toLowerCase() && 
      s.id !== editingId
    );
    
    if (existingCode) {
      alert(`Subject code "${editForm.code}" already exists. Please use a different code.`);
      return;
    }

    // Check for duplicate subjects in selected grades (excluding current subject)
    for (const grade of editForm.grades) {
      const existingSubject = subjects.find(s => 
        s.name.toLowerCase() === editForm.name.toLowerCase() && 
        s.grades.includes(grade) &&
        s.id !== editingId
      );
      
      if (existingSubject) {
        alert(`Subject "${editForm.name}" is already added to Grade ${grade}`);
        return;
      }
    }

    setSubjects(prev => prev.map(s => 
      s.id === editingId 
        ? { ...s, name: editForm.name.trim(), code: editForm.code.trim(), grades: editForm.grades }
        : s
    ));
    
    setEditingId(null);
    setEditForm({ name: '', code: '', grades: [] });
    alert(`Subject updated successfully!`);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', code: '', grades: [] });
  };

  const handleEditGradeChange = (grade: string) => {
    setEditForm(prev => ({
      ...prev,
      grades: prev.grades.includes(grade)
        ? prev.grades.filter(g => g !== grade)
        : [...prev.grades, grade]
    }));
  };

  const addStream = () => {
    const streamName = prompt('Enter stream name:');
    if (streamName && streamName.trim()) {
      setStreams(prev => [...prev, streamName.trim()]);
      alert(`Stream "${streamName.trim()}" added!`);
    }
  };

  const removeStream = () => {
    const streamName = prompt('Enter stream name to remove:');
    if (streamName && streamName.trim()) {
      setStreams(prev => prev.filter(s => s !== streamName.trim()));
      alert(`Stream "${streamName.trim()}" removed!`);
    }
  };

  const addSubject6to11 = () => {
    if (!subject6to11.name.trim() || !subject6to11.code.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (subject6to11.grades.length === 0) {
      alert('Please select at least one grade');
      return;
    }

    // Check for duplicate subject codes
    const existingCode = subjects.find(s => 
      s.code.toLowerCase() === subject6to11.code.toLowerCase()
    );
    
    if (existingCode) {
      alert(`Subject code "${subject6to11.code}" already exists. Please use a different code.`);
      return;
    }

    // Check for duplicate subjects in selected grades
    for (const grade of subject6to11.grades) {
      const existingSubject = subjects.find(s => 
        s.name.toLowerCase() === subject6to11.name.toLowerCase() && 
        s.grades.includes(grade)
      );
      
      if (existingSubject) {
        alert(`Subject "${subject6to11.name}" is already added to Grade ${grade}`);
        return;
      }
    }

    const newSubject: Subject = {
      id: nextId.toString(),
      name: subject6to11.name.trim(),
      code: subject6to11.code.trim(),
      grades: subject6to11.grades,
      type: '6-11'
    };

    setSubjects(prev => [...prev, newSubject]);
    setNextId(prev => prev + 1);
    setSubject6to11({ name: '', code: '', grades: [] });
    alert(`Subject "${newSubject.name}" added successfully!`);
  };

  const addSubject12to13 = () => {
    if (!subject12to13.name.trim() || !subject12to13.code.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (subject12to13.grades.length === 0) {
      alert('Please select at least one grade');
      return;
    }

    // Check for duplicate subject codes
    const existingCode = subjects.find(s => 
      s.code.toLowerCase() === subject12to13.code.toLowerCase()
    );
    
    if (existingCode) {
      alert(`Subject code "${subject12to13.code}" already exists. Please use a different code.`);
      return;
    }

    // Check for duplicate subjects in selected grades
    for (const grade of subject12to13.grades) {
      for (const stream of subject12to13.streams) {
        const existingSubject = subjects.find(s => 
          s.name.toLowerCase() === subject12to13.name.toLowerCase() && 
          s.grades.includes(grade) &&
          s.stream === stream
        );
        
        if (existingSubject) {
          alert(`Subject "${subject12to13.name}" is already added to Grade ${grade} in ${stream} stream`);
          return;
        }
      }
    }

    // Create a single subject with all streams
    const newSubject: Subject = {
      id: nextId.toString(),
      name: subject12to13.name.trim(),
      code: subject12to13.code.trim(),
      grades: subject12to13.grades,
      stream: subject12to13.streams.length > 0 ? subject12to13.streams : undefined,
      type: '12-13'
    };

    setSubjects(prev => [...prev, newSubject]);
    setNextId(prev => prev + 1);
    setSubject12to13({ name: '', code: '', grades: [], streams: [] });
    alert(`Subject "${subject12to13.name}" added successfully to ${subject12to13.streams.length || 0} stream(s)!`);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      color: '#e2e8f0',
      padding: '40px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 50%, rgba(15, 23, 42, 0.9) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '40px',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
        maxWidth: '1200px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px', textAlign: 'center' }}>📖</div>
        <h2 style={{ 
          fontSize: '1.8rem', 
          fontWeight: '800', 
          marginBottom: '30px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Add Subjects
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '30px'
        }}>
          {/* Grade 6 to 11 Form */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '15px',
            padding: '25px'
          }}>
            <h3 style={{
              color: '#10b981',
              fontSize: '1.3rem',
              fontWeight: '700',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              📚 Grade 6 to 11 Subjects
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  color: '#94a3b8',
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  Subject Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter subject name"
                  value={subject6to11.name}
                  onChange={(e) => setSubject6to11(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: '#e2e8f0',
                    outline: 'none'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  color: '#94a3b8',
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  Subject Code *
                </label>
                <input
                  type="text"
                  placeholder="Enter subject code"
                  value={subject6to11.code}
                  onChange={(e) => setSubject6to11(prev => ({ ...prev, code: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: '#e2e8f0',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  color: '#10b981',
                  marginBottom: '10px',
                  fontWeight: '600'
                }}>
                  Select Grades *
                </label>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  {['6', '7', '8', '9', '10', '11'].map(grade => (
                    <div key={grade} style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '8px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        id={`grade-6-11-${grade}`}
                        value={grade}
                        checked={subject6to11.grades.includes(grade)}
                        onChange={() => handleGrade6to11Change(grade)}
                        style={{
                          marginRight: '10px',
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer'
                        }}
                      />
                      <label htmlFor={`grade-6-11-${grade}`} style={{
                        color: '#e2e8f0',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}>
                        Grade {grade}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                onClick={addSubject6to11}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(16, 185, 129, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
                }}
              >
                ➕ Add Subject
              </button>
            </div>
          </div>

          {/* Grade 12 to 13 Form */}
          <div style={{
            background: 'rgba(139, 92, 246, 0.05)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '15px',
            padding: '25px'
          }}>
            <h3 style={{
              color: '#8b5cf6',
              fontSize: '1.3rem',
              fontWeight: '700',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🎓 Grade 12 to 13 Subjects
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  color: '#94a3b8',
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  Subject Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter subject name"
                  value={subject12to13.name}
                  onChange={(e) => setSubject12to13(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: '#e2e8f0',
                    outline: 'none'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  color: '#94a3b8',
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  Subject Code *
                </label>
                <input
                  type="text"
                  placeholder="Enter subject code"
                  value={subject12to13.code}
                  onChange={(e) => setSubject12to13(prev => ({ ...prev, code: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: '#e2e8f0',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  color: '#8b5cf6',
                  marginBottom: '10px',
                  fontWeight: '600'
                }}>
                  Stream Type *
                </label>
                <div style={{
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '15px',
                    marginBottom: '10px',
                    flexWrap: 'wrap'
                  }}>
                    {streams.map(stream => (
                      <label key={stream} style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        color: '#e2e8f0'
                      }}>
                        <input
                          type="checkbox"
                          value={stream}
                          checked={subject12to13.streams.includes(stream)}
                          onChange={() => handleStreamChange(stream)}
                          style={{ marginRight: '8px' }}
                        />
                        {stream}
                      </label>
                    ))}
                  </div>
                  <div style={{
                    marginTop: '10px',
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={addStream}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(139, 92, 246, 0.2)',
                        border: '1px solid rgba(139, 92, 246, 0.4)',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      ➕ Add Stream
                    </button>
                    <button
                      onClick={removeStream}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      🗑️ Remove Stream
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  color: '#8b5cf6',
                  marginBottom: '10px',
                  fontWeight: '600'
                }}>
                  Select Grades *
                </label>
                <div style={{
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  {['12', '13'].map(grade => (
                    <div key={grade} style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '8px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        id={`grade-12-13-${grade}`}
                        value={grade}
                        checked={subject12to13.grades.includes(grade)}
                        onChange={() => handleGrade12to13Change(grade)}
                        style={{
                          marginRight: '10px',
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer'
                        }}
                      />
                      <label htmlFor={`grade-12-13-${grade}`} style={{
                        color: '#e2e8f0',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}>
                        Grade {grade}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                onClick={addSubject12to13}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(139, 92, 246, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(139, 92, 246, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.3)';
                }}
              >
                ➕ Add Subject
              </button>
            </div>
          </div>
        </div>

        {/* Display Added Subjects */}
        {subjects.length > 0 && (
          <div style={{
            marginTop: '30px',
            padding: '25px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <h3 style={{
                color: '#6366f1',
                fontSize: '1.4rem',
                fontWeight: '700',
                margin: '0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '1.8rem' }}>📋</span>
                Added Subjects
              </h3>
              <div style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: '600',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
              }}>
                {subjects.length} {subjects.length === 1 ? 'Subject' : 'Subjects'}
              </div>
            </div>
            
            <div style={{
              display: 'grid',
              gap: '15px',
              maxHeight: '300px',
              overflowY: 'auto',
              paddingRight: '10px'
            }}>
              {subjects.map((subject) => (
                <div 
                  key={subject.id} 
                  style={{
                    padding: '12px 15px',
                    background: `linear-gradient(135deg, 
                      ${subject.type === '6-11' 
                        ? 'rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%' 
                        : 'rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%'
                    }`,
                    border: `1px solid ${
                      subject.type === '6-11' 
                        ? 'rgba(16, 185, 129, 0.3)' 
                        : 'rgba(139, 92, 246, 0.3)'
                    }`,
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    color: '#e2e8f0',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: `0 2px 8px ${
                      subject.type === '6-11' 
                        ? 'rgba(16, 185, 129, 0.15)' 
                        : 'rgba(139, 92, 246, 0.15)'
                    }`
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 4px 15px ${
                      subject.type === '6-11' 
                        ? 'rgba(16, 185, 129, 0.25)' 
                        : 'rgba(139, 92, 246, 0.25)'
                    }`;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 2px 8px ${
                      subject.type === '6-11' 
                        ? 'rgba(16, 185, 129, 0.15)' 
                        : 'rgba(139, 92, 246, 0.15)'
                    }`;
                  }}
                >
                  {/* ID Badge - Top Left */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: subject.type === '6-11' 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: 'white',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    fontSize: '0.65rem',
                    fontWeight: '700',
                    fontFamily: 'monospace',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    zIndex: '1',
                    whiteSpace: 'nowrap'
                  }}>
                    {subject.code}
                  </div>

                  {/* Subject Type Badge - Top Right */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: subject.type === '6-11' 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontSize: '0.6rem',
                    fontWeight: '600',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                  }}>
                    {subject.type === '6-11' ? '6-11' : '12-13'}
                  </div>

                  {/* Header with Subject Info */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '10px',
                    paddingLeft: '20px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: '700',
                        color: subject.type === '6-11' ? '#10b981' : '#8b5cf6',
                        marginBottom: '4px',
                        lineHeight: '1.2'
                      }}>
                        {subject.name}
                      </div>
                    </div>
                  </div>

                  {/* Grades as Badges */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginBottom: '10px',
                    alignItems: 'flex-start'
                  }}>
                    {subject.grades.map(grade => (
                      <div
                        key={grade}
                        style={{
                          background: 'rgba(99, 102, 241, 0.15)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          padding: '4px 10px',
                          borderRadius: '14px',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          color: '#6366f1',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        📚 Grade {grade}
                      </div>
                    ))}
                  </div>

                  {/* Streams as Badges (if exists) */}
                  {subject.stream && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginBottom: '10px',
                      alignItems: 'flex-start'
                    }}>
                      {(Array.isArray(subject.stream) ? subject.stream : [subject.stream]).filter(Boolean).map(stream => (
                        <div
                          key={stream}
                          style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            padding: '4px 10px',
                            borderRadius: '14px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            color: '#f59e0b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(245, 158, 11, 0.25)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          🎯 {stream}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons at Bottom-Right */}
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    display: 'flex',
                    gap: '6px'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        editSubject(subject.id);
                      }}
                      style={{
                        padding: '4px 8px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        borderRadius: '6px',
                        color: '#3b82f6',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSubject(subject.id);
                      }}
                      style={{
                        padding: '4px 8px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '6px',
                        color: '#ef4444',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Edit Modal */}
      {editingId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '1000'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '20px',
              color: '#e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              ✏️ Edit Subject
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  color: '#94a3b8',
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  Subject Name *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: '#e2e8f0',
                    outline: 'none'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  color: '#94a3b8',
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  Subject Code *
                </label>
                <input
                  type="text"
                  value={editForm.code}
                  onChange={(e) => setEditForm(prev => ({ ...prev, code: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: '#e2e8f0',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  color: '#94a3b8',
                  marginBottom: '10px',
                  fontWeight: '600'
                }}>
                  Select Grades *
                </label>
                <div style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '8px',
                  padding: '12px',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {['6', '7', '8', '9', '10', '11', '12', '13'].map(grade => (
                    <div key={grade} style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '8px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        id={`edit-grade-${grade}`}
                        value={grade}
                        checked={editForm.grades.includes(grade)}
                        onChange={() => handleEditGradeChange(grade)}
                        style={{
                          marginRight: '10px',
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer'
                        }}
                      />
                      <label htmlFor={`edit-grade-${grade}`} style={{
                        color: '#e2e8f0',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}>
                        Grade {grade}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '10px'
              }}>
                <button
                  onClick={saveEdit}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
                  }}
                >
                  💾 Save Changes
                </button>
                <button
                  onClick={cancelEdit}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(239, 68, 68, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(239, 68, 68, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.3)';
                  }}
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManagement;
