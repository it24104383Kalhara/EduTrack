import { useState } from 'react'

interface Room {
  id: string
  roomNumber: string
  capacity: number
  occupied: number
  type: string
  status: 'available' | 'occupied' | 'maintenance'
}

const RoomManagementPage = () => {
  const [rooms] = useState<Room[]>([
    { id: '1', roomNumber: 'A101', capacity: 4, occupied: 3, type: 'Standard', status: 'occupied' },
    { id: '2', roomNumber: 'A102', capacity: 4, occupied: 0, type: 'Standard', status: 'available' },
    { id: '3', roomNumber: 'B201', capacity: 2, occupied: 2, type: 'Deluxe', status: 'occupied' },
    { id: '4', roomNumber: 'B202', capacity: 2, occupied: 0, type: 'Deluxe', status: 'available' },
    { id: '5', roomNumber: 'C301', capacity: 6, occupied: 4, type: 'Suite', status: 'occupied' }
  ])

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const ActionButton = ({ 
    title, 
    description, 
    icon, 
    color, 
    onClick 
  }: {
    title: string
    description: string
    icon: string
    color: string
    onClick: () => void
  }) => (
    <button 
      className="action-button"
      style={{ '--button-color': color } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="button-icon">{icon}</div>
      <div className="button-content">
        <h3 className="button-title">{title}</h3>
        <p className="button-description">{description}</p>
      </div>
    </button>
  )

  const Modal = ({ 
    title, 
    children, 
    onClose, 
    isOpen 
  }: {
    title: string
    children: React.ReactNode
    onClose: () => void
    isOpen: boolean
  }) => {
    if (!isOpen) return null

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{title}</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            {children}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="room-management-container">
      <div className="page-header">
        <h1 className="page-title">Room Management</h1>
        <p className="page-subtitle">Manage hostel rooms and occupancy</p>
      </div>

      <div className="action-buttons-grid">
        <ActionButton
          title="Allocate Student"
          description="Assign a student to hostel room"
          icon="➕"
          color="#10b981"
          onClick={() => setShowAddModal(true)}
        />
        
        <ActionButton
          title="Edit / Update Room"
          description="Modify existing room details"
          icon="✏️"
          color="#3b82f6"
          onClick={() => setShowEditModal(true)}
        />
        
        <ActionButton
          title="Remove Student"
          description="Remove student from room and delete empty rooms"
          icon="🗑️"
          color="#ef4444"
          onClick={() => setShowDeleteModal(true)}
        />
        
        <ActionButton
          title="Room Details"
          description="View complete room information"
          icon="👁️"
          color="#8b5cf6"
          onClick={() => setShowDetailsModal(true)}
        />
      </div>

      {/* Quick Stats */}
      <div className="stats-section">
        <h2 className="stats-title">Room Overview</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{rooms.length}</div>
            <div className="stat-label">Total Rooms</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{rooms.filter(r => r.status === 'available').length}</div>
            <div className="stat-label">Available</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{rooms.filter(r => r.status === 'occupied').length}</div>
            <div className="stat-label">Occupied</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{rooms.filter(r => r.status === 'maintenance').length}</div>
            <div className="stat-label">Maintenance</div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal 
        title="Allocate Student" 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
      >
        <div className="form-group">
          <label>Student Name</label>
          <input type="text" placeholder="Enter student name" />
        </div>
        <div className="form-group">
          <label>Room Number</label>
          <input type="text" placeholder="e.g., A101" />
        </div>
        <div className="form-group">
          <label>Capacity</label>
          <input type="number" placeholder="e.g., 4" min="1" max="4" />
        </div>
        <div className="form-group">
          <label>Parent Phone Number</label>
          <input type="tel" placeholder="Enter parent phone number" />
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={() => setShowAddModal(false)}>
            Cancel
          </button>
          <button className="btn-primary" onClick={() => setShowAddModal(false)}>
            Allocate Student
          </button>
        </div>
      </Modal>

      <Modal 
        title="Edit / Update Room" 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)}
      >
        <div className="form-group">
          <label>Student Name</label>
          <input type="text" placeholder="Enter student name" />
        </div>
        <div className="form-group">
          <label>Current Room Number</label>
          <input type="text" placeholder="e.g., A101" />
        </div>
        <div className="form-group">
          <label>New Room Number</label>
          <input type="text" placeholder="e.g., A102" />
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={() => setShowEditModal(false)}>
            Cancel
          </button>
          <button className="btn-primary" onClick={() => setShowEditModal(false)}>
            Update Room
          </button>
        </div>
      </Modal>

      <Modal 
        title="Remove Student" 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)}
      >
        <div className="form-group">
          <label>Student Name</label>
          <input type="text" placeholder="Enter student name to remove" />
        </div>
        <p className="warning-text">
          ⚠️ Warning: Student will be removed from their assigned room. If the room becomes empty, it will be automatically deleted from the system.
        </p>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </button>
          <button className="btn-danger" onClick={() => setShowDeleteModal(false)}>
            Remove Student
          </button>
        </div>
      </Modal>

      <Modal 
        title="Room Details" 
        isOpen={showDetailsModal} 
        onClose={() => setShowDetailsModal(false)}
      >
        <div className="room-details">
          <div className="details-grid">
            {rooms.map(room => (
              <div key={room.id} className="room-card">
                <div className="room-header">
                  <div className="room-title">
                    <h4>{room.roomNumber}</h4>
                    <span className="room-type">{room.type}</span>
                  </div>
                  <span className={`status-badge ${room.status}`}>
                    {room.status}
                  </span>
                </div>
                <div className="room-info">
                  <div className="info-row">
                    <span className="info-label">Capacity:</span>
                    <span className="info-value">{room.capacity}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Occupied:</span>
                    <span className="info-value">{room.occupied}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Available:</span>
                    <span className="info-value highlight">{room.capacity - room.occupied}</span>
                  </div>
                  <div className="occupancy-bar">
                    <div className="occupancy-fill" style={{ width: `${(room.occupied / room.capacity) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-primary" onClick={() => setShowDetailsModal(false)}>
            Close
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default RoomManagementPage
