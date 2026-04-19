import { useState, useEffect } from 'react'

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
    <>
      <div className="room-management-container">
        <div className="page-header">
          <h1 className="page-title">Room Management</h1>
          <p className="page-subtitle">Create new rooms for the hostel</p>
        </div>

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
                        <span className="room-label">Room ID</span>
                        <span className="room-id-value">{room.roomNumber}</span>
                      </div>
                      <div className="max-badge gradient-badge">
                        <span className="max-room">{room.roomNumber}</span>
                        <span className="max-label">Max</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-divider"></div>
                  
                  <div className="card-middle middle-bg">
                    <div className="capacity-info">
                      <span className="capacity-icon">🛏️</span>
                      <span className="capacity-text">Maximum beds in {room.roomNumber}</span>
                      <span className="capacity-value">:- {room.capacity} beds</span>
                    </div>
                  </div>
                  
                  <div className="card-divider"></div>
                  
                  <div className="card-bottom bottom-bg">
                    <div className="status-section">
                      <span className="status-label">Status</span>
                      <span className="status-value status-available">Available</span>
                    </div>
                    <div className="created-section">
                      <span className="created-icon">📅</span>
                      <span className="created-text">{room.createdAt}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <style>{`
      .room-management-container {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        min-height: 100vh;
      }
      
      .page-header {
        text-align: center;
        margin-bottom: 40px;
      }
      
      .page-title {
        color: #2c3e50;
        font-size: 2.5rem;
        margin-bottom: 10px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .page-subtitle {
        color: #7f8c8d;
        font-size: 1.1rem;
        margin: 0;
      }
      
      .room-form-container {
        background: white;
        border-radius: 16px;
        padding: 30px;
        margin-bottom: 40px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(0, 0, 0, 0.05);
      }
      
      .form-group {
        margin-bottom: 20px;
      }
      
      .form-group label {
        display: block;
        margin-bottom: 8px;
        color: #2c3e50;
        font-weight: 600;
        font-size: 0.95rem;
      }
      
      .form-group input {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        font-size: 1rem;
        transition: all 0.3s ease;
        box-sizing: border-box;
      }
      
      .form-group input:focus {
        outline: none;
        border-color: #3498db;
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
      }
      
      .form-actions {
        display: flex;
        gap: 15px;
        margin-top: 25px;
      }
      
      .btn-primary {
        background: linear-gradient(135deg, #3498db, #2980b9);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
      }
      
      .btn-primary:hover {
        background: linear-gradient(135deg, #2980b9, #21618c);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
      }
      
      .rooms-list-container {
        background: rgba(255, 255, 255, 0.5);
        border-radius: 20px;
        padding: 30px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
        padding-bottom: 15px;
        border-bottom: 2px solid rgba(52, 152, 219, 0.2);
      }
      
      .list-header h2 {
        color: #2c3e50;
        margin: 0;
        font-size: 1.8rem;
      }
      
      .room-count {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .count-badge {
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-weight: bold;
        font-size: 0.9rem;
      }
      
      .count-text {
        color: #7f8c8d;
        font-weight: 500;
      }
      
      .rooms-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 25px;
      }
      
      .room-card {
        border-radius: 16px;
        overflow: hidden;
        transition: all 0.3s ease;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(0, 0, 0, 0.05);
      }
      
      .room-card:hover {
        transform: translateY(-8px) scale(1.02);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
      }
      
      .card-top {
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      
      .card-middle {
        padding: 20px;
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
      }
      
      .card-bottom {
        padding: 20px;
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        color: white;
      }
      
      .card-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.2);
      }
      
      .room-header-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .room-id-section {
        text-align: left;
      }
      
      .room-label {
        font-size: 0.8rem;
        opacity: 0.8;
        margin-bottom: 5px;
      }
      
      .room-id-value {
        font-size: 1.5rem;
        font-weight: bold;
      }
      
      .max-badge {
        background: rgba(255, 255, 255, 0.2);
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
      }
      
      .capacity-info {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.95rem;
      }
      
      .status-section, .created-section {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9rem;
      }
      
      .status-available {
        background: rgba(46, 204, 113, 0.2);
        color: #2ecc71;
        padding: 4px 8px;
        border-radius: 12px;
        font-weight: 500;
      }
    `}</style>
    </>
  )
}

export default RoomManagementPage
