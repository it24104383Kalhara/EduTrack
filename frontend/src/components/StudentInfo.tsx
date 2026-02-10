import { useState } from "react";
import emailjs from "@emailjs/browser";
import "./StudentInfo.css";

// Initialize EmailJS
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
      setStudent({
        name: "",
        age: "",
        date: "",
        symptoms: "",
        parentEmail: "",
      });
    } catch (error) {
      alert("Connection error");
    }
  };

  const handleSendEmail = () => {
    if (!student.parentEmail || !student.name) {
      alert("Please enter student name and parent email");
      return;
    }

    const templateParams = {
      to_email: student.parentEmail,
      student_name: student.name,
      symptoms: student.symptoms,
    };

    emailjs
      .send("service_8f43bgp", "template_aegm6lm", templateParams)
      .then(() => {
        alert(`Email sent successfully to ${student.parentEmail}!`);
      })
      .catch((error) => {
        console.error(error);
        alert("Failed to send email");
      });
  };

  return (
    <div className="student-page">
      <button className="back-btn" onClick={onBack}>
        ← Back to Dashboard
      </button>
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
        <input
          type="email"
          placeholder="Parent Email"
          value={student.parentEmail}
          onChange={(e) =>
            setStudent({ ...student, parentEmail: e.target.value })
          }
          required
        />
        <button type="submit">Add Student</button>
        <button type="button" onClick={handleSendEmail} className="email-btn">
          Send Email to Parent
        </button>
      </form>
    </div>
  );
}

export default StudentInfo;
