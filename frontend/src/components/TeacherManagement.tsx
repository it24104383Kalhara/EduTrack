import React, { useState, useEffect } from 'react';
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
  phone_number?: string;
  birthday?: string;
  address?: string;
  created_at: string;
}

const TeacherManagement: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Teacher>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const { user } = useAuth();
  const token = localStorage.getItem('edutrack_token');
  const { showToast } = useToast();

  const fetchTeachers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/teachers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTeachers(data.data);
      } else {
        showToast(data.message || 'Failed to fetch teachers', 'error');
      }
    } catch {
      showToast('Network error while fetching teachers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
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
    setEditFormData({
      first_name: teacher.first_name || '',
      last_name: teacher.last_name || '',
      gender: teacher.gender || 'female',
      grade: teacher.grade || '',
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

  const handleSaveEdit = async (id: number) => {
    setSavingId(id);
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
      if (response.ok && data.success) {
        showToast('Teacher details updated successfully', 'success');
        fetchTeachers(); // Refresh list to get formatted data
        setEditingId(null);
      } else {
        showToast(data.message || 'Failed to update teacher', 'error');
      }
    } catch {
      showToast('Network error while saving details', 'error');
    } finally {
      setSavingId(null);
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
          padding: 24px;
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
        <div style={{
          background: 'linear-gradient(135deg,#633194,#4B2380)', color: '#FFFFFF',
          padding: '10px 20px', borderRadius: '50px', fontWeight: 700, fontSize: '14px',
          boxShadow: '0 4px 14px rgba(99,49,148,0.3)'
        }}>
          Total: {teachers.length}
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
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: '#F4F0FF', color: '#633194',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '18px', border: '1px solid #DDD6FE'
                  }}>
                    {(teacher.first_name?.[0] || teacher.username[0]).toUpperCase()}
                  </div>
                  <div>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          className="input-field" 
                          value={editFormData.first_name || ''} 
                          onChange={e => setEditFormData({...editFormData, first_name: e.target.value})}
                          placeholder="First Name"
                          style={{ width: '120px' }}
                        />
                        <input 
                          className="input-field" 
                          value={editFormData.last_name || ''} 
                          onChange={e => setEditFormData({...editFormData, last_name: e.target.value})}
                          placeholder="Last Name"
                          style={{ width: '120px' }}
                        />
                      </div>
                    ) : (
                      <h3 style={{ margin: 0, fontSize: '18px', color: '#1F2937', fontWeight: 700 }}>
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
                      {teacher.grade && (
                        <span style={{ background: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                          {teacher.grade}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {isEditing ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleSaveEdit(teacher.id)}
                      disabled={savingId === teacher.id}
                      style={{ background: '#10B981', color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}
                    >
                      {savingId === teacher.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      disabled={savingId === teacher.id}
                      style={{ background: '#F3F4F6', color: '#4B5563', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
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
                      onChange={e => setEditFormData({...editFormData, gender: e.target.value})}
                      style={{ flex: 1 }}
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                    </select>
                    <input
                      className="input-field"
                      value={editFormData.grade || ''}
                      onChange={e => setEditFormData({...editFormData, grade: e.target.value})}
                      placeholder="Grade / Qualification"
                      style={{ flex: 1 }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mail size={16} color="#9CA3AF" />
                  {isEditing ? (
                    <input 
                      className="input-field" 
                      value={editFormData.email || ''} 
                      onChange={e => setEditFormData({...editFormData, email: e.target.value})}
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
                      onChange={e => setEditFormData({...editFormData, phone_number: e.target.value})}
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
                      onChange={e => setEditFormData({...editFormData, birthday: e.target.value})}
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
                      onChange={e => setEditFormData({...editFormData, address: e.target.value})}
                      rows={2}
                      placeholder="Street address..."
                    />
                  ) : (
                    <span style={{ color: '#4B5563', fontSize: '14px', lineHeight: 1.4 }}>{teacher.address || 'N/A'}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeacherManagement;
