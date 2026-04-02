import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, ArcElement, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import {
  Users, BookOpen, GraduationCap, Activity, Calendar, Clock, TrendingUp
} from 'lucide-react';
import { isSchoolLeaveDay, getMonthlyLeaveCount } from '../utils/DateUtils';
import type { RecentActivity } from '../services/api';
import { useAuth } from '../context/AuthContext';

ChartJS.register(
  CategoryScale, LinearScale, ArcElement, PointElement, LineElement, BarElement,
  Title, Tooltip, Legend, Filler
);

interface DashboardProps {
  gradeCount: number;
  studentCount: number;
  subjectCount: number;
  genderData: { male: number; female: number };
  performanceData: { grade_name: string; average_percentage: number }[];
  attendanceTrends: { day: string; attendance_percentage: number; date: string; grade_name?: string; grade_id?: number }[];
  recentActivity: RecentActivity[];
  loading: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({
  gradeCount, studentCount, subjectCount, genderData, performanceData, attendanceTrends, recentActivity, loading
}) => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDate(new Date());
  const [selectedMonthDate, setSelectedMonthDate] = useState(todayStr);
  const [processedAttendanceData, setProcessedAttendanceData] = useState<any>({});

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Generate school days window (last 7 weekdays)
  const weekLabels: string[] = [];
  const weekDates: string[] = [];
  let checkDate = new Date();
  while (weekDates.length < 7) {
    const day = checkDate.getDay();
    if (day !== 0 && day !== 6) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = dayNames[day];
      const dateLabel = `${checkDate.getDate()}/${checkDate.getMonth() + 1}`;
      weekLabels.unshift(`${dayName} ${dateLabel}`);
      weekDates.unshift(formatDate(new Date(checkDate)));
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }

  useEffect(() => {
    if (!Array.isArray(attendanceTrends)) return;

    // Group trends by grade
    const grouped: Record<string, any[]> = {};
    attendanceTrends.forEach(t => {
      const gName = t.grade_name || 'System Overall';
      if (!grouped[gName]) grouped[gName] = [];
      grouped[gName].push(t);
    });

    const finalData: Record<string, any[]> = {};
    Object.keys(grouped).forEach(gName => {
      const trends = grouped[gName];
      finalData[gName] = weekDates.map((dateStr, index) => {
        const label = weekLabels[index];
        const record = trends.find(t => {
          if (!t.date) return false;
          return t.date === dateStr;
        });
        return {
          day: label,
          attendance_percentage: record ? record.attendance_percentage : 0,
          date: dateStr
        };
      });
    });

    setProcessedAttendanceData(finalData);
  }, [attendanceTrends]);

  if (loading) {
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F7FF' }}>
        <Activity style={{ color: '#8B5CF6', animation: 'pulse 1.5s infinite' }} size={24} />
      </div>
    );
  }

  // Find today's overall attendance (averaging across grades if needed)
  const allTodayRecords = Object.values(processedAttendanceData).map((list: any) => list.find((d: any) => d.date === todayStr)).filter(Boolean);
  const todayAttendancePct = allTodayRecords.length > 0 
    ? Math.round(allTodayRecords.reduce((acc: number, cur: any) => acc + cur.attendance_percentage, 0) / allTodayRecords.length)
    : 0;
    
  const isTodayHoliday = isSchoolLeaveDay(todayStr);

  // ─── Chart Data ───────────────────────────────────────────────
  const genderChartData = {
    labels: ['Boys', 'Girls'],
    datasets: [{
      data: [genderData.male || 0, genderData.female || 0],
      backgroundColor: ['#4F90E6', '#E879A0'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const chartColors = ['#633194', '#8B5CF6', '#4F90E6', '#E879A0', '#10b981'];
  const attendanceChartData = {
    labels: weekLabels,
    datasets: Object.keys(processedAttendanceData).map((gName, idx) => ({
      label: gName,
      data: processedAttendanceData[gName].map((d: any) => d.attendance_percentage),
      fill: Object.keys(processedAttendanceData).length === 1,
      backgroundColor: 'rgba(99, 49, 148, 0.08)',
      borderColor: chartColors[idx % chartColors.length],
      borderWidth: 2.5,
      pointBackgroundColor: '#FFFFFF',
      pointBorderColor: chartColors[idx % chartColors.length],
      pointBorderWidth: 2,
      pointRadius: 4,
      tension: 0.4,
    }))
  };

  const performanceChartData = {
    labels: performanceData.map(p => p.grade_name),
    datasets: [{
      label: 'Avg Score %',
      data: performanceData.map(p => p.average_percentage),
      backgroundColor: '#8B5CF6',
      borderRadius: 6,
      barThickness: 18,
    }]
  };

  const commonScaleOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.88)',
        padding: 8,
        titleFont: { size: 11, family: 'Inter' },
        bodyFont: { size: 10, family: 'Inter' },
        cornerRadius: 6,
        displayColors: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: '#F1F0FB', drawTicks: false },
        border: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 }, padding: 4 }
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 }, padding: 4 }
      }
    }
  };

  // ─── Styles ───────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #EDE9FE',
    boxShadow: '0 1px 6px rgba(99,49,148,0.06)',
    padding: '14px 16px',
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: '8px',
    fontWeight: 800,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: '#94a3b8',
    marginBottom: '2px',
  };

  const bigNum: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 900,
    color: '#1e1b4b',
    lineHeight: 1,
  };

  return (
    <div style={{ padding: '12px 20px', background: '#F8F7FF', height: '100vh', overflow: 'hidden', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#1e1b4b', letterSpacing: '-0.3px' }}>
            {user?.role === 'teacher' 
              ? `Welcome, ${user.username}!${user.grade ? ` (${user.grade})` : ''}` 
              : 'System Dashboard'}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={11} />
            {currentTime.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase()}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1px solid #EDE9FE', borderRadius: '8px', padding: '6px 12px', boxShadow: '0 1px 4px rgba(99,49,148,0.06)' }}>
          <Clock size={11} color="#8B5CF6" />
          <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'monospace', color: '#4B2380' }}>
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      {/* ── Holiday Banner ── */}
      {isTodayHoliday && (
        <div style={{ background: 'linear-gradient(135deg, #633194, #4B2380)', color: '#fff', borderRadius: '10px', padding: '8px 16px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={16} />
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '13px' }}>School is Closed Today</p>
              <p style={{ margin: 0, fontSize: '10px', opacity: 0.85 }}>Today is an official school leave day.</p>
            </div>
          </div>
          <span style={{ background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em' }}>School Holiday</span>
        </div>
      )}

      {/* ── Stat Cards Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
        {[
          { label: 'Enrolled Students', value: studentCount, icon: Users, iconColor: '#4F90E6', iconBg: '#EFF6FF' },
          { label: 'Active Grades', value: gradeCount, icon: GraduationCap, iconColor: '#9333ea', iconBg: '#F3E8FF' },
          { label: 'Total Subjects', value: subjectCount, icon: BookOpen, iconColor: '#ec4899', iconBg: '#FDF2F8' },
          {
            label: isTodayHoliday ? "Today's Status" : "Today's Attendance",
            value: isTodayHoliday ? 'Closed' : `${todayAttendancePct}%`,
            icon: isTodayHoliday ? Calendar : Activity,
            iconColor: isTodayHoliday ? '#6366f1' : '#10b981',
            iconBg: isTodayHoliday ? '#EEF2FF' : '#ECFDF5'
          },
        ].map((stat, i) => (
          <div key={i} style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px' }}>
            <div>
              <p style={sectionLabel}>{stat.label}</p>
              <h3 style={bigNum}>{stat.value}</h3>
            </div>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: stat.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <stat.icon size={12} color={stat.iconColor} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Content ── */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

        {/* Left 2/3 column */}
        <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Top row: Gender + Performance */}
          <div style={{ display: 'flex', gap: '12px' }}>

            {/* Gender Breakdown */}
            <div style={{ ...card, width: '36%', flexShrink: 0, minHeight: '210px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '10px', fontWeight: 800, color: '#4B2380', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Gender Breakdown</h3>
              <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '150px', height: '150px', position: 'relative' }}>
                  <Doughnut
                    data={genderChartData}
                    options={{ ...commonScaleOptions, cutout: '72%', scales: undefined } as any}
                  />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <span style={{ fontSize: '20px', fontWeight: 900, color: '#1e1b4b' }}>{studentCount}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '8px', borderTop: '1px solid #F1F0FB', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4F90E6' }} />
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Boys: {genderData.male}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E879A0' }} />
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Girls: {genderData.female}</span>
                </div>
              </div>
            </div>

            {/* Avg Score by Grade */}
            <div style={{ ...card, flex: 1, minHeight: '210px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '10px', fontWeight: 800, color: '#4B2380', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Avg. Score by Grade</h3>
                <TrendingUp size={12} color="#8B5CF6" />
              </div>
              <div style={{ flex: 1 }}>
                <Bar data={performanceChartData} options={commonScaleOptions as any} />
              </div>
            </div>
          </div>

          {/* Weekly Attendance Trends */}
          <div style={{ ...card, minHeight: '190px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '10px', fontWeight: 800, color: '#4B2380', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Weekly Attendance Trends</h3>
            <div style={{ flex: 1 }}>
              <Line data={attendanceChartData} options={commonScaleOptions as any} />
            </div>
          </div>
        </div>

        {/* Right panel – Leave Summary + Activity */}
        <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Leave Summary Card */}
          <div style={{ ...card, padding: '12px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} color="#8B5CF6" />
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#4B2380', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Leave Summary</span>
              </div>
              <input
                type="date"
                value={selectedMonthDate}
                onChange={e => setSelectedMonthDate(e.target.value)}
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#633194',
                  background: '#F3E8FF',
                  border: '1px solid #DDD6FE',
                  borderRadius: '6px',
                  padding: '3px 7px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* Month Badge */}
            <div style={{
              background: 'linear-gradient(135deg, #633194 0%, #4B2380 100%)',
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
              boxShadow: '0 4px 16px rgba(99,49,148,0.25)',
            }}>
              <span style={{ fontSize: '13px', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {new Date(selectedMonthDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.18)', borderRadius: '8px', padding: '6px 12px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#fff' }}>
                  {getMonthlyLeaveCount(new Date(selectedMonthDate + 'T12:00:00').getFullYear(), new Date(selectedMonthDate + 'T12:00:00').getMonth())}
                </span>
                <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.3 }}>Total<br />Leaves</span>
              </div>
            </div>

            {/* Recent System Updates */}
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Recent System Updates</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                {recentActivity.length === 0 ? (
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>No recent activity.</p>
                ) : recentActivity.map((activity, idx) => (
                  <div key={idx} style={{
                    background: '#FAFAF9',
                    border: '1px solid #F1F0FB',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-start',
                    transition: 'border-color 0.2s',
                  }}>
                    <div style={{ background: '#F3E8FF', borderRadius: '6px', padding: '4px', flexShrink: 0 }}>
                      <Activity size={9} color="#8B5CF6" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '10px', fontWeight: 600, color: '#4B2380', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.description}</p>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', fontFamily: 'monospace' }}>{activity.time}</span>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{activity.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
