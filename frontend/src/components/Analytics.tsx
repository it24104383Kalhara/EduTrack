import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import "../css/Analytics.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface AnalyticsData {
  totalBooks: number;
  totalStudents: number;
  activeBorrowings: number;
  overdueBorrowings: number;
  totalFines: string;
  booksByCategory: { category: string; count: number }[];
  monthlyBorrowings: { month: string; count: number }[];
  mostBorrowedBooks: { title: string; count: number }[];
  studentsWithFines: { name: string; fine_amount: number }[];
}

interface AlertData {
  dueToday: any[];
  dueSoon: any[];
  overdue: any[];
  counts: {
    dueToday: number;
    dueSoon: number;
    overdue: number;
    total: number;
  };
}

export default function Analytics() {
  console.log("Analytics component is rendering!");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alerts, setAlerts] = useState<AlertData | null>(null);
  const [showPopup, setShowPopup] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    fetchAlerts();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/analytics");
      const data = await response.json();
      console.log("Analytics data:", data);
      setAnalytics(data);
    } catch (err) {
      setError("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/alerts");
      const data = await response.json();
      setAlerts(data);
    } catch (err) {
      console.error("Error fetching alerts:", err);
    }
  };

  // Popup Component
  const PopupAlert = () => {
    if (!showPopup || !alerts || alerts.counts.total === 0) return null;
    
    return (
      <div className="popup-overlay">
        <div className="popup-content">
          <button className="popup-close" onClick={() => setShowPopup(false)}>×</button>
          <div className="popup-icon">Alert</div>
          <h3>Library Alerts</h3>
          <div className="popup-stats">
            {alerts.counts.dueToday > 0 && (
              <div>{alerts.counts.dueToday} book(s) due TODAY!</div>
            )}
            {alerts.counts.dueSoon > 0 && (
              <div>{alerts.counts.dueSoon} book(s) due in 3 days</div>
            )}
            {alerts.counts.overdue > 0 && (
              <div>{alerts.counts.overdue} book(s) OVERDUE!</div>
            )}
          </div>
          <button className="popup-btn" onClick={() => setShowPopup(false)}>
            Got it
          </button>
        </div>
      </div>
    );
  };

  // Alert Card Component
  const AlertCard = () => {
    if (!alerts || alerts.counts.total === 0) {
      return (
        <div className="alert-card success">
          <div className="alert-icon">Success</div>
          <div className="alert-content">
            <h3>All Good!</h3>
            <p>No books are due or overdue. Everyone is on time!</p>
          </div>
        </div>
      );
    }

    return (
      <div className="alert-card warning">
        <div className="alert-icon">Warning</div>
        <div className="alert-content">
          <h3>Attention Required!</h3>
          <div className="alert-stats">
            {alerts.counts.dueToday > 0 && (
              <div className="alert-stat due-today">
                <span className="stat-number">{alerts.counts.dueToday}</span>
                <span className="stat-label">Due Today</span>
              </div>
            )}
            {alerts.counts.dueSoon > 0 && (
              <div className="alert-stat due-soon">
                <span className="stat-number">{alerts.counts.dueSoon}</span>
                <span className="stat-label">Due in 3 Days</span>
              </div>
            )}
            {alerts.counts.overdue > 0 && (
              <div className="alert-stat overdue">
                <span className="stat-number">{alerts.counts.overdue}</span>
                <span className="stat-label">Overdue</span>
              </div>
            )}
          </div>
          
          {alerts.dueToday.length > 0 && (
            <div className="alert-list">
              <strong>Due Today:</strong>
              <ul>
                {alerts.dueToday.map((item: any) => (
                  <li key={item.borrowing_id}>{item.book_title} - {item.student_name}</li>
                ))}
              </ul>
            </div>
          )}
          
          {alerts.dueSoon.length > 0 && (
            <div className="alert-list">
              <strong>Due in 3 Days:</strong>
              <ul>
                {alerts.dueSoon.map((item: any) => (
                  <li key={item.borrowing_id}>{item.book_title} - {item.student_name} ({item.days_left} days left)</li>
                ))}
              </ul>
            </div>
          )}
          
          {alerts.overdue.length > 0 && (
            <div className="alert-list">
              <strong>Overdue:</strong>
              <ul>
                {alerts.overdue.map((item: any) => (
                  <li key={item.borrowing_id}>{item.book_title} - {item.student_name} ({item.days_overdue} days overdue)</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) return <div className="analytics-loading">Loading analytics...</div>;
  if (error) return <div className="analytics-error">{error}</div>;
  if (!analytics) return null;

  // Prepare chart data
  const categoryData = {
    labels: analytics.booksByCategory.map(c => c.category),
    datasets: [{
      data: analytics.booksByCategory.map(c => c.count),
      backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
    }]
  };

  const monthlyData = {
    labels: analytics.monthlyBorrowings.length > 0 ? analytics.monthlyBorrowings.map(m => m.month) : ['No Data'],
    datasets: [{
      label: 'Borrowings',
      data: analytics.monthlyBorrowings.length > 0 ? analytics.monthlyBorrowings.map(m => m.count) : [0],
      borderColor: '#4ECDC4',
      backgroundColor: 'rgba(78, 205, 196, 0.1)',
      fill: true,
    }]
  };

  const topBooksData = {
    labels: analytics.mostBorrowedBooks.length > 0 
      ? analytics.mostBorrowedBooks.map(b => b.title.length > 20 ? b.title.substring(0, 20) + '...' : b.title)
      : ['No Data'],
    datasets: [{
      label: 'Times Borrowed',
      data: analytics.mostBorrowedBooks.length > 0 ? analytics.mostBorrowedBooks.map(b => b.count) : [0],
      backgroundColor: '#FF6B6B',
    }]
  };

  return (
    <div className="analytics-container">
      <PopupAlert />
      
      <h2>Library Analytics Dashboard</h2>
      <p className="subtitle">Real-time insights and statistics</p>

      {/* Alert Card */}
      <AlertCard />

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">Books</div>
          <div className="kpi-value">{analytics.totalBooks}</div>
          <div className="kpi-label">Total Books</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">Students</div>
          <div className="kpi-value">{analytics.totalStudents}</div>
          <div className="kpi-label">Total Students</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">Active</div>
          <div className="kpi-value">{analytics.activeBorrowings}</div>
          <div className="kpi-label">Active Borrowings</div>
        </div>
        <div className="kpi-card warning">
          <div className="kpi-icon">Warning</div>
          <div className="kpi-value">{analytics.overdueBorrowings}</div>
          <div className="kpi-label">Overdue Books</div>
        </div>
        <div className="kpi-card danger">
          <div className="kpi-icon">Fines</div>
          <div className="kpi-value">Rs. {parseFloat(analytics.totalFines).toFixed(2)}</div>
          <div className="kpi-label">Total Unpaid Fines</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Books by Category</h3>
          <div className="chart-container">
            {analytics.booksByCategory.length > 0 ? (
              <Pie data={categoryData} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <p className="no-data">No category data available</p>
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Borrowing Trend</h3>
          <div className="chart-container">
            {analytics.monthlyBorrowings.length > 0 ? (
              <Line data={monthlyData} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <p className="no-data">No borrowing data yet</p>
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Most Borrowed Books</h3>
          <div className="chart-container">
            {analytics.mostBorrowedBooks.length > 0 ? (
              <Bar 
                data={topBooksData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                }} 
              />
            ) : (
              <p className="no-data">No borrowings yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Students with Fines */}
      {analytics.studentsWithFines.length > 0 && (
        <div className="fines-section">
          <h3>Students with Unpaid Fines</h3>
          <table className="fines-table">
            <thead>
              <tr><th>Student Name</th><th>Fine Amount</th></tr>
            </thead>
            <tbody>
              {analytics.studentsWithFines.map((s, i) => (
                <tr key={i}>
                  <td>{s.name}</td>
                  <td className="fine-amount">Rs. {s.fine_amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Section */}
      <div className="summary-section">
        <h3>Quick Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Total Books:</span>
            <span className="summary-value">{analytics.totalBooks}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Students:</span>
            <span className="summary-value">{analytics.totalStudents}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Active Borrowings:</span>
            <span className="summary-value">{analytics.activeBorrowings}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Books per Student:</span>
            <span className="summary-value">{analytics.totalStudents > 0 ? (analytics.totalBooks / analytics.totalStudents).toFixed(1) : 0}</span>
          </div>
        </div>
      </div>

      <button onClick={fetchAnalytics} className="refresh-btn">
        Refresh Data
      </button>
    </div>
  );
}