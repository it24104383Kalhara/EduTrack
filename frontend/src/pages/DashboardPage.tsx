import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Home, CreditCard, PieChart, Activity, ArrowUpRight, TrendingUp, Inbox } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    totalStudents: 0,
    pendingPaymentsCount: 0,
    totalRevenue: 0,
    totalCapacity: 0,
    occupiedBeds: 0
  });
  const [recentEmails, setRecentEmails] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [roomsRes, studentsRes, paymentsRes, emailsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/rooms`),
          axios.get(`${API_BASE_URL}/students`),
          axios.get(`${API_BASE_URL}/payments`),
          axios.get(`${API_BASE_URL}/emails`)
        ]);

        const rooms = roomsRes.data;
        const students = studentsRes.data;
        const payments = paymentsRes.data;
        setRecentEmails((emailsRes.data || []).slice(0, 5));

        const availableRooms = rooms.filter((r: any) => r.occupied < r.capacity).length;
        const pendingPaymentsCount = payments.filter((p: any) => p.status === 'pending').length;
        const totalRevenue = payments.filter((p: any) => p.status === 'paid').reduce((acc: number, curr: any) => acc + curr.amount, 0);
        const totalCapacity = rooms.reduce((acc: number, curr: any) => acc + curr.capacity, 0);
        const occupiedBeds = rooms.reduce((acc: number, curr: any) => acc + curr.occupied, 0);

        setStats({
          totalRooms: rooms.length,
          availableRooms,
          totalStudents: students.length,
          pendingPaymentsCount,
          totalRevenue,
          totalCapacity,
          occupiedBeds
        });
      } catch (error) {
        console.error("Error fetching stats", error);
      }
    };
    
    fetchStats();
  }, []);

  const occupancyRate = stats.totalCapacity > 0 ? Math.round((stats.occupiedBeds / stats.totalCapacity) * 100) : 0;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '2.25rem', marginBottom: '0.25rem' }}>
            Analytics Overview
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <Activity size={14} color="var(--primary)" />
            <span style={{ fontSize: '0.85rem' }}>EduHostel Smart Management Dashboard</span>
          </div>
        </div>
        <div className="glass-morphism" style={{ padding: '0.6rem 1rem', borderRadius: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }}></div>
          <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>System Live</span>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="room-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="room-card" style={{ padding: '1.25rem', height: '170px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(135deg, white, #F5F3FF)', border: 'none', boxShadow: '0 10px 30px -10px rgba(75, 40, 109, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ background: 'rgba(75, 40, 109, 0.1)', padding: '0.6rem', borderRadius: '0.75rem' }}>
              <Users size={18} color="var(--primary)" />
            </div>
            <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', fontSize: '0.8rem', fontWeight: 600 }}>
              <ArrowUpRight size={12} /> +12%
            </span>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>Active Students</p>
            <h2 style={{ fontSize: '1.75rem', margin: '0.1rem 0' }}>{stats.totalStudents}</h2>
            <div className="progress-bar" style={{ height: '3px', background: 'rgba(75, 40, 109, 0.1)', marginTop: '0.5rem' }}>
              <div className="progress-fill" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        <div className="room-card" style={{ padding: '1.25rem', height: '170px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(135deg, white, #ECFDF5)', border: 'none', boxShadow: '0 10px 30px -10px rgba(16, 185, 129, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.6rem', borderRadius: '0.75rem' }}>
              <Home size={18} color="#10B981" />
            </div>
            <span style={{ color: '#10B981', fontWeight: 600, fontSize: '0.8rem' }}>
              {occupancyRate}% Full
            </span>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>Occupancy</p>
            <h2 style={{ fontSize: '1.75rem', margin: '0.1rem 0' }}>{stats.occupiedBeds} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/ {stats.totalCapacity}</span></h2>
            <div className="progress-bar" style={{ height: '3px', background: 'rgba(16, 185, 129, 0.1)', marginTop: '0.5rem' }}>
              <div className="progress-fill" style={{ width: `${occupancyRate}%`, background: '#10B981' }}></div>
            </div>
          </div>
        </div>

        <div className="room-card" style={{ padding: '1.25rem', height: '170px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(135deg, white, #FFFBEB)', border: 'none', boxShadow: '0 10px 30px -10px rgba(245, 158, 11, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.6rem', borderRadius: '0.75rem' }}>
              <CreditCard size={18} color="#F59E0B" />
            </div>
            <div className="badge pending" style={{ fontSize: '0.7rem' }}>Awaiting</div>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>Pending</p>
            <h2 style={{ fontSize: '1.75rem', margin: '0.1rem 0' }}>{stats.pendingPaymentsCount}</h2>
            <p style={{ fontSize: '0.7rem', color: '#F43F5E', fontWeight: 600 }}>Needs Attention</p>
          </div>
        </div>

        <div className="room-card" style={{ padding: '1.25rem', height: '170px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(135deg, #4B286D, #818CF8)', border: 'none', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '0.6rem', borderRadius: '0.75rem' }}>
              <TrendingUp size={18} color="white" />
            </div>
            <PieChart size={16} color="rgba(255, 255, 255, 0.6)" />
          </div>
          <div>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.8rem', fontWeight: 500 }}>Revenue</p>
            <h2 style={{ fontSize: '1.75rem', margin: '0.1rem 0' }}>${stats.totalRevenue.toLocaleString()}</h2>
            <div style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.1)', padding: '0.15rem 0.6rem', borderRadius: '99px', width: 'fit-content', marginTop: '0.5rem' }}>
               +8% MTD
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Recent Communication */}
        <div className="table-container" style={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '1.5rem 2rem', background: 'white', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Recent Communication Logs</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>View All</span>
          </div>
          <div style={{ padding: '1rem' }}>
            {recentEmails.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Inbox size={48} color="#E5E7EB" style={{ marginBottom: '1rem' }} />
                <p>No recent communications found</p>
              </div>
            ) : (
              <table style={{ border: 'none' }}>
                <thead style={{ display: 'none' }}>
                  <tr><th>Activity</th></tr>
                </thead>
                <tbody>
                  {recentEmails.map(email => (
                    <tr key={email.id} style={{ transition: 'all 0.2s' }}>
                      <td style={{ border: 'none', padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ 
                            width: '40px', height: '40px', borderRadius: '12px', 
                            background: email.status === 'sent' ? '#D1FAE5' : '#FEE2E2',
                            display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center'
                          }}>
                            <Activity size={18} color={email.status === 'sent' ? '#10B981' : '#EF4444'} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{email.email_type.replace('_', ' ').toUpperCase()}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>To: {email.parent_email}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(email.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            <div className={`badge ${email.status === 'sent' ? 'paid' : 'full'}`} style={{ fontSize: '0.7rem' }}>{email.status.toUpperCase()}</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="room-card glass-morphism" style={{ border: '1px solid rgba(75, 40, 109, 0.1)', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="var(--primary)" />
              Occupancy Health
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: '140px' }}>
              <div style={{ 
                width: '120px', height: '120px', borderRadius: '50%', 
                border: '10px solid #F3F4F6', borderTopColor: 'var(--primary)',
                transform: `rotate(${occupancyRate * 3.6}deg)`,
                transition: 'transform 1s ease-out'
              }}></div>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{occupancyRate}%</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Capacity</div>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '1rem' }}>
               You have {stats.availableRooms} rooms yet to be fully occupied.
            </p>
          </div>

          <div className="room-card" style={{ background: '#1F2937', color: 'white', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>System Updates</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem', fontSize: '0.85rem' }}>
                 <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>2 hours ago</div>
                 Emails sent successfully to 5 parents.
              </div>
              <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem', fontSize: '0.85rem' }}>
                 <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Yesterday</div>
                 3 students moved into Room-12.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
