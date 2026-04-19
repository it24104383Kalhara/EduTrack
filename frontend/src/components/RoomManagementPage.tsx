import React, { useState, useEffect } from 'react'
import Header from './Header'
import './RoomManagementPage.css'

const RoomManagementPage = () => {
  // Form state for creating new room
  const [newRoom, setNewRoom] = useState({
    roomNumber: '',
    capacity: ''
  })
  
  // State to store created rooms
  const [rooms, setRooms] = useState<Array<{
    id: string
    roomNumber: string
    capacity: number
    createdAt: string
  }>>([])

  // Load rooms from localStorage on component mount
  useEffect(() => {
    const savedRooms = localStorage.getItem('rooms')
    if (savedRooms) {
      try {
        const roomsData = JSON.parse(savedRooms)
        setRooms(roomsData)
      } catch (error) {
        console.error('Error loading rooms from localStorage:', error)
      }
    }
  }, [])

  const handleCreateRoom = () => {
    if (newRoom.roomNumber && newRoom.capacity) {
      const room = {
        id: Date.now().toString(),
        roomNumber: newRoom.roomNumber,
        capacity: parseInt(newRoom.capacity),
        createdAt: new Date().toLocaleString()
      }
      
      const updatedRooms = [...rooms, room]
      setRooms(updatedRooms)
      
      // Save rooms to localStorage for StudentRoomAssignmentPage
      localStorage.setItem('rooms', JSON.stringify(updatedRooms))
      
      console.log('Creating room:', room)
      alert(`Room ${newRoom.roomNumber} created successfully!`)
      setNewRoom({ roomNumber: '', capacity: '' })
    } else {
      alert('Please fill in all required fields')
    }
  }

  return (
    <div className="room-management-container">
      <Header 
        title="Room Management"
        subtitle="Create and manage hostel rooms"
        userName="Admin"
      />

      {/* Room Creation Form */}
        <div className="room-form-container">
          <h2>Create New Room</h2>
          <div className="form-group">
            <label>Room Number *</label>
            <input 
              type="text" 
              placeholder="e.g., A101" 
              value={newRoom.roomNumber}
              onChange={(e) => setNewRoom({...newRoom, roomNumber: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Capacity *</label>
            <input 
              type="number" 
              placeholder="e.g., 4" 
              min="1" 
              max="6"
              value={newRoom.capacity}
              onChange={(e) => setNewRoom({...newRoom, capacity: e.target.value})}
            />
          </div>
          <div className="form-actions">
            <button 
              className="btn-primary" 
              onClick={handleCreateRoom}
            >
              🏠 Create Room
            </button>
          </div>
        </div>

        {/* Rooms List */}
        {rooms.length > 0 && (
          <div className="rooms-list-container">
            <div className="list-header">
              <h2>Room Inventory</h2>
              <div className="room-count">
                <span className="count-badge">{rooms.length}</span>
                <span className="count-text">Total Rooms</span>
              </div>
            </div>
            <div className="rooms-grid">
              {rooms.map((room) => (
                <div key={room.id} className="room-card professional-colored">
                  <div className="card-top top-gradient">
                    <div className="room-header-info">
                      <div className="room-id-section">
                        <div className="room-icon">🏠</div>
                        <div className="room-details">
                          <span className="room-label">Room Number</span>
                          <span className="room-id-value">{room.roomNumber}</span>
                        </div>
                      </div>
                      <div className="max-badge gradient-badge">
                        <span className="max-icon">⭐</span>
                        <div className="max-info">
                          <span className="max-room">{room.roomNumber}</span>
                          <span className="max-label">Premium</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-divider"></div>
                  
                  <div className="card-middle middle-bg">
                    <div className="capacity-section">
                      <div className="capacity-header">
                        <span className="capacity-icon">🛏️</span>
                        <span className="capacity-title">Room Capacity</span>
                      </div>
                      <div className="capacity-details">
                        <div className="capacity-number">{room.capacity}</div>
                        <div className="capacity-label">Available Beds</div>
                      </div>
                      <div className="capacity-bar">
                        <div className="capacity-fill" style={{width: `${(room.capacity / 6) * 100}%`}}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-divider"></div>
                  
                  <div className="card-bottom bottom-bg">
                    <div className="status-section">
                      <div className="status-indicator">
                        <div className="status-dot"></div>
                        <span className="status-label">Availability</span>
                      </div>
                      <span className="status-value status-available">
                        <span className="status-icon">✓</span>
                        Available Now
                      </span>
                    </div>
                    <div className="created-section">
                      <span className="created-icon">🕐</span>
                      <div className="created-info">
                        <span className="created-label">Added</span>
                        <span className="created-text">{room.createdAt}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  )
}

export default RoomManagementPage;
