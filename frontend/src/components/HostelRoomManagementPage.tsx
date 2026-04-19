import React, { useState, useEffect } from 'react';
import Header from './Header';
import { roomAPI } from '../services/api';
import './RoomManagementPage.css';

interface Room {
  id: number;
  room_number: string;
  capacity: number;
  current_occupancy: number;
  created_at: string;
  students?: Array<{
    id: number;
    registration_number: string;
    student_name: string;
    grade: string;
  }>;
}

const HostelRoomManagementPage = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [newRoom, setNewRoom] = useState({
    room_number: '',
    capacity: '5'
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomAPI.getAll();
      setRooms(response.data);
      setError(null);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoom.room_number || !newRoom.capacity) {
      setError('Room number and capacity are required');
      return;
    }

    try {
      await roomAPI.create(newRoom);
      setNewRoom({ room_number: '', capacity: '5' });
      setShowCreateForm(false);
      fetchRooms();
      setError(null);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create room');
    }
  };

  const handleUpdateRoom = async () => {
    if (!editingRoom) return;

    try {
      await roomAPI.update(editingRoom.id, {
        room_number: editingRoom.room_number,
        capacity: editingRoom.capacity.toString()
      });
      setEditingRoom(null);
      fetchRooms();
      setError(null);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update room');
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (!window.confirm('Are you sure you want to delete this room?')) {
      return;
    }

    try {
      await roomAPI.delete(roomId);
      fetchRooms();
      setError(null);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete room');
    }
  };

  const getOccupancyColor = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    if (percentage === 100) return '#ff4444';
    if (percentage >= 80) return '#ff8800';
    if (percentage >= 60) return '#ffaa00';
    return '#00C851';
  };

  if (loading) {
    return (
      <div>
        <Header title="Hostel Room Management" subtitle="Manage hostel rooms and occupancy" userName="Admin" />
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div>Loading rooms...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Hostel Room Management" subtitle="Manage hostel rooms and occupancy" userName="Admin" />
      
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

        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Room Overview ({rooms.length} rooms)</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Add New Room
          </button>
        </div>

        {/* Create Room Form */}
        {showCreateForm && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3>Create New Room</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Room Number (e.g., H001)"
                value={newRoom.room_number}
                onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <select
                value={newRoom.capacity}
                onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="1">1 Student</option>
                <option value="2">2 Students</option>
                <option value="3">3 Students</option>
                <option value="4">4 Students</option>
                <option value="5">5 Students</option>
              </select>
            </div>
            <div>
              <button
                onClick={handleCreateRoom}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                Create Room
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewRoom({ room_number: '', capacity: '5' });
                }}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Rooms Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
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
              {editingRoom?.id === room.id ? (
                // Edit Mode
                <div>
                  <input
                    type="text"
                    value={editingRoom.room_number}
                    onChange={(e) => setEditingRoom({ ...editingRoom, room_number: e.target.value })}
                    style={{ 
                      width: '100%', 
                      padding: '5px', 
                      border: '1px solid #ddd', 
                      borderRadius: '4px',
                      marginBottom: '10px'
                    }}
                  />
                  <select
                    value={editingRoom.capacity}
                    onChange={(e) => setEditingRoom({ ...editingRoom, capacity: parseInt(e.target.value) })}
                    style={{ 
                      width: '100%', 
                      padding: '5px', 
                      border: '1px solid #ddd', 
                      borderRadius: '4px',
                      marginBottom: '10px'
                    }}
                  >
                    <option value={1}>1 Student</option>
                    <option value={2}>2 Students</option>
                    <option value={3}>3 Students</option>
                    <option value={4}>4 Students</option>
                    <option value={5}>5 Students</option>
                  </select>
                  <div>
                    <button
                      onClick={handleUpdateRoom}
                      style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '5px'
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingRoom(null)}
                      style={{
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Display Mode
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: '#333' }}>{room.room_number}</h3>
                    <div>
                      <button
                        onClick={() => setEditingRoom(room)}
                        style={{
                          backgroundColor: '#ffc107',
                          color: 'black',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginRight: '5px'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '5px'
                    }}>
                      <span>Occupancy:</span>
                      <span style={{ 
                        fontWeight: 'bold',
                        color: getOccupancyColor(room.current_occupancy, room.capacity)
                      }}>
                        {room.current_occupancy}/{room.capacity}
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e9ecef',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(room.current_occupancy / room.capacity) * 100}%`,
                        height: '100%',
                        backgroundColor: getOccupancyColor(room.current_occupancy, room.capacity),
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>

                  {room.students && room.students.length > 0 && (
                    <div>
                      <h4 style={{ margin: '10px 0 5px 0', fontSize: '14px' }}>Students:</h4>
                      <div style={{ fontSize: '12px' }}>
                        {room.students.map((student) => (
                          <div key={student.id} style={{ padding: '2px 0' }}>
                            {student.student_name} ({student.registration_number})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {room.current_occupancy === 0 && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#6c757d',
                      fontStyle: 'italic'
                    }}>
                      No students assigned
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HostelRoomManagementPage;
