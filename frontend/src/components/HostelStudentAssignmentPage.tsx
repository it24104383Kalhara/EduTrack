import { useState, useEffect } from 'react';
import Header from './Header';
import { studentAPI, roomAPI } from '../services/api';

interface Student {
  id: number;
  registration_number: string;
  student_name: string;
  grade: string;
  address: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  registered_at: string;
  assigned_room: number | null;
  room_number?: string;
}

interface Room {
  id: number;
  room_number: string;
  capacity: number;
  current_occupancy: number;
  created_at: string;
}

const HostelStudentAssignmentPage = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [showRoomStudents, setShowRoomStudents] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsRes, studentsRes, unassignedRes] = await Promise.all([
        roomAPI.getAll(),
        studentAPI.getAll(),
        studentAPI.getUnassigned()
      ]);
      
      setRooms(roomsRes.data);
      setStudents(studentsRes.data);
      setUnassignedStudents(unassignedRes.data);
      setError(null);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStudent = async () => {
    if (!selectedStudent || !selectedRoom) {
      setError('Please select both student and room');
      return;
    }

    try {
      await studentAPI.assignToRoom(parseInt(selectedStudent), parseInt(selectedRoom));
      setMessage({ type: 'success', text: 'Student assigned to room successfully!' });
      setSelectedStudent('');
      setSelectedRoom('');
      fetchData();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to assign student to room');
    }
  };

  const handleRemoveFromRoom = async (studentId: number) => {
    if (!window.confirm('Are you sure you want to remove this student from the room?')) {
      return;
    }

    try {
      await studentAPI.removeFromRoom(studentId);
      setMessage({ type: 'success', text: 'Student removed from room successfully!' });
      fetchData();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to remove student from room');
    }
  };

  const getRoomStudents = async (roomId: number) => {
    try {
      const response = await studentAPI.getStudentsInRoom(roomId);
      return response.data;
    } catch (error) {
      console.error('Error fetching room students:', error);
      return [];
    }
  };

  const handleShowRoomStudents = async (roomId: number) => {
    if (showRoomStudents === roomId) {
      setShowRoomStudents(null);
    } else {
      const roomStudents = await getRoomStudents(roomId);
      // Update the room with its students
      setRooms(prev => prev.map(room => 
        room.id === roomId 
          ? { ...room, students: roomStudents }
          : room
      ));
      setShowRoomStudents(roomId);
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="Student Room Assignment" subtitle="Assign students to hostel rooms" userName="Admin" />
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div>Loading data...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Student Room Assignment" subtitle="Assign students to hostel rooms" userName="Admin" />
      
      <div style={{ padding: '20px' }}>
        {error && (
          <div style={{ 
            backgroundColor: '#ffebee', 
            color: '#c62828', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '20px' 
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ 
            backgroundColor: message.type === 'success' ? '#e8f5e8' : '#fff3cd',
            color: message.type === 'success' ? '#2e7d32' : '#856404',
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '20px' 
          }}>
            {message.text}
          </div>
        )}

        {/* Assignment Form */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3>Assign Student to Room</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Select Student:
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px' 
                }}
              >
                <option value="">Choose a student...</option>
                {unassignedStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.student_name} ({student.registration_number}) - Grade {student.grade}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Select Room:
              </label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px' 
                }}
              >
                <option value="">Choose a room...</option>
                {rooms
                  .filter(room => room.current_occupancy < room.capacity)
                  .map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.room_number} ({room.current_occupancy}/{room.capacity} available)
                    </option>
                  ))}
              </select>
            </div>
            
            <button
              onClick={handleAssignStudent}
              disabled={!selectedStudent || !selectedRoom}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                opacity: (!selectedStudent || !selectedRoom) ? 0.6 : 1
              }}
            >
              Assign to Room
            </button>
          </div>
        </div>

        {/* Rooms Overview */}
        <div style={{ marginBottom: '30px' }}>
          <h3>Rooms Overview</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {rooms.map((room) => (
              <div
                key={room.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0 }}>{room.room_number}</h4>
                  <span style={{ 
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: room.current_occupancy >= room.capacity ? '#ffebee' : '#e8f5e8',
                    color: room.current_occupancy >= room.capacity ? '#c62828' : '#2e7d32'
                  }}>
                    {room.current_occupancy}/{room.capacity}
                  </span>
                </div>
                
                <button
                  onClick={() => handleShowRoomStudents(room.id)}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {showRoomStudents === room.id ? 'Hide Students' : 'View Students'}
                </button>

                {showRoomStudents === room.id && (room as any).students && (
                  <div style={{ marginTop: '15px' }}>
                    <h5 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Assigned Students:</h5>
                    {(room as any).students.length > 0 ? (
                      <div style={{ fontSize: '12px' }}>
                        {(room as any).students.map((student: any) => (
                          <div key={student.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '5px 0',
                            borderBottom: '1px solid #eee'
                          }}>
                            <div>
                              <strong>{student.student_name}</strong><br />
                              <span style={{ color: '#666' }}>
                                {student.registration_number} - Grade {student.grade}
                              </span>
                            </div>
                            <button
                              onClick={() => handleRemoveFromRoom(student.id)}
                              style={{
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '10px'
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                        No students assigned to this room
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* All Students List */}
        <div>
          <h3>All Students ({students.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Reg. No</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Grade</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Room</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Parent Email</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{student.registration_number}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{student.student_name}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{student.grade}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                      {student.assigned_room ? student.room_number || `Room ${student.assigned_room}` : 'Not Assigned'}
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{student.parent_email || 'N/A'}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                      {student.assigned_room && (
                        <button
                          onClick={() => handleRemoveFromRoom(student.id)}
                          style={{
                            backgroundColor: '#ffc107',
                            color: 'black',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Remove from Room
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostelStudentAssignmentPage;
