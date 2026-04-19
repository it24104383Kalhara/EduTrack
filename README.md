# EduTrack Hostel Management System

A comprehensive hostel management system for schools that handles room assignments, student management, and automated payment notifications.

## Features

### 🏠 Room Management
- **25 Pre-configured Rooms**: Automatically initialized with capacity for 5 students each
- **Real-time Occupancy Tracking**: Visual indicators showing room availability
- **Room CRUD Operations**: Create, read, update, and delete rooms
- **Capacity Validation**: Prevents over-assignment of students to rooms

### 👥 Student Management
- **Student Registration**: Complete student information with parent details
- **Room Assignment**: Smart assignment system with capacity checking
- **Student Profiles**: Comprehensive student information management
- **Grade Management**: Support for all school grades (Grade 1-13)

### 💳 Payment Management
- **Automated Payment Reminders**: Email notifications 7 days before due date
- **Overdue Payment Warnings**: Automatic warning emails for late payments
- **Multiple Payment Types**: Hostel fee, tuition fee, mess fee, library fee
- **Payment Status Tracking**: Real-time payment status updates
- **Monthly Payment Generation**: Automated creation of monthly payments

### 📧 Email System
- **Scheduled Notifications**: Automatic reminder emails before payment due dates
- **Warning System**: Overdue payment warnings to parents
- **Payment Confirmations**: Automatic email receipts when payments are made
- **Email Logging**: Complete history of all sent emails

### 📊 Dashboard Analytics
- **Real-time Statistics**: Live occupancy rates and payment summaries
- **Visual Indicators**: Color-coded status indicators
- **Quick Actions**: Direct access to common tasks
- **Comprehensive Overview**: All key metrics in one place

## Technology Stack

### Backend
- **Node.js** with **Express.js** server
- **TypeScript** for type safety
- **MySQL** database with connection pooling
- **Nodemailer** for email notifications
- **CORS** enabled for frontend integration

### Frontend
- **React 19** with **TypeScript**
- **Vite** for fast development and building
- **Axios** for API communication
- **CSS Grid/Flexbox** for responsive layouts

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MySQL Server
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd EduTrack/backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your database and email configuration:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=edutrack_hostel

   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   EMAIL_FROM=noreply@edutrack.com

   # Server Configuration
   PORT=5000
   ```

4. **Start the backend server**:
   ```bash
   npm run dev
   ```

   The backend will automatically:
   - Create the database if it doesn't exist
   - Initialize all required tables
   - Create 25 hostel rooms (H001-H025) with 5-student capacity

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd EduTrack/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:5173`

## Key Features Implementation

### Room Assignment System
- Maximum 5 students per room as specified
- Real-time capacity checking before assignment
- Visual occupancy indicators
- Automatic prevention of over-assignment

### Payment Notification System
- Emails sent 7 days before payment due date (January 31st as specified)
- Automatic warning emails for overdue payments
- Bulk email sending capability
- Email logging and tracking

### Payment Management
- Monthly payment creation for all hostel students
- Payment status tracking (pending, paid, overdue)
- Manual payment marking and confirmation emails
- Comprehensive payment history

## Usage Instructions

1. **Start the System**: Run both backend and frontend servers
2. **Register Students**: Add students with parent contact information
3. **Assign to Rooms**: Use the assignment system to place students in rooms
4. **Manage Payments**: Track payments and send automated reminders
5. **Monitor Dashboard**: View real-time statistics and system health

## Database Schema

The system uses four main tables:
- `rooms`: Room information and capacity
- `students`: Student profiles and room assignments  
- `payments`: Payment records and status
- `email_logs`: Email communication history

## Support

For technical support or questions about the system, refer to the API documentation and database schema included in the source code.