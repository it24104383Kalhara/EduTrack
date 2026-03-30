import React, { useState, useEffect } from 'react';
import {
  Search,
  Edit2,
  Trash2,
  Plus,
  X,
  Loader2,
  Library,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { subjectApi } from '../services/api';
import type { Subject } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const SubjectManagement: React.FC = () => {
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFormTab, setActiveFormTab] = useState<'6-11' | '12-13'>('6-11');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    grades: [] as string[],
    streams: [] as string[],
    category: '',
    is_optional: false
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Custom Confirmation Modal State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    grades: [] as string[],
    type: '6-11' as '6-11' | '12-13',
    category: '',
    is_optional: false
  });

  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '48px 24px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '12px', padding: '24px', textAlign: 'center', color: '#B91C1C' }}>
          Restricted Access. Admins only.
        </div>
      </div>
    );
  }

  const commonCategories = [
    'Aesthetics',
    'Category 1',
    'Category 2',
    'Category 3',
    'Religion'
  ];

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const subjectsData = await subjectApi.getAll();
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      showToast('Failed to load subjects. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeToggle = (grade: string) => {
    setFormData(prev => ({
      ...prev,
      grades: prev.grades.includes(grade)
        ? prev.grades.filter(g => g !== grade)
        : [...prev.grades, grade]
    }));
  };

  const handleStreamToggle = (stream: string) => {
    setFormData(prev => ({
      ...prev,
      streams: prev.streams.includes(stream)
        ? prev.streams.filter(s => s !== stream)
        : [...prev.streams, stream]
    }));
  };

  const handleAddSubject = async () => {
    if (!formData.name || !formData.code || formData.grades.length === 0) {
      showToast('Please fill in Name, Code and select at least one Grade.', 'warning');
      return;
    }
    try {
      setLoading(true);
      const newSub = await subjectApi.create({
        ...formData,
        type: activeFormTab,
        stream: activeFormTab === '12-13' ? formData.streams : undefined
      });
      setSubjects(prev => [...prev, newSub]);
      setFormData({ name: '', code: '', grades: [], streams: [], category: '', is_optional: false });
      showToast('Subject created successfully!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to add subject.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteSubject = async (id: string) => {
    const subject = subjects.find(s => s.id === id);
    if (subject) {
      setSubjectToDelete(subject);
      setShowDeleteConfirm(true);
    }
  };

  const confirmDeleteSubject = async () => {
    if (!subjectToDelete) return;
    
    try {
      setIsDeleting(true);
      await subjectApi.delete(subjectToDelete.id);
      setSubjects(prev => prev.filter(s => s.id !== subjectToDelete.id));
      showToast('Subject deleted successfully!', 'success');
      setShowDeleteConfirm(false);
      setSubjectToDelete(null);
    } catch (error) {
      console.error('Failed to delete subject:', error);
      showToast('Failed to delete subject. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteSubject = () => {
    setShowDeleteConfirm(false);
    setSubjectToDelete(null);
  };

  const editSubject = (id: string) => {
    const subject = subjects.find(s => s.id === id);
    if (subject) {
      let parsedGrades: string[] = [];
      if (Array.isArray(subject.grades)) {
        parsedGrades = subject.grades.flatMap(g => {
          if (typeof g === 'string' && g.startsWith('[')) {
            try { return JSON.parse(g); } catch { return g; }
          }
          return g;
        });
      } else if (typeof subject.grades === 'string' && (subject.grades as string).startsWith('[')) {
        try { parsedGrades = JSON.parse(subject.grades as string); } catch { parsedGrades = [subject.grades as string]; }
      } else {
        parsedGrades = [subject.grades as string];
      }

      setEditForm({
        name: subject.name,
        code: subject.code,
        grades: parsedGrades,
        type: subject.type,
        category: subject.category || '',
        is_optional: !!subject.is_optional
      });
      setEditingId(id);
    }
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const updatedSubject = await subjectApi.update(editingId, {
        name: editForm.name,
        code: editForm.code,
        grades: editForm.grades,
        type: editForm.type,
        category: editForm.category || undefined,
        is_optional: editForm.is_optional
      });
      setSubjects(prev => prev.map(s => s.id === editingId ? updatedSubject : s));
      setEditingId(null);
      showToast('Subject updated successfully!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update subject.', 'error');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleEditGradeChange = (grade: string) => {
    setEditForm(prev => ({
      ...prev,
      grades: prev.grades.includes(grade)
        ? prev.grades.filter(g => g !== grade)
        : [...prev.grades, grade]
    }));
  };

  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF',
    padding: '24px 32px 32px',
    borderRadius: '24px',
    border: '2px solid #E2E8F0',
    boxShadow: '0 10px 30px -10px rgba(99, 49, 148, 0.12)',
    position: 'relative',
    overflow: 'hidden'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '10px',
    border: '2px solid #F3F4F6',
    background: '#ffffff',
    fontSize: '12px',
    fontWeight: '500',
    color: '#1F2937',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '10px',
    fontWeight: '800',
    color: '#633194',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  return (
    <div style={{
      minHeight: '100%',
      background: '#F8F7FF',
      padding: '20px 24px',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ width: '100%' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Library size={28} color="#633194" /> Subject Management
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>Configure curriculum subjects and grade levels.</p>
          </div>
        </div>

        {/* Registration Forms Grid */}
        <div style={{ marginBottom: '48px' }}>
        {/* Unified Premium Entry Form */}
        <div style={{ marginBottom: '40px', maxWidth: '1000px', marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', borderBottom: '1px solid #F3F4F6', paddingBottom: '20px' }}>
              <div style={{ width: '40px', height: '40px', background: '#F5F3FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #DDD6FE' }}>
                <Plus size={20} color="#633194" />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#1E1B4B', letterSpacing: '-0.01em' }}>Create New Subject</h2>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B', fontWeight: '500' }}>Specify category and grade details below.</p>
              </div>
            </div>

            {/* Type Selector Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', background: '#F9FAFB', padding: '4px', borderRadius: '14px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
              {(['6-11' , '12-13'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setActiveFormTab(type)}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeFormTab === type ? '#633194' : 'transparent',
                    color: activeFormTab === type ? 'white' : '#64748B',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Grade {type}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label htmlFor="subject-name" style={labelStyle}>Subject Name</label>
                <input
                  id="subject-name"
                  name="name"
                  type="text"
                  className="edu-input"
                  placeholder="e.g. Mathematics"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="subject-code" style={labelStyle}>Subject Code</label>
                <input
                  id="subject-code"
                  name="code"
                  type="text"
                  className="edu-input"
                  placeholder="e.g. MATH6"
                  value={formData.code}
                  onChange={e => setFormData(p => ({ ...p, code: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Category (Bucket)</label>
                <select
                  className="edu-input"
                  value={formData.category}
                  onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                  style={{ ...inputStyle, appearance: 'none' }}
                >
                  <option value="">Select Category</option>
                  {['Aesthetics', 'Category 1', 'Category 2', 'Category 3', 'Religion'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', marginTop: '14px' }}>
                <div 
                  onClick={() => setFormData(p => ({ ...p, is_optional: !p.is_optional }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    background: formData.is_optional ? '#F5F3FF' : '#F9FAFB',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: formData.is_optional ? '1px solid #DDD6FE' : '1px solid #E5E7EB',
                    transition: 'all 0.2s',
                    width: 'fit-content'
                  }}
                >
                  <div style={{ 
                    width: '18px', 
                    height: '18px', 
                    borderRadius: '5px', 
                    border: '2px solid #633194',
                    background: formData.is_optional ? '#633194' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {formData.is_optional && <CheckCircle size={12} color="white" />}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: formData.is_optional ? '#633194' : '#64748B' }}>Optional Subject</span>
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Select Grade Levels</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {(activeFormTab === '6-11' ? ['6', '7', '8', '9', '10', '11'] : ['12', '13']).map(g => (
                    <button
                      key={g}
                      onClick={() => handleGradeToggle(g)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: formData.grades.includes(g) ? '2px solid #633194' : '2px solid #F3F4F6',
                        background: formData.grades.includes(g) ? '#F5F3FF' : '#FFFFFF',
                        color: formData.grades.includes(g) ? '#633194' : '#64748B',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      G{g}
                    </button>
                  ))}
                </div>
              </div>

              {activeFormTab === '12-13' && (
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Streams</label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {['Science', 'Commerce', 'Arts', 'Technology'].map(s => (
                      <button
                        key={s}
                        onClick={() => handleStreamToggle(s)}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '10px',
                          border: formData.streams.includes(s) ? '2px solid #8B5CF6' : '1px solid #E5E7EB',
                          background: formData.streams.includes(s) ? '#F5F3FF' : 'white',
                          color: formData.streams.includes(s) ? '#633194' : '#4B5563',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

                  <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                    <button
                      onClick={handleAddSubject}
                      disabled={loading}
                      style={{
                        padding: '8px 24px',
                        background: 'linear-gradient(135deg, #633194 0%, #4B2380 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        boxShadow: '0 8px 30px rgba(99, 49, 148, 0.2)',
                        transition: 'all 0.3s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                  Add Subject to Curriculum
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Search and List */}
        <div style={{
          background: '#FFFFFF',
          padding: '40px',
          borderRadius: '32px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Top accent line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #633194, #8B5CF6)' }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '32px' }}>
            <div>
              <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#111827', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Library size={32} color="#633194" /> Registered Subjects
              </h2>
              <p style={{ color: '#6B7280', fontSize: '15px', marginTop: '6px', fontWeight: '500' }}>Manage and monitor all curriculum subjects from one place.</p>
            </div>
            <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
              <input
                className="edu-input"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '44px', height: '42px', borderRadius: '12px' }}
              />
              <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {loading ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0' }}>
                <Loader2 size={48} style={{ color: '#8B5CF6', marginBottom: '20px', animation: 'spin 2s linear infinite' }} />
                <div style={{ color: '#6B7280', fontSize: '18px', fontWeight: '600' }}>Loading curriculum data...</div>
                <style>{`
                  @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            ) : subjects.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0', background: '#F9FAFB', borderRadius: '24px', border: '2px dashed #E5E7EB' }}>
                <Search size={48} style={{ color: '#CBD5E1', marginBottom: '20px' }} />
                <div style={{ color: '#64748B', fontSize: '18px', fontWeight: '600' }}>
                  {searchTerm ? `No results for "${searchTerm}"` : 'No subjects registered yet'}
                </div>
              </div>
            ) : (
              subjects
                .filter(subject => subject.name.toLowerCase().includes(searchTerm.toLowerCase()) || subject.code.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((subject) => (
                  <div
                    key={subject.id}
                    style={{
                      border: '1.5px solid #F3E8FF',
                      padding: '16px 20px',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      background: '#FAF5FF'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#8B5CF6';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(139, 92, 246, 0.08)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.background = '#FFFFFF';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#F3E8FF';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.background = '#FAF5FF';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '10px', color: '#8B5CF6', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{subject.code}</span>
                        <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: '2px 0 0 0', letterSpacing: '-0.01em' }}>{subject.name}</h4>
                        {subject.category && (
                          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontWeight: '600' }}>Bucket:</span> {subject.category}
                            {subject.is_optional ? <span style={{ color: '#8B5CF6', background: '#F5F3FF', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', marginLeft: '4px' }}>Optional</span> : null}
                          </div>
                        )}
                      </div>
                      <span style={{ background: '#F5F3FF', color: '#633194', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', border: '1px solid #DDD6FE' }}>{subject.type}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {(() => {
                        let displayGrades: string[] = [];
                        if (Array.isArray(subject.grades)) {
                          displayGrades = subject.grades.flatMap(g => {
                            if (typeof g === 'string' && g.startsWith('[')) {
                              try { return JSON.parse(g); } catch { return g; }
                            }
                            return g;
                          });
                        } else if (typeof subject.grades === 'string' && (subject.grades as string).startsWith('[')) {
                          try { displayGrades = JSON.parse(subject.grades as string); } catch { displayGrades = [subject.grades as string]; }
                        } else {
                          displayGrades = [subject.grades as string];
                        }
                        return displayGrades.map(g => (
                          <span key={g} style={{ background: '#F8FAFC', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', border: '1px solid #E2E8F0', color: '#475569' }}>
                            G{g}
                          </span>
                        ));
                      })()}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '12px' }}>
                      <button onClick={() => editSubject(subject.id)} style={{ flex: 1, padding: '6px 10px', borderRadius: '8px', border: '1.5px solid #E2E8F0', background: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#633194', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }} onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = '#633194'} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0'}>
                        <Edit2 size={12} /> Edit
                      </button>
                      <button onClick={() => deleteSubject(subject.id)} style={{ flex: 1, padding: '6px 10px', borderRadius: '8px', border: '1.5px solid #FEE2E2', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }} onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = '#DC2626'} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = '#FEE2E2'}>
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
          </div>
        </div>

      {/* Edit Modal */}
      {editingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '32px', width: '480px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #E5E7EB', animation: 'modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '26px', fontWeight: '800', color: '#111827', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Edit2 size={24} color="#633194" /> Edit Subject
              </h3>
              <button
                onClick={cancelEdit}
                style={{ background: '#F3F4F6', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} color="#4B5563" />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label htmlFor="edit-name" style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#4B5563', marginBottom: '10px' }}>Subject Name</label>
                <input id="edit-name" name="name" type="text" className="edu-input" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label htmlFor="edit-code" style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#4B5563', marginBottom: '10px' }}>Subject Code</label>
                <input id="edit-code" name="code" type="text" className="edu-input" value={editForm.code} onChange={e => setEditForm(p => ({ ...p, code: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#4B5563', marginBottom: '10px' }}>Category (Bucket)</label>
                  {editForm.type === '6-11' ? (
                    <select
                      className="edu-input"
                      value={editForm.category}
                      onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}
                      style={{ ...inputStyle, padding: '10px 12px' }}
                    >
                      <option value="">Select Category</option>
                      {commonCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <select
                      className="edu-input"
                      value={editForm.category}
                      onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}
                      style={{ ...inputStyle, padding: '10px 12px' }}
                    >
                      <option value="">Select Category</option>
                      {['Category 1', 'Category 2', 'Category 3'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '24px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#4B5563', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editForm.is_optional} onChange={e => setEditForm(p => ({ ...p, is_optional: e.target.checked }))} style={{ accentColor: '#633194', width: '18px', height: '18px' }} />
                    Optional
                  </label>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#4B5563', marginBottom: '16px' }}>Grades</label>
                <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {(editForm.type === '6-11' ? ['6', '7', '8', '9', '10', '11'] : ['12', '13']).map(g => (
                    <label
                      key={g}
                      style={{
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        color: '#4B5563',
                        fontWeight: '500'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={editForm.grades.includes(g)}
                        onChange={() => handleEditGradeChange(g)}
                        style={{ accentColor: '#633194', width: '14px', height: '14px', cursor: 'pointer' }}
                      />
                      G{g}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button onClick={cancelEdit} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid #D1D5DB', background: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>Cancel</button>
                <button onClick={saveEdit} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#633194', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '13px', boxShadow: '0 8px 16px rgba(99, 49, 148, 0.2)' }}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Beautiful Custom Deletion Confirmation Modal */}
      {showDeleteConfirm && subjectToDelete && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          zIndex: 3000, padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes popIn { 
              from { opacity: 0; transform: scale(0.9) translateY(10px); } 
              to { opacity: 1; transform: scale(1) translateY(0); } 
            }
          `}</style>
          <div style={{ 
            background: '#FFFFFF', 
            width: '100%', 
            maxWidth: '440px', 
            borderRadius: '24px', 
            padding: '36px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
            border: '1px solid #F1F5F9',
            position: 'relative',
            overflow: 'hidden',
            animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* Warning Circle Glow */}
            <div style={{ 
              position: 'absolute', top: '-60px', right: '-60px', 
              width: '180px', height: '180px', borderRadius: '50%', 
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.08) 0%, transparent 70%)',
              zIndex: 0 
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ 
                width: '64px', height: '64px', background: '#FEF2F2', 
                borderRadius: '20px', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', marginBottom: '24px',
                border: '1px solid #FEE2E2'
              }}>
                <AlertTriangle size={32} color="#EF4444" />
              </div>
              
              <h3 style={{ 
                fontSize: '24px', fontWeight: '900', color: '#1E1B4B', 
                margin: '0 0 12px 0', letterSpacing: '-0.02em' 
              }}>
                Delete Subject?
              </h3>
              
              <p style={{ 
                fontSize: '15px', color: '#64748B', lineHeight: '1.6', 
                margin: '0 0 32px 0', fontWeight: '500' 
              }}>
                Are you sure you want to permanently delete <strong style={{ color: '#1E1B4B', fontWeight: '800' }}>"{subjectToDelete.name}"</strong>? This action will remove the subject from all assigned grades and cannot be undone.
              </p>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={cancelDeleteSubject}
                  disabled={isDeleting}
                  style={{ 
                    flex: 1, padding: '14px', borderRadius: '14px', 
                    border: '1.5px solid #E2E8F0', background: 'white', 
                    color: '#64748B', fontWeight: '700', fontSize: '15px',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => !isDeleting && (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={e => !isDeleting && (e.currentTarget.style.background = 'white')}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteSubject}
                  disabled={isDeleting}
                  style={{ 
                    flex: 1, padding: '14px', borderRadius: '14px', 
                    border: 'none', background: '#EF4444', 
                    color: 'white', fontWeight: '700', fontSize: '15px',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.2)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => !isDeleting && (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={e => !isDeleting && (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={18} />}
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .forms-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        .edu-input:focus {
          outline: none !important;
          border-color: #633194 !important;
          background: #FFFFFF !important;
          box-shadow: 0 0 0 4px rgba(99, 49, 148, 0.1) !important;
        }
        @media (min-width: 1024px) {
          .forms-grid {
            grid-template-columns: 1fr 1fr;
            gap: 24px;
          }
          .form-divider {
            display: block !important;
          }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      </div>
    </div>
  );
};

export default SubjectManagement;
