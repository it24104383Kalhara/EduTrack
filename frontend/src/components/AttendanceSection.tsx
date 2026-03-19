import { useEffect, useState } from "react";
//import "./AttendanceSection.css";

interface LibraryEntryLog {
  log_id: number;
  student_id: number;
  name: string;      // added student name
  entry_time: string;
  exit_time?: string | null;
}

export default function AttendanceSection() {
  const [logs, setLogs] = useState<LibraryEntryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

useEffect(() => {
  fetch("http://localhost:3000/library_entry_logs")
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch library logs");
      return res.json();
    })
    .then(data => setLogs(data))
    .catch(err => setError(err.message));
}, []);

  return (
    <div className="attendance-section">
      <h2>📝 Attendance / Library Entries</h2>

      {loading ? (
        <p>Loading records...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : logs.length === 0 ? (
        <p>No library entry records found.</p>
      ) : (
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Student ID</th>
              <th>Entry Time</th>
              <th>Exit Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.log_id}>
                <td>{log.log_id}</td>
                <td>{log.student_id}</td>
                <td>{log.entry_time}</td>
                <td>{log.exit_time || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}