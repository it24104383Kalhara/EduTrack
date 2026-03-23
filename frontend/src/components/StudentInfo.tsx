import { useState } from "react";
import emailjs from "@emailjs/browser";
import "./StudentInfo.css";

emailjs.init("rYGO2WGoNycyRkdCN");

interface StudentInfoProps {
  onLogout: () => void;
  onBack: () => void;
}

function StudentInfo({ onLogout, onBack }: StudentInfoProps) {
  const [student, setStudent] = useState({
    name: "",
    age: "",
    date: "",
    symptoms: "",
    parentEmail: "",
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
      setStudent({ name: "", age: "", date: "", symptoms: "", parentEmail: "" });
    } catch {
      alert("Connection error");
    }
  };

  const handleSendEmail = () => {
    if (!student.parentEmail || !student.name) {
      alert("Please enter student name and parent email");
      return;
    }
    emailjs
      .send("service_8f43bgp", "template_aegm6lm", {
        to_email: student.parentEmail,
        student_name: student.name,
        symptoms: student.symptoms,
      })
      .then(() => alert(`Email sent successfully to ${student.parentEmail}!`))
      .catch((err) => { console.error(err); alert("Failed to send email"); });
  };

  return (
    <div className="student-page">
      <button className="back-btn" onClick={onBack}>← Back to Dashboard</button>
      <button className="logout-btn" onClick={onLogout}>Logout</button>

      <div className="student-page-header">
        <div className="student-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
          </svg>
          Health Records
        </div>
        <h1>Add <span>Student Details</span></h1>
        <p className="student-subtitle">Register new student health information into the system.</p>
      </div>

      <form className="student-form-card" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Student Name</label>
          <input type="text" placeholder="Enter full name" value={student.name}
            onChange={(e) => setStudent({ ...student, name: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Age</label>
          <input type="number" placeholder="Enter age" value={student.age}
            onChange={(e) => setStudent({ ...student, age: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={student.date}
            onChange={(e) => setStudent({ ...student, date: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Symptoms</label>
          <textarea placeholder="Describe symptoms..." value={student.symptoms}
            onChange={(e) => setStudent({ ...student, symptoms: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Parent Email</label>
          <input type="email" placeholder="parent@example.com" value={student.parentEmail}
            onChange={(e) => setStudent({ ...student, parentEmail: e.target.value })} required />
        </div>
        <button type="submit" className="submit-btn">Add Student</button>
        <button type="button" onClick={handleSendEmail} className="email-btn">
          Send Email to Parent
        </button>
      </form>
    </div>
  );
}

export default StudentInfo;
