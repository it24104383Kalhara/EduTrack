const express = require('express');
const cors = require('cors');

const app = express();
const port = 5004;

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple in-memory data store
const rooms = [
  { id: 1, room_number: 'H001', capacity: 5, current_occupancy: 2 },
  { id: 2, room_number: 'H002', capacity: 5, current_occupancy: 0 },
  { id: 3, room_number: 'H003', capacity: 5, current_occupancy: 3 },
  { id: 4, room_number: 'H004', capacity: 5, current_occupancy: 1 },
  { id: 5, room_number: 'H005', capacity: 5, current_occupancy: 0 }
];

const students = [
  { id: 1, registration_number: 'REG2024001', student_name: 'John Smith', grade: 'Grade 10', assigned_room: 1, room_number: 'H001' },
  { id: 2, registration_number: 'REG2024002', student_name: 'Emily Johnson', grade: 'Grade 11', assigned_room: 1, room_number: 'H001' },
  { id: 3, registration_number: 'REG2024003', student_name: 'Michael Brown', grade: 'Grade 9', assigned_room: 3, room_number: 'H003' },
  { id: 4, registration_number: 'REG2024004', student_name: 'Sarah Davis', grade: 'Grade 12', assigned_room: 4, room_number: 'H004' },
  { id: 5, registration_number: 'REG2024005', student_name: 'David Wilson', grade: 'Grade 8', assigned_room: null, room_number: null }
];

const payments = [
  { id: 1, student_id: 1, amount: 2000, status: 'paid', payment_type: 'hostel_fee', student: { student_name: 'John Smith', parent_email: 'robert.smith@email.com' } },
  { id: 2, student_id: 2, amount: 2000, status: 'pending', payment_type: 'hostel_fee', student: { student_name: 'Emily Johnson', parent_email: 'mary.johnson@email.com' } },
  { id: 3, student_id: 3, amount: 5000, status: 'pending', payment_type: 'tuition_fee', student: { student_name: 'Michael Brown', parent_email: 'james.brown@email.com' } },
  { id: 4, student_id: 4, amount: 1500, status: 'pending', payment_type: 'mess_fee', student: { student_name: 'Sarah Davis', parent_email: 'sarah.parent@email.com' } },
  { id: 5, student_id: 5, amount: 500, status: 'pending', payment_type: 'library_fee', student: { student_name: 'David Wilson', parent_email: 'david.parent@email.com' } }
];

// Simple API endpoints - no complex logic
app.get('/api/rooms', (req, res) => {
  res.json({ success: true, data: rooms, message: 'Rooms retrieved successfully' });
});

app.get('/api/students', (req, res) => {
  res.json({ success: true, data: students, message: 'Students retrieved successfully' });
});

app.get('/api/payments', (req, res) => {
  res.json({ success: true, data: payments, message: 'Payments retrieved successfully' });
});

app.get('/api/payments/pending', (req, res) => {
  const pending = payments.filter(p => p.status === 'pending');
  res.json({ success: true, data: pending, message: 'Pending payments retrieved successfully' });
});

app.get('/api/payments/overdue', (req, res) => {
  const overdue = payments.filter(p => p.status === 'pending').slice(0, 1);
  res.json({ success: true, data: overdue, message: 'Overdue payments retrieved successfully' });
});

app.get('/api/payments/due-in-week', (req, res) => {
  const dueThisWeek = payments.filter(p => p.status === 'pending');
  res.json({ success: true, data: dueThisWeek, message: 'Payments due in week retrieved successfully' });
});

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working!', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), service: 'EduTrack Hostel Management' });
});

app.get('/', (req, res) => {
  res.send('EduTrack Hostel Management Backend is running!');
});

// Add static file serving for the simple dashboard
app.get('/simple-dashboard', (req, res) => {
  try {
    const path = require('path');
    const fs = require('fs');
    const htmlPath = path.join(__dirname, '..', 'simple-dashboard.html');
    
    if (fs.existsSync(htmlPath)) {
      res.sendFile(htmlPath);
    } else {
      res.status(404).send('Dashboard not found');
    }
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log('API endpoints:');
  console.log('- GET /api/rooms');
  console.log('- GET /api/students');
  console.log('- GET /api/payments');
  console.log('- GET /api/payments/pending');
  console.log('- GET /api/payments/overdue');
  console.log('- GET /api/payments/due-in-week');
  console.log('- GET /api/test');
});

// Keep process alive
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
