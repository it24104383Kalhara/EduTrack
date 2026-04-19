import { useState, useEffect } from 'react';
import Header from './Header';
import { roomAPI, studentAPI, paymentAPI } from '../services/api';
import './DashboardPage.css';

interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  totalStudents: number;
  studentsInHostel: number;
  pendingPayments: number;
  overduePayments: number;
  totalCollected: number;
  dueThisWeek: number;
}

interface Room {
  id: number;
  room_number: string;
  capacity: number;
  current_occupancy: number;
}

interface Student {
  id: number;
  registration_number: string;
  student_name: string;
  grade: string;
  assigned_room: number | null;
}

interface Payment {
  id: number;
  amount: number;
  status: string;
  due_date: string;
  student: {
    student_name: string;
  };
}

const HostelDashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRooms: 0,
    occupiedRooms: 0,
    totalStudents: 0,
    studentsInHostel: 0,
    pendingPayments: 0,
    overduePayments: 0,
    totalCollected: 0,
    dueThisWeek: 0
  });
  const [recentRooms, setRecentRooms] = useState<Room[]>([]);
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Starting dashboard data fetch...');
      
      // Simple sequential calls to avoid Promise.all issues
      const roomsRes = await roomAPI.getAll();
      console.log('✅ Rooms response:', roomsRes);
      
      const studentsRes = await studentAPI.getAll();
      console.log('✅ Students response:', studentsRes);
      
      const pendingRes = await paymentAPI.getPending();
      console.log('✅ Pending payments response:', pendingRes);
      
      const overdueRes = await paymentAPI.getOverdue();
      console.log('✅ Overdue payments response:', overdueRes);
      
      const dueWeekRes = await paymentAPI.getDueInWeek();
      console.log('✅ Due week payments response:', dueWeekRes);
      
      const allPaymentsRes = await paymentAPI.getAll();
      console.log('✅ All payments response:', allPaymentsRes);

      if (roomsRes && studentsRes && pendingRes && overdueRes && dueWeekRes && allPaymentsRes) {
        
        const rooms = roomsRes.data?.data || [];
        const students = studentsRes.data?.data || [];
        const pendingPayments = pendingRes.data?.data || [];
        const overduePayments = overdueRes.data?.data || [];
        const dueThisWeek = dueWeekRes.data?.data || [];
        const allPayments = allPaymentsRes.data?.data || [];

        console.log('📊 Processing data:', { rooms: rooms.length, students: students.length, payments: allPayments.length });

        const occupiedRooms = rooms.filter((room: Room) => room.current_occupancy > 0).length;
        const studentsInHostel = students.filter((student: Student) => student.assigned_room !== null).length;
        const totalCollected = allPayments
          .filter((payment: Payment) => payment.status === 'paid')
          .reduce((sum: number, payment: Payment) => sum + payment.amount, 0);

        const newStats = {
          totalRooms: rooms.length,
          occupiedRooms,
          totalStudents: students.length,
          studentsInHostel,
          pendingPayments: pendingPayments.length,
          overduePayments: overduePayments.length,
          totalCollected,
          dueThisWeek: dueThisWeek.length
        };

        console.log('📈 New stats:', newStats);
        setStats(newStats);

        setRecentRooms(rooms.slice(0, 5));
        setRecentStudents(students.slice(0, 5));
        setRecentPayments(allPayments.slice(0, 5));
      } else {
        console.error('❌ Missing responses:', { roomsRes, studentsRes, pendingRes, overdueRes, dueWeekRes, allPaymentsRes });
        setError('Failed to fetch dashboard data - missing responses');
      }
    } catch (err) {
      console.error('❌ Dashboard data fetch error:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config
      });
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div>
        <Header title="Hostel Dashboard" subtitle="Overview of hostel management system" userName="Admin" />
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Hostel Dashboard" subtitle="Overview of hostel management system" userName="Admin" />
      
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>Dashboard Overview</h2>
          <button
            onClick={handleRefresh}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
          >
            🔄 Refresh Data
          </button>
        </div>
        
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

        {/* Statistics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}>
              🏠
            </div>
            <div className="stat-content">
              <h3>{stats.totalRooms}</h3>
              <p>Total Rooms</p>
              <small>{stats.occupiedRooms} occupied</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#e8f5e8', color: '#388e3c' }}>
              👥
            </div>
            <div className="stat-content">
              <h3>{stats.studentsInHostel}</h3>
              <p>Students in Hostel</p>
              <small>{stats.totalStudents} total registered</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#fff3e0', color: '#f57c00' }}>
              ⏰
            </div>
            <div className="stat-content">
              <h3>{stats.pendingPayments}</h3>
              <p>Pending Payments</p>
              <small>{stats.dueThisWeek} due this week</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#ffebee', color: '#d32f2f' }}>
              ⚠️
            </div>
            <div className="stat-content">
              <h3>{stats.overduePayments}</h3>
              <p>Overdue Payments</p>
              <small>Require immediate attention</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#e0f2f1', color: '#00796b' }}>
              💰
            </div>
            <div className="stat-content">
              <h3>${stats.totalCollected.toFixed(2)}</h3>
              <p>Total Collected</p>
              <small>All time payments</small>
            </div>
          </div>
        </div>

        {/* Recent Data Tables */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          {/* Recent Rooms */}
          <div className="dashboard-section">
            <h3>Room Status</h3>
            <div className="mini-table">
              <table>
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Occupancy</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRooms.map((room) => (
                    <tr key={room.id}>
                      <td>{room.room_number}</td>
                      <td>{room.current_occupancy}/{room.capacity}</td>
                      <td>
                        <span className={`status-badge ${
                          room.current_occupancy === 0 ? 'empty' :
                          room.current_occupancy >= room.capacity ? 'full' : 'occupied'
                        }`}>
                          {room.current_occupancy === 0 ? 'Empty' :
                           room.current_occupancy >= room.capacity ? 'Full' : 'Available'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Students */}
          <div className="dashboard-section">
            <h3>Recent Students</h3>
            <div className="mini-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Grade</th>
                    <th>Room</th>
                  </tr>
                </thead>
                <tbody>
                  {recentStudents.map((student) => (
                    <tr key={student.id}>
                      <td>{student.student_name}</td>
                      <td>{student.grade}</td>
                      <td>{student.assigned_room ? `Room ${student.assigned_room}` : 'Not Assigned'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Payments */}
          <div className="dashboard-section">
            <h3>Recent Payments</h3>
            <div className="mini-table">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.student.student_name}</td>
                      <td>${payment.amount.toFixed(2)}</td>
                      <td>
                        <span className={`status-badge ${payment.status}`}>
                          {payment.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dashboard-section">
            <h3>Quick Actions</h3>
            <div className="quick-actions">
              <button 
                onClick={() => window.location.href = '#rooms'}
                className="action-btn"
                style={{ backgroundColor: '#1976d2' }}
              >
                🏠 Manage Rooms
              </button>
              <button 
                onClick={() => window.location.href = '#assignment'}
                className="action-btn"
                style={{ backgroundColor: '#388e3c' }}
              >
                👥 Assign Students
              </button>
              <button 
                onClick={() => window.location.href = '#payments'}
                className="action-btn"
                style={{ backgroundColor: '#f57c00' }}
              >
                💳 Manage Payments
              </button>
              <button 
                onClick={() => window.location.href = '#register'}
                className="action-btn"
                style={{ backgroundColor: '#7b1fa2' }}
              >
                📝 Register Student
              </button>
            </div>
          </div>
        </div>

        {/* Occupancy Chart */}
        <div className="dashboard-section" style={{ marginTop: '20px' }}>
          <h3>Hostel Occupancy Overview</h3>
          <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
            <div style={{ marginBottom: '15px' }}>
              <strong>Overall Occupancy Rate:</strong> {Math.round((stats.studentsInHostel / (stats.totalRooms * 5)) * 100)}%
            </div>
            <div style={{
              width: '100%',
              height: '30px',
              backgroundColor: '#e9ecef',
              borderRadius: '15px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(stats.studentsInHostel / (stats.totalRooms * 5)) * 100}%`,
                height: '100%',
                backgroundColor: '#28a745',
                transition: 'width 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold'
              }}>
                {Math.round((stats.studentsInHostel / (stats.totalRooms * 5)) * 100)}%
              </div>
            </div>
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
              {stats.studentsInHostel} students in {stats.occupiedRooms} occupied rooms out of {stats.totalRooms} total rooms
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostelDashboardPage;
