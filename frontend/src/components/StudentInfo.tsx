import { useState } from "react";
import "./StudentInfo.css";

interface StudentInfoProps {
  onLogout: () => void;
}

function StudentInfo({ onLogout }: StudentInfoProps) {
  const [student, setStudent] = useState({
    name: "",
    age: "",
    date: "",
    symptoms: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student),
      });
      const data = await response.json();
      alert(data.message);
      setStudent({ name: "", age: "", date: "", symptoms: "" });
    } catch (error) {
      alert("Connection error");
    }
  };

  return (
    <div className="student-page">
      <button className="logout-btn" onClick={onLogout}>
        Logout
      </button>
      <h1>Student Details</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={student.name}
          onChange={(e) => setStudent({ ...student, name: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Age"
          value={student.age}
          onChange={(e) => setStudent({ ...student, age: e.target.value })}
          required
        />
        <input
          type="date"
          value={student.date}
          onChange={(e) => setStudent({ ...student, date: e.target.value })}
          required
        />
        <textarea
          placeholder="Symptoms"
          value={student.symptoms}
          onChange={(e) => setStudent({ ...student, symptoms: e.target.value })}
          required
        />
        <button type="submit">Add Student</button>
      </form>
    </div>
  );
}

export default StudentInfo;
