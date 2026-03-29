import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../services/api';
import { CheckCircle, XCircle, UserPlus, Clock, GraduationCap, Loader2, Mail } from 'lucide-react';

interface PendingUser {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

const AdminApprovals: React.FC = () => {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const token = localStorage.getItem('edutrack_token');

  const fetchPendingUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUsers(data.data);
      } else {
        setError(data.message || 'Failed to fetch pending users');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
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
      console.error('Failed to fetch grades');
    }
  };

  useEffect(() => {
    fetchPendingUsers();
    fetchGrades();
  }, [token]);

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      const grade_id = action === 'approve' ? selectedGrades[id] : undefined;
      const response = await fetch(`${API_BASE_URL}/users/${id}/${action}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ grade_id: grade_id ? parseInt(grade_id) : undefined })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUsers(prev => prev.filter(u => u.id !== id));
      } else {
        alert(data.message || `Failed to ${action} user`);
      }
    } catch {
      alert('Network error');
    } finally {
      setProcessingId(null);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '48px 24px', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '20px',
          padding: '48px', textAlign: 'center', maxWidth: '400px', width: '100%'
        }}>
          <div style={{ 
            width: '64px', height: '64px', background: 'linear-gradient(135deg, #633194 0%, #4B2380 100%)', 
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 20px', boxShadow: '0 4px 12px rgba(99, 49, 148, 0.2)' 
          }}>
            <CheckCircle size={32} color="#FFFFFF" />
          </div>
          <h2 style={{ color: '#1E1B4B', margin: '0 0 8px', fontSize: '22px', fontWeight: 800 }}>Welcome to your account</h2>
          <p style={{ color: '#6B7280', margin: 0, fontSize: '14px', lineHeight: 1.6 }}>
            You are logged in as a <strong>{user?.role}</strong>. Use the sidebar to manage your classes and students.
          </p>
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
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .approval-card { transition: box-shadow 0.2s, transform 0.2s; animation: fadeSlideIn 0.35s ease both; }
        .approval-card:hover { box-shadow: 0 8px 30px rgba(99,49,148,0.12) !important; transform: translateY(-2px); }
        .btn-approve { transition: all 0.2s; }
        .btn-approve:hover { background: linear-gradient(135deg,#059669,#047857) !important; box-shadow: 0 4px 14px rgba(16,185,129,0.4); }
        .btn-reject { transition: all 0.2s; }
        .btn-reject:hover { background: linear-gradient(135deg,#DC2626,#B91C1C) !important; box-shadow: 0 4px 14px rgba(239,68,68,0.35); }
        .grade-select:focus { outline: none; border-color: #633194 !important; box-shadow: 0 0 0 3px rgba(99,49,148,0.15); }
      `}</style>

      {/* ── Header ── */}
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
            <UserPlus size={26} color="#FFFFFF" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#1e1b4b' }}>
              Registration Approvals
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
              Review and manage new teacher accounts requesting access to EduTrack.
            </p>
          </div>
        </div>
        <div style={{
          background: users.length > 0 ? 'linear-gradient(135deg,#633194,#4B2380)' : '#F3F4F6',
          color: users.length > 0 ? '#FFFFFF' : '#6B7280',
          padding: '10px 20px', borderRadius: '50px', fontWeight: 700, fontSize: '14px',
          display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: users.length > 0 ? '0 4px 14px rgba(99,49,148,0.3)' : 'none'
        }}>
          <Clock size={16} />
          {users.length} Pending {users.length === 1 ? 'Request' : 'Requests'}
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div style={{
          background: '#FEF2F2', color: '#EF4444', padding: '14px 20px',
          borderRadius: '12px', marginBottom: '20px', border: '1px solid #FCA5A5',
          display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600
        }}>
          <XCircle size={18} /> {error}
        </div>
      )}

      {/* ── Empty State ── */}
      {users.length === 0 ? (
        <div style={{
          background: '#FFFFFF', borderRadius: '20px', padding: '80px 24px',
          textAlign: 'center', boxShadow: '0 4px 20px rgba(99,49,148,0.06)',
          border: '1px solid #EDE9FE'
        }}>
          <div style={{
            background: 'linear-gradient(135deg,#F4F0FF,#EDE9FE)', width: '80px', height: '80px',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <CheckCircle color="#633194" size={40} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1F2937', margin: '0 0 8px' }}>
            All caught up! 🎉
          </h3>
          <p style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>
            There are no pending registrations waiting for approval.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {users.map((u, idx) => (
            <div
              key={u.id}
              className="approval-card"
              style={{
                background: '#FFFFFF', borderRadius: '18px',
                boxShadow: '0 2px 12px rgba(99,49,148,0.06)', border: '1px solid #EDE9FE',
                padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '16px',
                animationDelay: `${idx * 0.06}s`
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '40px', height: '40px', minWidth: '40px', borderRadius: '12px',
                background: 'linear-gradient(135deg,#633194,#4B2380)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFFFFF', fontWeight: 800, fontSize: '18px',
                boxShadow: '0 4px 12px rgba(99,49,148,0.3)'
              }}>
                {u.username.charAt(0).toUpperCase()}
              </div>

              {/* User Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, color: '#1e1b4b', fontSize: '16px', marginBottom: '4px' }}>
                  {u.username}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6B7280', fontSize: '13px' }}>
                  <Mail size={13} color="#9D85C5" />
                  {u.email}
                </div>
                <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    background: '#F4F0FF', color: '#633194', padding: '3px 10px',
                    borderRadius: '8px', fontSize: '11px', fontWeight: 700, textTransform: 'capitalize',
                    border: '1px solid #DDD6FE'
                  }}>
                    {u.role}
                  </span>
                  <span style={{ color: '#9CA3AF', fontSize: '12px' }}>
                    Registered {new Date(u.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Class Selector */}
              {u.role === 'teacher' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#633194', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <GraduationCap size={13} /> Assign Class
                  </label>
                  <select
                    className="grade-select"
                    value={selectedGrades[u.id] || ''}
                    onChange={(e) => setSelectedGrades({ ...selectedGrades, [u.id]: e.target.value })}
                    style={{
                      padding: '9px 12px', borderRadius: '10px',
                      border: '1.5px solid #DDD6FE', fontSize: '13px',
                      color: '#374151', background: '#FAFAFF', cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif', fontWeight: 600, transition: 'border-color 0.2s'
                    }}
                  >
                    <option value="">No Class Assigned</option>
                    {grades.filter((g: any) => !g.teacher_id).map(g => (
                      <option key={g.id} value={g.id}>Grade {g.grade}-{g.grade_part}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  className="btn-reject"
                  onClick={() => handleAction(u.id, 'reject')}
                  disabled={processingId === u.id}
                  style={{
                    background: 'linear-gradient(135deg,#EF4444,#DC2626)',
                    color: '#FFFFFF', border: 'none',
                    padding: '10px 20px', borderRadius: '12px', fontSize: '13px',
                    fontWeight: 700, cursor: processingId === u.id ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '7px',
                    opacity: processingId === u.id ? 0.6 : 1,
                    boxShadow: '0 2px 8px rgba(239,68,68,0.25)'
                  }}
                >
                  {processingId === u.id
                    ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    : <XCircle size={15} />}
                  Reject
                </button>
                <button
                  className="btn-approve"
                  onClick={() => handleAction(u.id, 'approve')}
                  disabled={processingId === u.id}
                  style={{
                    background: 'linear-gradient(135deg,#10B981,#059669)',
                    color: '#FFFFFF', border: 'none',
                    padding: '10px 20px', borderRadius: '12px', fontSize: '13px',
                    fontWeight: 700, cursor: processingId === u.id ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '7px',
                    opacity: processingId === u.id ? 0.6 : 1,
                    boxShadow: '0 2px 8px rgba(16,185,129,0.25)'
                  }}
                >
                  {processingId === u.id
                    ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    : <CheckCircle size={15} />}
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminApprovals;
