import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, UserCheck, UserX, Clock, History, Search, RefreshCw, Radio } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function AttendancePage() {
  const [statusList, setStatusList] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'status' | 'logs'>('status');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statusRes, logsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/attendance/status`),
        axios.get(`${API_BASE_URL}/attendance/logs`)
      ]);
      setStatusList(statusRes.data);
      setLogs(logsRes.data);
    } catch (error) {
      console.error("Error fetching attendance data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredStatus = statusList.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rfid_tag?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Radio className="animate-pulse" color="var(--danger)" size={28} />
            IoT Attendance Terminal
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Real-time RFID monitoring and movement logs</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={fetchData} disabled={loading}>
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
            </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="room-card" style={{ padding: '1.5rem', borderLeft: '4px solid #10B981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Currently In Hostel</p>
                    <h2 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>{statusList.filter(s => s.current_status === 'PRESENT').length}</h2>
                </div>
                <div style={{ background: '#D1FAE5', padding: '1rem', borderRadius: '1rem', color: '#10B981' }}>
                    <UserCheck size={28} />
                </div>
            </div>
        </div>
        <div className="room-card" style={{ padding: '1.5rem', borderLeft: '4px solid #F59E0B' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Currently Away</p>
                    <h2 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>{statusList.filter(s => s.current_status === 'AWAY').length}</h2>
                </div>
                <div style={{ background: '#FEF3C7', padding: '1rem', borderRadius: '1rem', color: '#F59E0B' }}>
                    <UserX size={28} />
                </div>
            </div>
        </div>
        <div className="room-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Students</p>
                    <h2 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>{statusList.length}</h2>
                </div>
                <div style={{ background: '#E0E7FF', padding: '1rem', borderRadius: '1rem', color: 'var(--primary)' }}>
                    <Activity size={28} />
                </div>
            </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface-hover)', padding: '0.4rem', borderRadius: '0.75rem' }}>
            <button 
                onClick={() => setActiveTab('status')}
                style={{ 
                    padding: '0.6rem 1.25rem', 
                    borderRadius: '0.5rem', 
                    border: 'none', 
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    background: activeTab === 'status' ? 'white' : 'transparent',
                    boxShadow: activeTab === 'status' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    color: activeTab === 'status' ? 'var(--primary)' : 'var(--text-secondary)'
                }}>
                <Radio size={16} /> Live Status
            </button>
            <button 
                onClick={() => setActiveTab('logs')}
                style={{ 
                    padding: '0.6rem 1.25rem', 
                    borderRadius: '0.5rem', 
                    border: 'none', 
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    background: activeTab === 'logs' ? 'white' : 'transparent',
                    boxShadow: activeTab === 'logs' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    color: activeTab === 'logs' ? 'var(--primary)' : 'var(--text-secondary)'
                }}>
                <History size={16} /> Movement Logs
            </button>
        </div>

        <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
                type="text" 
                placeholder="Search by student or RFID..." 
                className="form-control" 
                style={{ paddingLeft: '2.75rem' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* Content */}
      <div className="table-container">
        {activeTab === 'status' ? (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Room</th>
                <th>RFID Tag</th>
                <th>Current Status</th>
                <th>Last Scan</th>
              </tr>
            </thead>
            <tbody>
              {filteredStatus.map(student => (
                <tr key={student.id}>
                  <td style={{ fontWeight: 600 }}>{student.first_name} {student.last_name}</td>
                  <td>{student.room_number || 'N/A'}</td>
                  <td><code style={{ background: '#F3F4F6', padding: '0.2rem 0.5rem', borderRadius: '0.4rem', fontSize: '0.8rem' }}>{student.rfid_tag || '---'}</code></td>
                  <td>
                    <span className={`badge ${student.current_status === 'PRESENT' ? 'paid' : 'pending'}`}>
                        {student.current_status === 'PRESENT' ? 'Inside Hostel' : 'Away / Out'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {student.last_scan ? new Date(student.last_scan).toLocaleString() : 'Never scanned'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Scan Type</th>
                <th>Time</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{log.first_name} {log.last_name}</td>
                  <td>
                    <span className={`badge ${log.check_out ? 'pending' : 'paid'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: 'fit-content' }}>
                        {log.check_out ? <Clock size={12} /> : <UserCheck size={12} />}
                        {log.check_out ? 'CHECK-OUT' : 'CHECK-IN'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {new Date(log.check_out || log.check_in).toLocaleTimeString()}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{log.scan_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
