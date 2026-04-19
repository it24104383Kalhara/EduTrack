const express = require('express');
const cors = require('cors');

const app = express();
const port = 5003;

// Middleware
app.use(cors());
app.use(express.json());

// Add cache control headers
app.use((req, res, next) => {
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  next();
});

// Sample data
const sampleData = {
  rooms: [
    { id: 1, room_number: 'H001', capacity: 5, current_occupancy: 2 },
    { id: 2, room_number: 'H002', capacity: 5, current_occupancy: 0 },
    { id: 3, room_number: 'H003', capacity: 5, current_occupancy: 3 },
    { id: 4, room_number: 'H004', capacity: 5, current_occupancy: 1 },
    { id: 5, room_number: 'H005', capacity: 5, current_occupancy: 0 }
  ],
  students: [
    { id: 1, registration_number: 'REG2024001', student_name: 'John Smith', grade: 'Grade 10', assigned_room: 1, room_number: 'H001' },
    { id: 2, registration_number: 'REG2024002', student_name: 'Emily Johnson', grade: 'Grade 11', assigned_room: 1, room_number: 'H001' },
    { id: 3, registration_number: 'REG2024003', student_name: 'Michael Brown', grade: 'Grade 9', assigned_room: 3, room_number: 'H003' },
    { id: 4, registration_number: 'REG2024004', student_name: 'Sarah Davis', grade: 'Grade 12', assigned_room: 4, room_number: 'H004' },
    { id: 5, registration_number: 'REG2024005', student_name: 'David Wilson', grade: 'Grade 8', assigned_room: null, room_number: null }
  ],
  payments: [
    { id: 1, student_id: 1, amount: 2000, status: 'paid', payment_type: 'hostel_fee', student: { student_name: 'John Smith', parent_email: 'robert.smith@email.com' } },
    { id: 2, student_id: 2, amount: 2000, status: 'pending', payment_type: 'hostel_fee', student: { student_name: 'Emily Johnson', parent_email: 'mary.johnson@email.com' } },
    { id: 3, student_id: 3, amount: 5000, status: 'pending', payment_type: 'tuition_fee', student: { student_name: 'Michael Brown', parent_email: 'james.brown@email.com' } },
    { id: 4, student_id: 4, amount: 1500, status: 'pending', payment_type: 'mess_fee', student: { student_name: 'Sarah Davis', parent_email: 'sarah.parent@email.com' } },
    { id: 5, student_id: 5, amount: 500, status: 'pending', payment_type: 'library_fee', student: { student_name: 'David Wilson', parent_email: 'david.parent@email.com' } }
  ]
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// API Routes with error handling
app.get('/api/rooms', (req, res) => {
  try {
    res.json({
      success: true,
      data: sampleData.rooms,
      message: 'Rooms retrieved successfully'
    });
  } catch (error) {
    console.error('Rooms API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve rooms'
    });
  }
});

app.get('/api/students', (req, res) => {
  try {
    res.json({
      success: true,
      data: sampleData.students,
      message: 'Students retrieved successfully'
    });
  } catch (error) {
    console.error('Students API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve students'
    });
  }
});

app.get('/api/payments', (req, res) => {
  try {
    res.json({
      success: true,
      data: sampleData.payments,
      message: 'Payments retrieved successfully'
    });
  } catch (error) {
    console.error('Payments API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payments'
    });
  }
});

// Additional payment endpoints
app.get('/api/payments/pending', (req, res) => {
  try {
    const pendingPayments = sampleData.payments.filter(p => p.status === 'pending');
    res.json({
      success: true,
      data: pendingPayments,
      message: 'Pending payments retrieved successfully'
    });
  } catch (error) {
    console.error('Pending payments API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pending payments'
    });
  }
});

app.get('/api/payments/overdue', (req, res) => {
  try {
    // For demo, show one overdue payment
    const overduePayments = sampleData.payments.filter(p => p.status === 'pending').slice(0, 1);
    res.json({
      success: true,
      data: overduePayments,
      message: 'Overdue payments retrieved successfully'
    });
  } catch (error) {
    console.error('Overdue payments API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve overdue payments'
    });
  }
});

app.get('/api/payments/due-in-week', (req, res) => {
  try {
    // For demo, show pending payments as due in week
    const pendingPayments = sampleData.payments.filter(p => p.status === 'pending');
    res.json({
      success: true,
      data: pendingPayments,
      message: 'Payments due in week retrieved successfully'
    });
  } catch (error) {
    console.error('Due in week payments API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payments due in week'
    });
  }
});

app.get('/api/test', (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'API is working!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test API error:', error);
    res.status(500).json({
      success: false,
      message: 'Test endpoint failed'
    });
  }
});

app.get('/health', (req, res) => {
  try {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      service: 'EduTrack Hostel Management'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed'
    });
  }
});

app.get('/', (req, res) => {
  try {
    res.send('EduTrack Hostel Management Backend is running!');
  } catch (error) {
    console.error('Root endpoint error:', error);
    res.status(500).send('Server error');
  }
});

// Start server with error handling
const server = app.listen(port, () => {
  console.log(`EduTrack Hostel Management Server is running on port ${port}`);
  console.log('Available endpoints:');
  console.log('- http://localhost:5003/api/test');
  console.log('- http://localhost:5003/api/rooms');
  console.log('- http://localhost:5003/api/students');
  console.log('- http://localhost:5003/api/payments');
  console.log('- http://localhost:5003/api/payments/pending');
  console.log('- http://localhost:5003/api/payments/overdue');
  console.log('- http://localhost:5003/api/payments/due-in-week');
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use`);
  } else {
    console.error('Server error:', error);
  }
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
