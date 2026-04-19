const express = require('express');
const cors = require('cors');

const app = express();
const port = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Sample data
const sampleData = {
  rooms: [
    { id: 1, room_number: 'H001', capacity: 5, current_occupancy: 2 },
    { id: 2, room_number: 'H002', capacity: 5, current_occupancy: 0 },
    { id: 3, room_number: 'H003', capacity: 5, current_occupancy: 3 }
  ],
  students: [
    { id: 1, registration_number: 'REG2024001', student_name: 'John Smith', grade: 'Grade 10', assigned_room: 1 },
    { id: 2, registration_number: 'REG2024002', student_name: 'Emily Johnson', grade: 'Grade 11', assigned_room: 1 },
    { id: 3, registration_number: 'REG2024003', student_name: 'Michael Brown', grade: 'Grade 9', assigned_room: 3 }
  ],
  payments: [
    { id: 1, student_id: 1, amount: 2000, status: 'paid', payment_type: 'hostel_fee', student: { student_name: 'John Smith', parent_email: 'robert.smith@email.com' } },
    { id: 2, student_id: 2, amount: 2000, status: 'pending', payment_type: 'hostel_fee', student: { student_name: 'Emily Johnson', parent_email: 'mary.johnson@email.com' } },
    { id: 3, student_id: 3, amount: 5000, status: 'pending', payment_type: 'tuition_fee', student: { student_name: 'Michael Brown', parent_email: 'james.brown@email.com' } }
  ]
};

// API Routes
app.get('/api/rooms', (req, res) => {
  res.json({
    success: true,
    data: sampleData.rooms,
    message: 'Rooms retrieved successfully'
  });
});

app.get('/api/students', (req, res) => {
  res.json({
    success: true,
    data: sampleData.students,
    message: 'Students retrieved successfully'
  });
});

app.get('/api/payments', (req, res) => {
  res.json({
    success: true,
    data: sampleData.payments,
    message: 'Payments retrieved successfully'
  });
});

// Additional payment endpoints
app.get('/api/payments/pending', (req, res) => {
  const pendingPayments = sampleData.payments.filter(p => p.status === 'pending');
  res.json({
    success: true,
    data: pendingPayments,
    message: 'Pending payments retrieved successfully'
  });
});

app.get('/api/payments/overdue', (req, res) => {
  // For demo, no overdue payments
  res.json({
    success: true,
    data: [],
    message: 'Overdue payments retrieved successfully'
  });
});

app.get('/api/payments/due-in-week', (req, res) => {
  // For demo, show pending payments as due in week
  const pendingPayments = sampleData.payments.filter(p => p.status === 'pending');
  res.json({
    success: true,
    data: pendingPayments,
    message: 'Payments due in week retrieved successfully'
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'EduTrack Hostel Management'
  });
});

app.get('/', (req, res) => {
  res.send('EduTrack Hostel Management Backend is running!');
});

app.listen(port, () => {
  console.log(`EduTrack Hostel Management Server is running on port ${port}`);
  console.log('Test endpoints:');
  console.log('- http://localhost:5000/api/test');
  console.log('- http://localhost:5000/api/rooms');
  console.log('- http://localhost:5000/api/students');
  console.log('- http://localhost:5000/api/payments');
});
