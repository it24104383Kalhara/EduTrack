import { useEffect, useState } from "react";
import "../css/AttendanceSection.css";

interface LibraryEntryLog {
  log_id: number;
  student_id: number;
  name: string;
  entry_time: string;
  exit_time?: string | null;
}

export default function AttendanceSection() {
  const [logs, setLogs] = useState<LibraryEntryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLogs = () => {
    fetch("http://localhost:5000/library_entry_logs")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch library logs");
        return res.json();
      })
      .then(data => {
        setLogs(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (time: string | null | undefined) => {
    if (!time) return "—";
    return new Date(time).toLocaleTimeString();
  };

  const formatDate = (time: string) => {
    return new Date(time).toLocaleDateString();
  };

  return (
    <div className="attendance-section">
      <h2>Library Entry Logs</h2>
      <p className="auto-refresh-text">
        Auto-refreshes every 5 seconds
      </p>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading records...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          {error}
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          No library entry records found.
        </div>
      ) : (
        <table className="attendance-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Date</th>
              <th>Entry</th>
              <th>Exit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.log_id}>
                <td>{log.log_id}</td>
                <td>{log.name}</td>
                <td>{formatDate(log.entry_time)}</td>
                <td>{formatTime(log.entry_time)}</td>
                <td>{formatTime(log.exit_time)}</td>
                <td>
                  <span className={`status-badge ${log.exit_time ? "exited" : "inside"}`}>
                    {log.exit_time ? "Exited" : "Inside"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}