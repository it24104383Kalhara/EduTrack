import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, Users, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function RoomsPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<any[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRoomsAndStudents = async () => {
    try {
      const [roomsRes, studentsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/rooms`),
        axios.get(`${API_BASE_URL}/students/unassigned`)
      ]);
      setRooms(roomsRes.data);
      setUnassignedStudents(studentsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    }
  };

  useEffect(() => {
    fetchRoomsAndStudents();
  }, []);

  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !selectedStudentId) return;

    try {
      setErrorMsg('');
      await axios.post(`${API_BASE_URL}/students/assign`, {
        student_id: selectedStudentId,
        room_id: selectedRoom.id
      });
      
      // Auto-create a payment for the new student
      // Assuming initial hostel fee is $500
      try {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(10); // Ensure due date is the 10th
        
        await axios.post(`${API_BASE_URL}/payments`, {
          student_id: selectedStudentId,
          amount: 500,
          due_date: nextMonth.toISOString().split('T')[0]
        });
      } catch (e) {
         console.error('Failed to auto-create payment', e);
      }

      setShowModal(false);
      setSelectedStudentId('');
      fetchRoomsAndStudents(); // Refresh rooms and students
      
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || 'Failed to assign student');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Room & Student Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Assign registered students to rooms</p>
        </div>
      </div>

      <div className="room-grid">
        {rooms.map(room => {
          const isFull = room.occupied >= room.capacity;
          const percentage = (room.occupied / room.capacity) * 100;
          
          return (
            <div 
                key={room.id} 
                className="room-card"
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                onClick={() => navigate(`/rooms/${room.id}`)}
            >
              <div className="room-header">
                <span className="room-id">{room.room_number}</span>
                <span className={`badge ${isFull ? 'full' : 'available'}`}>
                  {isFull ? 'Full' : 'Available'}
                </span>
              </div>
              
              <div className="room-capacity">
                <Users size={16} />
                <span>{room.occupied} / {room.capacity} Residents</span>
              </div>

              <div className="progress-bar" style={{ marginBottom: '1.5rem' }}>
                <div 
                   className={`progress-fill ${isFull ? 'full' : ''}`} 
                   style={{ width: `${percentage}%` }}
                ></div>
              </div>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                disabled={isFull || unassignedStudents.length === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRoom(room);
                  setShowModal(true);
                }}
              >
                <UserPlus size={16} />
                {unassignedStudents.length === 0 ? 'No Unassigned Students' : 'Assign Student'}
              </button>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Assign to {selectedRoom?.room_number}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            {errorMsg && (
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                color: 'var(--danger)', 
                padding: '1rem', 
                borderRadius: '0.5rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={16} />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAssignStudent}>
              <div className="form-group">
                <label>Select Unassigned Student</label>
                <select 
                  className="form-control" 
                  required
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                >
                  <option value="" disabled>Select a student...</option>
                  {unassignedStudents.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
