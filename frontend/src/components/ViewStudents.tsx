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

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = () => {
    fetch("http://localhost:5000/api/students")
      .then((res) => res.json())
      .then((data) => {
        setStudents(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/students/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        alert(data.message);
        fetchStudents(); // Refresh the list
      }
    } catch (error) {
      alert("Failed to delete student");
    }
  };

  return (
    <div className="view-students-page">
      <button className="back-btn" onClick={onBack}>
        ← Back
      </button>
      <button className="logout-btn" onClick={onLogout}>
        Logout
      </button>
      <h1>Student Records</h1>

      {loading && <p className="loading">Loading...</p>}

      {!loading && students.length === 0 && (
        <p className="no-data">No students found</p>
      )}

      {!loading && students.length > 0 && (
        <div className="students-grid">
          {students.map((student) => (
            <div key={student.id} className="student-card">
              <button
                className="delete-btn"
                onClick={() => handleDelete(student.id, student.name)}
              >
                ✕
              </button>
              <h2>{student.name}</h2>
              <p>
                <strong>Age:</strong> {student.age}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(student.date).toLocaleDateString()}
              </p>
              <p>
                <strong>Symptoms:</strong> {student.symptoms}
              </p>
              <p>
                <strong>Email:</strong> {student.parent_email}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ViewStudents;
