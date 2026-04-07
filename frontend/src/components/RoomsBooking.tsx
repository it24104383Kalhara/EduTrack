import React, { useState } from "react";
import "../css/RoomsBooking.css";

const RoomsBooking: React.FC = () => {
  const [className, setClassName] = useState("");
  const [teacher, setTeacher] = useState("");
  const [room, setRoom] = useState("");
  const [studentsCount, setStudentsCount] = useState("");
  const [studentNames, setStudentNames] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [purpose, setPurpose] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const booking = {
      className,
      teacher,
      room,
      studentsCount,
      studentNames,
      date,
      time,
      purpose,
    };

    console.log("Booking:", booking);
    alert("Room booking submitted!");

    // reset form
    setClassName("");
    setTeacher("");
    setRoom("");
    setStudentsCount("");
    setStudentNames("");
    setDate("");
    setTime("");
    setPurpose("");
  };

  return (
    <div className="rooms-page">
      <h2>Library Room Booking</h2>

      <form className="booking-form" onSubmit={handleSubmit}>

        <label>Class</label>
        <input
          type="text"
          placeholder="e.g. Grade 10A"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          required
        />

        <label>Teacher's Name</label>
        <input
          type="text"
          placeholder="Teacher name"
          value={teacher}
          onChange={(e) => setTeacher(e.target.value)}
          required
        />

        <label>Room</label>
        <select value={room} onChange={(e) => setRoom(e.target.value)} required>
          <option value="">Select room</option>
          <option value="Study Room 1">Study Room 1</option>
          <option value="Study Room 2">Study Room 2</option>
          <option value="Discussion Room">Discussion Room</option>
        </select>

        <label>Number of Students</label>
        <input
          type="number"
          placeholder="Number of students"
          value={studentsCount}
          onChange={(e) => setStudentsCount(e.target.value)}
          required
        />

        <label>Student Names (Optional)</label>
        <textarea
          placeholder="Enter names only if not the whole class"
          value={studentNames}
          onChange={(e) => setStudentNames(e.target.value)}
        />

        <label>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <label>Time</label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
        />

        <label>Purpose / Message</label>
        <textarea
          placeholder="Reason for booking the room"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          required
        />

        <button type="submit">Submit Booking</button>
      </form>
    </div>
  );
};

export default RoomsBooking;