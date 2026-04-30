import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, User, Phone, Mail, MapPin, LogOut, ArrowRightLeft, AlertCircle, Users } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function RoomDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<any>(null);
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [newRoomId, setNewRoomId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRoomDetails = async () => {
    try {
      const [roomRes, allRoomsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/rooms/${id}`),
          axios.get(`${API_BASE_URL}/rooms`)
      ]);
      setRoom(roomRes.data);
      setAllRooms(allRoomsRes.data);
    } catch (error) {
      console.error("Error fetching room details", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomDetails();
  }, [id]);

  const handleUnassign = async (studentId: number) => {
    if (window.confirm('Are you sure you want to remove this student from the room?')) {
        try {
            await axios.post(`${API_BASE_URL}/students/unassign`, { student_id: studentId });
            fetchRoomDetails();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to remove student');
        }
    }
  };

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !newRoomId) return;

    try {
        setErrorMsg('');
        await axios.post(`${API_BASE_URL}/students/reassign`, {
            student_id: selectedStudent.id,
            new_room_id: newRoomId
        });
        setShowReassignModal(false);
        setNewRoomId('');
        fetchRoomDetails();
    } catch (error: any) {
        setErrorMsg(error.response?.data?.error || 'Failed to reassign student');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading room details...</div>;
  if (!room) return <div className="p-8 text-center text-danger">Room not found</div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.5rem', borderRadius: '50%' }}
            onClick={() => navigate('/rooms')}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">{room.room_number} Management</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Manage student assignments and profiles</p>
          </div>
        </div>
        <div className={`badge ${room.occupied >= room.capacity ? 'full' : 'available'}`} style={{ fontSize: '1rem', padding: '0.5rem 1.25rem' }}>
          {room.occupied} / {room.capacity} Residents
        </div>
      </div>

      <div className="room-grid">
        {room.students && room.students.length > 0 ? (
          room.students.map((student: any) => (
            <div key={student.id} className="room-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <User size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{student.first_name} {student.last_name}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span className="badge available" style={{ fontSize: '0.65rem' }}>Active</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>#{student.id}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Mail size={16} color="var(--primary)" />
                  <span>{student.parent_email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Phone size={16} color="var(--primary)" />
                  <span>{student.parent_phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <MapPin size={16} color="var(--primary)" />
                  <span style={{ fontSize: '0.8rem' }}>{student.address}</span>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}
                  onClick={() => { setSelectedStudent(student); setShowReassignModal(true); }}
                >
                  <ArrowRightLeft size={14} />
                  Move
                </button>
                <button 
                  className="btn btn-danger" 
                  style={{ flex: 1, fontSize: '0.8rem', background: '#FEE2E2', color: '#EF4444', padding: '0.5rem' }}
                  onClick={() => handleUnassign(student.id)}
                >
                  <LogOut size={14} />
                  Remove
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem 2rem', background: 'white', borderRadius: '1.5rem', border: '2px dashed var(--border)' }}>
            <div style={{ background: '#F9FAFB', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Users size={40} color="var(--text-secondary)" />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No Residents Found</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>This room is currently empty. Go back to the rooms list to assign new students here.</p>
            <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={() => navigate('/rooms')}>
                Assign Now
            </button>
          </div>
        )}
      </div>

      {showReassignModal && (
          <div className="modal-overlay">
              <div className="modal-content">
                  <div className="modal-header">
                      <h2>Reassign Student</h2>
                      <button className="close-btn" onClick={() => setShowReassignModal(false)}>&times;</button>
                  </div>
                  
                  {errorMsg && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={16} />
                        {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleReassign}>
                      <div className="form-group">
                          <label>Move <b>{selectedStudent?.first_name}</b> to:</label>
                          <select 
                              className="form-control" 
                              required
                              value={newRoomId}
                              onChange={e => setNewRoomId(e.target.value)}
                          >
                              <option value="" disabled>Select target room...</option>
                              {allRooms.filter(r => r.id !== room.id && r.occupied < r.capacity).map(r => (
                                  <option key={r.id} value={r.id}>
                                      {r.room_number} ({r.occupied}/{r.capacity})
                                  </option>
                              ))}
                          </select>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                          <button type="button" className="btn btn-secondary" onClick={() => setShowReassignModal(false)}>Cancel</button>
                          <button type="submit" className="btn btn-primary">Confirm Transfer</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}
