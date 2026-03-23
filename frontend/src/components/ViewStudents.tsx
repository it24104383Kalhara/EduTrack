import { useState, useEffect } from "react";
import "./ViewStudents.css";

interface Student {
  id: number;
  name: string;
  age: number;
  date: string;
  symptoms: string;
  parent_email: string;
}

interface ViewStudentsProps {
  onLogout: () => void;
  onBack: () => void;
}

function ViewStudents({ onLogout, onBack }: ViewStudentsProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = () => {
    fetch("http://localhost:5000/api/students")
      .then((res) => res.json())
      .then((data) => { setStudents(data); setLoading(false); })
      .catch((err) => { console.error(err); setLoading(false); });
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const response = await fetch(`http://localhost:5000/api/students/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) { alert(data.message); fetchStudents(); }
    } catch {
      alert("Failed to delete student");
    }
  };

  return (
    <div className="view-students-page">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <button className="logout-btn" onClick={onLogout}>Logout</button>

      <div className="view-students-header">
        <div className="view-students-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          Directory
        </div>
        <h1>Student <span>Records</span></h1>
        <p className="view-students-subtitle">Browse and manage all registered student health records.</p>
      </div>

      {loading && <p className="loading">Loading records...</p>}
      {!loading && students.length === 0 && <p className="no-data">No students found.</p>}

      {!loading && students.length > 0 && (
        <div className="students-grid">
          {students.map((student) => (
            <div key={student.id} className="student-card">
              <button className="delete-btn" onClick={() => handleDelete(student.id, student.name)}>✕</button>
              <div className="student-avatar">{student.name.charAt(0).toUpperCase()}</div>
              <h2>{student.name}</h2>
              <p><strong>AGE</strong> {student.age}</p>
              <p><strong>DATE</strong> {new Date(student.date).toLocaleDateString()}</p>
              <p><strong>SYMPTOMS</strong> {student.symptoms}</p>
              <p><strong>EMAIL</strong> {student.parent_email}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ViewStudents;
