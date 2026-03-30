import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../services/api';
import { Users as UsersIcon, Loader2, Edit, Save, Calendar, Phone, Mail, MapPin } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface Teacher {
  id: number;
  username: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  grade?: string;
  grade_id?: string;
  phone_number?: string;
  birthday?: string;
  address?: string;
  created_at: string;
}

const TeacherManagement: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Teacher>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false); // Add this flag
  const hasMounted = useRef(false); // Track initial mount
  const { user } = useAuth();
  const token = localStorage.getItem('edutrack_token');
  const { showToast } = useToast();

  const fetchTeachers = async (force = false) => {
    // Don't fetch if we're in the middle of an update to prevent overwriting optimistic updates
    if (isUpdating && !force) {
      console.log('🔍 Skipping fetchTeachers during update');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/users/teachers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        console.log('🔍 Fetched teachers from server:', data.data);
        // Check if any teachers have missing or inconsistent grade data
        data.data.forEach((teacher: any) => {
          console.log(`🔍 Teacher ${teacher.id}: grade="${teacher.grade}", grade_id=${teacher.grade_id}`);
        });
        setTeachers(data.data);
      } else {
        showToast(data.message || 'Failed to fetch teachers', 'error');
      }
    } catch {
      showToast('Network error while fetching teachers', 'error');
    } finally {
      if (grades.length > 0) setLoading(false);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/grades`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) setGrades(data.data);
    } catch {
      showToast('Failed to fetch grades', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch on initial mount, not on re-renders
    if (!hasMounted.current) {
      console.log('🔍 Initial mount - fetching teachers and grades');
      fetchTeachers();
      fetchGrades();
      hasMounted.current = true;
    }
  }, [token]);

  const calculateAge = (birthdayString?: string) => {
    if (!birthdayString) return 'N/A';
    const diffMs = Date.now() - new Date(birthdayString).getTime();
    if (isNaN(diffMs)) return 'N/A';
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  const handleEditClick = (teacher: Teacher) => {
    setEditingId(teacher.id);

    // Defensive check: if grade_id is missing but we have a grade string, try to find the matching grade_id from the grades list
    let initialGradeId = teacher.grade_id ? teacher.grade_id.toString() : '';
    if (!initialGradeId && teacher.grade && teacher.grade !== 'No Class Assigned') {
      const match = grades.find(g => `Grade ${g.grade}-${g.grade_part}` === teacher.grade);
      if (match) initialGradeId = match.id.toString();
    }

    setEditFormData({
      first_name: teacher.first_name || '',
      last_name: teacher.last_name || '',
      gender: teacher.gender || 'female',
      grade: teacher.grade || '',
      grade_id: initialGradeId,
      phone_number: teacher.phone_number || '',
      birthday: teacher.birthday ? new Date(teacher.birthday).toISOString().split('T')[0] : '',
      address: teacher.address || '',
      email: teacher.email || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleManualRefresh = async () => {
    console.log('🔍 Manual refresh requested');
    // Add a small delay to ensure server has processed any recent changes
    await new Promise(resolve => setTimeout(resolve, 500));
    fetchTeachers(true); // force refresh
    fetchGrades();
  };

  const handleSaveEdit = async (id: number) => {
    setSavingId(id);
    setIsUpdating(true); // Prevent background fetches during update
    try {
      const response = await fetch(`${API_BASE_URL}/users/teachers/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editFormData)
      });
      const data = await response.json();
      console.log('🔍 Server response:', data); // Debug log
      if (response.ok && data.success) {
        showToast('Teacher details updated successfully', 'success');

        // Use the grade string returned by the server as source of truth
        const selectedGradeId = editFormData.grade_id;
        console.log('🔍 Selected grade_id:', selectedGradeId); // Debug log
        console.log('🔍 Server returned grade:', data.grade); // Debug log
        
        // Always trust local computation over server response for immediate UI update
        let newGradeString: string;
        if (selectedGradeId && selectedGradeId !== '' && selectedGradeId !== 'unassigned') {
          const matchedGrade = grades.find(g => g.id.toString() === selectedGradeId.toString());
          if (matchedGrade) {
            newGradeString = `Grade ${matchedGrade.grade}-${matchedGrade.grade_part}`;
          } else {
            newGradeString = 'No Class Assigned';
          }
        } else {
          newGradeString = 'No Class Assigned';
        }
        
        console.log('🔍 Final grade string:', newGradeString); // Debug log

        // Update local teachers state immediately for instant badge refresh
        setTeachers(prev => {
          const updated = prev.map(t => {
            if (t.id !== id) return t;
            const updatedTeacher = {
              ...t,
              first_name: editFormData.first_name ?? t.first_name,
              last_name: editFormData.last_name ?? t.last_name,
              gender: editFormData.gender ?? t.gender,
              email: editFormData.email ?? t.email,
              phone_number: editFormData.phone_number ?? t.phone_number,
              birthday: editFormData.birthday ?? t.birthday,
              address: editFormData.address ?? t.address,
              grade: newGradeString,
              grade_id: selectedGradeId ?? t.grade_id
            };
            console.log('🔍 Updated teacher:', updatedTeacher); // Debug log
            return updatedTeacher;
          });
          console.log('🔍 All teachers after update:', updated); // Debug log
          return updated;
        });

        // Also update the grades state to reflect the new teacher assignment
        setGrades(prev => {
          const updated = prev.map(g => {
            // Clear previous teacher assignment for this teacher
            if (g.teacher_id === id) {
              return { ...g, teacher_id: null };
            }
            // Set new teacher assignment if this grade was selected
            if (selectedGradeId && g.id.toString() === selectedGradeId.toString()) {
              return { ...g, teacher_id: id };
            }
            return g;
          });
          console.log('🔍 Updated grades with new teacher assignment:', updated); // Debug log
          return updated;
        });

        setEditingId(null);
        setIsUpdating(false); // Allow background fetches again
        // No need for background sync - optimistic update keeps UI consistent
        // Server already confirmed the change was successful
      } else {
        showToast(data.message || 'Failed to update teacher', 'error');
      }
    } catch {
      showToast('Network error while saving details', 'error');
    } finally {
      setSavingId(null);
      setIsUpdating(false); // Ensure flag is always reset
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '48px 24px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '12px', padding: '24px', textAlign: 'center', color: '#B91C1C' }}>
          Restricted Access. Admins only.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 size={40} color="#633194" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'Inter, sans-serif', background: '#F8F7FF', minHeight: '100%' }}>
      <style>{`
        .input-field {
          width: 100%;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #E5E7EB;
          font-family: inherit;
          font-size: 14px;
          margin-top: 4px;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .input-field:focus {
          border-color: #633194;
          outline: none;
          box-shadow: 0 0 0 3px rgba(99, 49, 148, 0.1);
        }
        .teacher-card {
          background: #FFFFFF;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 4px 12px rgba(99, 49, 148, 0.04);
          border: 1px solid #F3F4F6;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .teacher-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(99, 49, 148, 0.08);
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '28px', background: '#FFFFFF',
        padding: '20px 28px', borderRadius: '18px',
        boxShadow: '0 2px 12px rgba(99,49,148,0.06)', border: '1px solid #EDE9FE'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg,#633194,#4B2380)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <UsersIcon size={26} color="#FFFFFF" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#1e1b4b' }}>
              Teacher Directory
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
              Manage teacher profiles, contact information, and details.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg,#633194,#4B2380)', color: '#FFFFFF',
            padding: '10px 20px', borderRadius: '50px', fontWeight: 700, fontSize: '14px',
            boxShadow: '0 4px 14px rgba(99,49,148,0.3)'
          }}>
            Total: {teachers.length}
          </div>
          <button
            onClick={handleManualRefresh}
            style={{
              background: '#F3F4F6', color: '#4B5563', border: '1px solid #D1D5DB',
              padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#E5E7EB'}
            onMouseOut={e => e.currentTarget.style.background = '#F3F4F6'}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Teacher List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {teachers.map(teacher => {
          const isEditing = editingId === teacher.id;

          return (
            <div key={teacher.id} className="teacher-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: '#F4F0FF', color: '#633194',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '15px', border: '1px solid #DDD6FE'
                  }}>
                    {(teacher.first_name?.[0] || teacher.username[0]).toUpperCase()}
                  </div>
                  <div>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          className="input-field"
                          value={editFormData.first_name || ''}
                          onChange={e => setEditFormData({ ...editFormData, first_name: e.target.value })}
                          placeholder="First Name"
                          style={{ flex: 1, minWidth: '100px' }}
                        />
                        <input
                          className="input-field"
                          value={editFormData.last_name || ''}
                          onChange={e => setEditFormData({ ...editFormData, last_name: e.target.value })}
                          placeholder="Last Name"
                          style={{ flex: 1, minWidth: '100px' }}
                        />
                      </div>
                    ) : (
                      <h3 style={{ margin: 0, fontSize: '15px', color: '#1F2937', fontWeight: 700 }}>
                        {teacher.first_name || teacher.last_name
                          ? `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim()
                          : teacher.username}
                      </h3>
                    )}
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>@{teacher.username}</span>
                    <div style={{ marginTop: '4px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ background: '#F4F0FF', color: '#633194', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' }}>
                        {teacher.gender || 'Not specified'}
                      </span>
                      {(teacher.grade_id || (teacher.grade && teacher.grade !== 'No Class Assigned' && teacher.grade !== 'No class assigned')) && (
                        <span style={{ background: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                          {teacher.grade}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isEditing ? null : (
                  <button
                    onClick={() => handleEditClick(teacher)}
                    style={{ background: '#F4F0FF', color: '#633194', border: '1px solid #DDD6FE', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background = '#EDE9FE'}
                    onMouseOut={e => e.currentTarget.style.background = '#F4F0FF'}
                  >
                    <Edit size={14} /> Edit
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {isEditing && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <select
                      className="input-field"
                      value={editFormData.gender || ''}
                      onChange={e => setEditFormData({ ...editFormData, gender: e.target.value })}
                      style={{ flex: 1 }}
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                    </select>
                    <select
                      className="input-field"
                      value={editFormData.grade_id || ''}
                      onChange={e => setEditFormData({ ...editFormData, grade_id: e.target.value })}
                      style={{ flex: 1 }}
                    >
                      <option value="">No Class Assigned</option>
                      {grades
                        .filter(g =>
                          // Show grades that are: unassigned, OR assigned to current teacher being edited
                          !g.teacher_id ||
                          g.id.toString() === (editFormData.grade_id || '').toString()
                        )
                        .map(g => (
                          <option key={g.id} value={g.id.toString()}>
                            Grade {g.grade}-{g.grade_part}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mail size={16} color="#9CA3AF" />
                  {isEditing ? (
                    <input
                      className="input-field"
                      value={editFormData.email || ''}
                      onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                      type="email"
                    />
                  ) : (
                    <span style={{ color: '#4B5563', fontSize: '14px' }}>{teacher.email || 'No email provided'}</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Phone size={16} color="#9CA3AF" />
                  {isEditing ? (
                    <input
                      className="input-field"
                      value={editFormData.phone_number || ''}
                      onChange={e => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                      placeholder="e.g. +1-234-567-8900"
                    />
                  ) : (
                    <span style={{ color: '#4B5563', fontSize: '14px' }}>{teacher.phone_number || 'N/A'}</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={16} color="#9CA3AF" />
                  {isEditing ? (
                    <input
                      className="input-field"
                      type="date"
                      value={editFormData.birthday || ''}
                      onChange={e => setEditFormData({ ...editFormData, birthday: e.target.value })}
                    />
                  ) : (
                    <span style={{ color: '#4B5563', fontSize: '14px' }}>
                      {teacher.birthday ? new Date(teacher.birthday).toLocaleDateString() : 'N/A'}
                      {teacher.birthday && <span style={{ color: '#9CA3AF', marginLeft: '6px' }}>(Age: {calculateAge(teacher.birthday)})</span>}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <MapPin size={16} color="#9CA3AF" style={{ marginTop: '2px' }} />
                  {isEditing ? (
                    <textarea
                      className="input-field"
                      value={editFormData.address || ''}
                      onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                      rows={2}
                      placeholder="Street address..."
                    />
                  ) : (
                    <span style={{ color: '#4B5563', fontSize: '14px', lineHeight: 1.4 }}>{teacher.address || 'N/A'}</span>
                  )}
                </div>
              </div>

              {isEditing && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E5E7EB', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleCancelEdit}
                    disabled={savingId === teacher.id}
                    style={{ background: '#F3F4F6', color: '#4B5563', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'background 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background = '#E5E7EB'}
                    onMouseOut={e => e.currentTarget.style.background = '#F3F4F6'}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveEdit(teacher.id)}
                    disabled={savingId === teacher.id}
                    style={{ background: '#10B981', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)', transition: 'background 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background = '#059669'}
                    onMouseOut={e => e.currentTarget.style.background = '#10B981'}
                  >
                    {savingId === teacher.id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeacherManagement;
