import React, { useState, useEffect } from 'react';
import { studentApi } from '../services/api';
import { Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  religion: string;
  ethnicity: string;
  address: string;
  nationality: string;
  parent_type: 'father' | 'mother' | 'guardian';
  parent_name: string;
  parent_phone: string;
  parent_address: string;
  parent_gender: 'male' | 'female' | 'other';
  parent_email?: string;
  parent_religion: string;
  parent_ethnicity: string;
  parent_nationality: string;
  created_at?: string;
}

interface StudentListProps {
}

const StudentList: React.FC<StudentListProps> = () => {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '48px 24px', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '24px',
          padding: '64px 48px', textAlign: 'center', maxWidth: '500px', width: '100%',
          boxShadow: '0 15px 35px -5px rgba(99, 49, 148, 0.1)'
        }}>
          <div style={{ 
            width: '80px', height: '80px', background: 'linear-gradient(135deg, #633194 0%, #4B2380 100%)', 
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 24px', boxShadow: '0 8px 16px rgba(99, 49, 148, 0.25)' 
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h2 style={{ color: '#1E1B4B', margin: '0 0 12px', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em' }}>Welcome to your account</h2>
          <p style={{ color: '#6B7280', margin: 0, fontSize: '15px', lineHeight: 1.6 }}>
            Hello, <strong>{user?.username}</strong>! You've successfully logged into the EduTrack Portal. Your current role is <strong>{user?.role}</strong>.
          </p>
          <div style={{ marginTop: '32px', background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }}></div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Account Status: Active & Secured</span>
          </div>
        </div>
      </div>
    );
  }

  // Parse 'YYYY-MM-DD' or 'YYYY.MM.DD' in local time to avoid UTC off-by-one bug
  const parseLocalDate = (dateInput: string | Date) => {
    if (!dateInput) return new Date();

    let dateStr: string;

    // Handle Date objects (from backend with timezone)
    if (dateInput instanceof Date) {
      const pad = (n: number) => String(n).padStart(2, '0');
      dateStr = `${dateInput.getFullYear()}-${pad(dateInput.getMonth() + 1)}-${pad(dateInput.getDate())}`;
    } else {
      dateStr = dateInput;
    }

    // Handle both YYYY-MM-DD and YYYY.MM.DD formats
    let [year, month, day] = dateStr.includes('.')
      ? dateStr.split('.').map(Number)
      : dateStr.split('-').map(Number);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return new Date();
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  // Timezone-safe date parsing for edit modal
  const parseLocalDateSafe = (dateInput: string | Date) => {
    if (!dateInput) return new Date();

    let dateStr: string;

    // Handle Date objects (from backend with timezone) - use local timezone
    if (dateInput instanceof Date) {
      const pad = (n: number) => String(n).padStart(2, '0');
      // Use local timezone components to avoid UTC conversion
      const year = dateInput.getFullYear();
      const month = dateInput.getMonth() + 1;
      const day = dateInput.getDate();
      dateStr = `${year}-${pad(month)}-${pad(day)}`;
    } else {
      dateStr = String(dateInput);
    }

    // Handle ISO strings with timezone
    if (typeof dateStr === 'string' && dateStr.includes('T')) {
      const localDate = new Date(dateStr);
      const pad = (n: number) => String(n).padStart(2, '0');
      const year = localDate.getFullYear();
      const month = localDate.getMonth() + 1;
      const day = localDate.getDate();
      dateStr = `${year}-${pad(month)}-${pad(day)}`;
    }

    // Handle both YYYY-MM-DD and YYYY.MM.DD formats
    let [year, month, day] = dateStr.includes('.')
      ? dateStr.split('.').map(Number)
      : dateStr.split('-').map(Number);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return new Date();
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  // Calculate age from date of birth
  const calculateAge = (dob: string | Date): string => {
    if (!dob) return '';
    
    let birthDate: Date;
    if (dob instanceof Date) {
      birthDate = dob;
    } else {
      const dateStr = String(dob);
      if (dateStr.includes('T')) {
        birthDate = new Date(dateStr);
      } else {
        const parts = dateStr.includes('.') ? dateStr.split('.') : dateStr.split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts.map(Number);
          birthDate = new Date(year, month - 1, day);
        } else {
          birthDate = new Date(dateStr);
        }
      }
    }
    
    if (isNaN(birthDate.getTime())) return '';
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 0 ? `${age} Years` : '';
  };

  // Convert date from backend to YYYY-MM-DD format for frontend
  const formatDateFromBackend = (date: any): string => {
    if (!date) return '';
    if (typeof date === 'string') {
      // If it's already a string in YYYY-MM-DD format, return it
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) return date;
      // If it's in YYYY.MM.DD format, convert to YYYY-MM-DD
      if (date.match(/^\d{4}\.\d{2}\.\d{2}$/)) return date.replace(/\./g, '-');
      // If it's an ISO string, extract the date part
      if (date.includes('T')) return date.split('T')[0];
    }
    if (date instanceof Date) {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }
    return '';
  };
  const padDate = (n: number) => String(n).padStart(2, '0');
  const toLocalDateString = (d: Date) =>
    `${d.getFullYear()}-${padDate(d.getMonth() + 1)}-${padDate(d.getDate())}`;

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInlineDetails, setShowInlineDetails] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleEditStudent = (student: Student) => {
    console.log('Editing student:', student);
    console.log('Parent Name:', student.parent_name);
    console.log('Parent Phone:', student.parent_phone);
    console.log('Parent Ethnicity:', student.parent_ethnicity);

    // Format the date properly for editing - handle timezone issues
    let formattedDate: string;
    let dateInput: any = student.date_of_birth;

    // If it's a Date object (with timezone), convert to local date string
    if (dateInput instanceof Date) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const year = dateInput.getFullYear();
      const month = dateInput.getMonth() + 1;
      const day = dateInput.getDate();
      formattedDate = `${year}-${pad(month)}-${pad(day)}`;
      console.log('DEBUG - Edit modal: converted Date object to string:', formattedDate);
    }
    // If it's an ISO string with timezone, extract local date
    else if (typeof dateInput === 'string' && dateInput.includes('T')) {
      const localDate = new Date(dateInput);
      const pad = (n: number) => String(n).padStart(2, '0');
      const year = localDate.getFullYear();
      const month = localDate.getMonth() + 1;
      const day = localDate.getDate();
      formattedDate = `${year}-${pad(month)}-${pad(day)}`;
      console.log('DEBUG - Edit modal: converted ISO string to local date:', formattedDate);
    }
    else {
      formattedDate = formatDateFromBackend(dateInput);
    }

    const formattedStudent = {
      ...student,
      date_of_birth: formattedDate
    };

    console.log('Formatted student for editing:', formattedStudent);
    setEditingStudent(formattedStudent);
    setShowEditModal(true);
  };

  const handleDeleteStudent = (studentId: number) => {
    setDeletingStudentId(studentId);
    setShowDeleteModal(true);
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    // NEW: Validation before update
    if (!/^\d{10}$/.test(updatedStudent.parent_phone)) {
      setNotification({ message: 'Parent phone number must be exactly 10 digits.', type: 'error' });
      return;
    }

    if (updatedStudent.parent_email && 
        String(updatedStudent.parent_email).trim() !== '' && 
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(updatedStudent.parent_email).trim())) {
      setNotification({ message: 'Please enter a valid email address.', type: 'error' });
      return;
    }

    try {
      console.log('Updating student:', updatedStudent);
      console.log('Original date_of_birth:', updatedStudent.date_of_birth);

      // Convert date to YYYY-MM-DD format for database
      const formatDateForDB = (dateString: string) => {
        console.log('Formatting date:', dateString);
        if (!dateString) return '';
        if (dateString.includes('T')) {
          return dateString.split('T')[0]; // Extract YYYY-MM-DD from ISO string
        }
        // If it's already in YYYY-MM-DD format, return as is
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateString;
        }
        // If it's in YYYY.MM.DD format, convert to YYYY-MM-DD
        if (dateString.match(/^\d{4}\.\d{2}\.\d{2}$/)) {
          return dateString.replace(/\./g, '-');
        }
        // Try to parse and format
        const date = parseLocalDate(dateString);
        if (isNaN(date.getTime())) return '';
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
      };

      // Send the complete student data as expected by the database
      const completeStudent = {
        first_name: updatedStudent.first_name,
        last_name: updatedStudent.last_name,
        date_of_birth: formatDateForDB(updatedStudent.date_of_birth),
        gender: updatedStudent.gender,
        religion: updatedStudent.religion || 'Christian',
        ethnicity: updatedStudent.ethnicity || '',
        address: updatedStudent.address || '',
        nationality: updatedStudent.nationality || 'Sri Lanka',
        parent_type: updatedStudent.parent_type || 'father',
        parent_name: updatedStudent.parent_name || '',
        parent_phone: updatedStudent.parent_phone || '',
        parent_address: updatedStudent.parent_address || '',
        parent_gender: updatedStudent.parent_gender || 'male',
        parent_email: updatedStudent.parent_email || '',
        parent_religion: updatedStudent.parent_religion || 'Christian',
        parent_ethnicity: updatedStudent.parent_ethnicity || '',
        parent_nationality: updatedStudent.parent_nationality || 'Sri Lanka'
      };

      console.log('Formatted date_of_birth:', completeStudent.date_of_birth);
      console.log('Complete student data being sent:', JSON.stringify(completeStudent, null, 2));

      // Use the centralized API service
      const updatedStudentData = await studentApi.update(updatedStudent.id, completeStudent);
      console.log('Student updated successfully in backend:', updatedStudentData);

      // Update local state with the returned data
      setStudents(prevStudents =>
        prevStudents.map(student =>
          student.id === updatedStudent.id ? updatedStudentData : student
        )
      );

      // Update the editing student state to reflect the new date
      setEditingStudent(updatedStudentData);

      // Show success message
      setNotification({ message: 'Student information updated successfully!', type: 'success' });

    } catch (error: any) {
      console.error('Error updating student:', error);

      // Show specific error message
      setNotification({ message: 'Failed to update student: ' + error.message, type: 'error' });

      // Keep the current student data in the list
      setStudents(prevStudents =>
        prevStudents.map(student =>
          student.id === updatedStudent.id ? updatedStudent : student
        )
      );
    }

    setShowEditModal(false);
    setEditingStudent(null);
  };

  const handleConfirmDelete = () => {
    if (deletingStudentId) {
      // Delete student from database
      studentApi.delete(deletingStudentId)
        .then(() => {
          // Refresh students list from database
          fetchStudents();
        })
        .catch(error => {
          console.error('Error deleting student:', error);
          setNotification({ message: 'Failed to delete student. Please try again.', type: 'error' });
        });

      setShowDeleteModal(false);
      setDeletingStudentId(null);
    }
  };

  const handleViewStudent = (student: Student) => {
    console.log('View button clicked for student:', student);
    setSelectedStudent(student);
    setShowInlineDetails(true);
  };

  const handleDownloadPDF = (student: Student) => {
    // Create a beautiful HTML document for PDF that matches the inline details view exactly
    const registrationNumber = `#${student.id}`;

    // Create beautiful HTML content matching the inline details view
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Student Details - ${student.first_name} ${student.last_name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 15px;
            background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
            min-height: 100vh;
            font-size: 12px;
        }
        .container {
            max-width: 100%;
            margin: 0 auto;
        }
        .details-card {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            padding: 0;
            border: 1px solid rgba(148, 163, 184, 0.2);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #633194 0%, #4B2380 100%);
            color: white;
            padding: 25px;
            border-radius: 16px 16px 0 0;
            text-align: center;
            position: relative;
        }
        .header h1 {
            margin: 0 0 5px 0;
            font-size: 1.8rem;
            font-weight: 700;
        }
        .header p {
            margin: 0 0 10px 0;
            font-size: 0.9rem;
            opacity: 0.9;
        }
        .registration-date {
            background: rgba(255, 255, 255, 0.15);
            padding: 6px 15px;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: 600;
            display: inline-block;
            backdrop-filter: blur(10px);
        }
        .student-id-badge {
            text-align: center;
            margin: -15px 0 15px 0;
            position: relative;
            z-index: 10;
        }
        .student-id-badge div {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 8px 20px;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: 600;
            display: inline-block;
            box-shadow: 0 5px 15px rgba(245, 158, 11, 0.3);
            border: 2px solid white;
        }
        .content {
            padding: 0 20px 20px 20px;
        }
        .section {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
            padding: 15px;
            border-radius: 12px;
            border: 1px solid rgba(99, 102, 241, 0.1);
            margin-bottom: 15px;
        }
        .section.parent {
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%);
            border: 1px solid rgba(34, 197, 94, 0.1);
        }
        .section h3 {
            color: #6366f1;
            font-size: 1rem;
            font-weight: 700;
            margin: 0 0 12px 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .section.parent h3 {
            color: #22c55e;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
        }
        .info-item {
            background: white;
            padding: 10px;
            border-radius: 8px;
            border: 1px solid rgba(99, 102, 241, 0.1);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        .section.parent .info-item {
            border: 1px solid rgba(34, 197, 94, 0.1);
        }
        .info-label {
            color: #64748b;
            font-size: 0.7rem;
            font-weight: 600;
            margin-bottom: 3px;
            text-transform: uppercase;
        }
        .info-value {
            color: #1e293b;
            font-size: 0.9rem;
            font-weight: 600;
        }
        .address-item {
            grid-column: 1 / -1;
        }
        .footer {
            text-align: center;
            margin-top: 15px;
            padding: 15px;
            color: #64748b;
            font-size: 0.7rem;
            border-top: 1px solid rgba(148, 163, 184, 0.2);
        }
        @media print {
            body { 
                background: white !important; 
                padding: 8px !important;
                font-size: 10px !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            .container {
                max-width: 100% !important;
                margin: 0 auto !important;
            }
            .details-card {
                box-shadow: none !important;
                border: 1px solid #ddd !important;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%) !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            .header {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
                padding: 20px !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            .header h1 {
                font-size: 1.5rem !important;
                margin: 0 0 3px 0 !important;
            }
            .header p {
                font-size: 0.8rem !important;
                margin: 0 0 8px 0 !important;
            }
            .student-id-badge div {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
                padding: 6px 15px !important;
                font-size: 0.7rem !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            .student-id-badge {
                margin: -12px 0 12px 0 !important;
            }
            .content {
                padding: 0 15px 15px 15px !important;
            }
            .section {
                background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%) !important;
                padding: 12px !important;
                margin-bottom: 12px !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
                page-break-inside: avoid;
            }
            .section.parent {
                background: linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%) !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            .section h3 {
                font-size: 0.9rem !important;
                margin: 0 0 8px 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            .info-grid {
                grid-template-columns: repeat(3, 1fr) !important;
                gap: 8px !important;
            }
            .info-item {
                background: white !important;
                padding: 8px !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            .section.parent .info-item {
                background: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            .info-label {
                font-size: 0.6rem !important;
                margin-bottom: 2px !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            .info-value {
                font-size: 0.8rem !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            .registration-date {
                background: rgba(255, 255, 255, 0.15) !important;
                padding: 4px 12px !important;
                font-size: 0.7rem !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            .section h3 {
                color: #633194 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            .section.parent h3 {
                color: #8B5CF6 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            .info-label {
                color: #64748b !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            .info-value {
                color: #1e293b !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            .footer {
                margin-top: 10px !important;
                padding: 10px !important;
                font-size: 0.6rem !important;
                color: #64748b !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="details-card">
            <div class="header">
                <h1>Student Profile</h1>
                <p>EduTrack Academic Record</p>
                <div class="registration-date">
                    📅 Registered: ${student.created_at ? new Date(student.created_at).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Not available'}
                </div>
            </div>

            <div class="student-id-badge">
                <div>🎓 Student ID: ${registrationNumber}</div>
            </div>

            <div class="content">
                <div class="section">
                    <h3><span style="font-size: 1.5rem;">👤</span> Student Information</h3>
                    
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">Full Name</div>
                            <div class="info-value">${student.first_name} ${student.last_name}</div>
                        </div>

                        <div class="info-item">
                            <div class="info-label">Date of Birth</div>
                            <div class="info-value">${(() => {
        let dateInput: any = student.date_of_birth;
        if (!dateInput) return 'Not specified';

        // Handle timezone issue for PDF
        let dateStr: string;

        // If it's a Date object (with timezone), convert to local date string
        if (dateInput instanceof Date) {
          const pad = (n: number) => String(n).padStart(2, '0');
          const year = dateInput.getFullYear();
          const month = dateInput.getMonth() + 1;
          const day = dateInput.getDate();
          dateStr = `${year}-${pad(month)}-${pad(day)}`;
        }
        // If it's an ISO string with timezone, extract local date
        else if (typeof dateInput === 'string' && dateInput.includes('T')) {
          const localDate = new Date(dateInput);
          const pad = (n: number) => String(n).padStart(2, '0');
          const year = localDate.getFullYear();
          const month = localDate.getMonth() + 1;
          const day = localDate.getDate();
          dateStr = `${year}-${pad(month)}-${pad(day)}`;
        }
        else {
          dateStr = String(dateInput);
        }

        // Handle both YYYY-MM-DD and YYYY.MM.DD formats
        let [year, month, day] = dateStr.includes('.')
          ? dateStr.split('.').map(Number)
          : dateStr.split('-').map(Number);

        if (isNaN(year) || isNaN(month) || isNaN(day)) return 'Invalid Date';

        // Format directly without using Date object to avoid timezone issues
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${monthNames[month - 1]} ${day}, ${year}`;
      })()}</div>
                        </div>

                        <div class="info-item">
                            <div class="info-label">Gender</div>
                            <div class="info-value">${student.gender.charAt(0).toUpperCase() + student.gender.slice(1)}</div>
                        </div>

                        <div class="info-item">
                            <div class="info-label">Religion</div>
                            <div class="info-value">${student.religion}</div>
                        </div>

                        <div class="info-item">
                            <div class="info-label">Ethnicity</div>
                            <div class="info-value">${student.ethnicity || 'Not specified'}</div>
                        </div>

                        <div class="info-item">
                            <div class="info-label">Nationality</div>
                            <div class="info-value">${student.nationality}</div>
                        </div>
                    </div>

                    <div class="info-item address-item">
                        <div class="info-label">Address</div>
                        <div class="info-value" style="line-height: 1.5;">${student.address}</div>
                    </div>
                </div>

                <div class="section parent">
                    <h3><span style="font-size: 1.5rem;">👨‍👩‍👧‍👦</span> Parent/Guardian Information</h3>
                    
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">Parent Type</div>
                            <div class="info-value">${student.parent_type.charAt(0).toUpperCase() + student.parent_type.slice(1)}</div>
                        </div>

                        <div class="info-item">
                            <div class="info-label">Parent Name</div>
                            <div class="info-value">${student.parent_name}</div>
                        </div>

                        <div class="info-item">
                            <div class="info-label">Parent Phone</div>
                            <div class="info-value">${student.parent_phone}</div>
                        </div>


                        <div class="info-item">
                            <div class="info-label">Parent Email</div>
                            <div class="info-value">${student.parent_email || 'Not provided'}</div>
                        </div>

                        <div class="info-item">
                            <div class="info-label">Parent Religion</div>
                            <div class="info-value">${student.parent_religion}</div>
                        </div>

                        <div class="info-item">
                            <div class="info-label">Parent Ethnicity</div>
                            <div class="info-value">${student.parent_ethnicity || 'Not specified'}</div>
                        </div>

                        <div class="info-item">
                            <div class="info-label">Parent Nationality</div>
                            <div class="info-value">${student.parent_nationality}</div>
                        </div>
                    </div>

                    <div class="info-item address-item">
                        <div class="info-label">Parent Address</div>
                        <div class="info-value" style="line-height: 1.5;">${student.parent_address}</div>
                    </div>
                </div>
            </div>

            <div class="footer">
                <div><strong>EduTrack Student Management System</strong></div>
                <div>Generated on ${new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</div>
                <div style="margin-top: 5px; font-size: 0.8rem;">© 2026 All rights reserved</div>
            </div>
        </div>
    </div>
</body>
</html>
    `;

    // Create a new window and write the HTML directly
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (printWindow) {
      // Write the HTML content
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for the content to load, then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          // Close the window after printing
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }, 1000);
      };
    } else {
      // Fallback: Create a downloadable HTML file
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Student_Details_${student.first_name}_${student.last_name}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('Please open the downloaded HTML file and use Ctrl+P to save as PDF.');
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      console.log('Fetching students from backend via studentApi...');

      // Use the centralized studentApi which handles authentication
      const studentsData = await studentApi.getAll();

      console.log('Backend response (students data):', studentsData);

      if (studentsData && studentsData.length > 0) {
        console.log('Setting students from backend:', studentsData);
        setStudents(studentsData);
      } else {
        console.log('Backend returned no students');
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students via studentApi:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const generateRegistrationNumber = (student: Student) => {
    return `EDU-${new Date().getFullYear()}-${String(student.id).padStart(6, '0')}`;
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          color: '#333'
        }}>
          <div style={{
            fontSize: '2rem',
            marginBottom: '20px'
          }}>⏳</div>
          <h2>Loading Students...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      fontFamily: 'Inter, sans-serif',
      padding: '24px',
      position: 'relative',
      boxSizing: 'border-box',
      width: '100%',
      height: '100%',
      overflow: 'auto'
    }}>
      <div style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(99, 49, 148, 0.1)',
          border: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '600',
              margin: '0 0 8px 0',
              color: '#633194',
              fontFamily: 'Inter, sans-serif'
            }}>
              Registered Students
            </h1>
            <p style={{
              color: '#6B7280',
              fontSize: '16px',
              margin: '0',
              fontFamily: 'Inter, sans-serif',
              fontWeight: '500'
            }}>
              Total: {students.filter(s =>
                `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.id.toString().includes(searchTerm)
              ).length}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
            {/* Premium Search Bar */}
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '400px'
            }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8'
                }}
              />
              <input
                type="text"
                placeholder="Search by name or student ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 48px',
                  backgroundColor: '#F8FAFC',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '16px',
                  fontSize: '14px',
                  color: '#1E293B',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02) inset'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#8B5CF6';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.backgroundColor = '#F8FAFC';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02) inset';
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#F1F5F9',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontWeight: '800',
                    color: '#64748B',
                    cursor: 'pointer'
                  }}
                >
                  ESC
                </button>
              )}
            </div>

            <button
              onClick={fetchStudents}
              style={{
                padding: '8px 20px',
                background: '#633194',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 4px 12px rgba(99, 49, 148, 0.15)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.background = '#4B2380';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 49, 148, 0.25)';
              }}
              onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = '#633194';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 49, 148, 0.15)';
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Students Grid */}
        {students.filter(student =>
          `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.id.toString().includes(searchTerm)
        ).length === 0 ? (
          <div style={{
            background: '#FFFFFF',
            padding: '60px',
            borderRadius: '24px',
            textAlign: 'center',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 20px rgba(99, 49, 148, 0.05)',
            width: '100%',
            boxSizing: 'border-box',
            marginBottom: '24px'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>{searchTerm ? '🔍' : '📚'}</div>
            <h2 style={{ fontSize: '24px', color: '#633194', fontWeight: '600', margin: '0 0 12px 0' }}>
              {searchTerm ? 'No Students Found' : 'No Students Yet'}
            </h2>
            <p style={{ color: '#6B7280' }}>
              {searchTerm ? 'Try adjusting your search criteria' : 'Start by registering your first student!'}
            </p>
          </div>
        ) : (
          <div style={{
            width: '100%',
            background: '#F9FAFB',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 4px 24px rgba(99, 49, 148, 0.08)'
          }}>
            {/* Modern Student Cards */}

            {/* Inline Student Details View */}
            {showInlineDetails && selectedStudent && (
              <div style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                padding: '0',
                border: '1px solid #E5E7EB',
                boxShadow: '0 25px 50px -12px rgba(99, 49, 148, 0.15)',
                overflow: 'hidden',
                animation: 'fadeInUp 0.5s ease-out',
                marginBottom: '24px'
              }}>
                {/* Premium Header - Smaller */}
                <div style={{
                  background: 'linear-gradient(135deg, #633194 0%, #4B2380 100%)',
                  color: 'white',
                  padding: '24px 30px',
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    display: 'flex',
                    gap: '10px'
                  }}>
                    <button
                      onClick={() => setShowInlineDetails(false)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '10px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
                    >
                      ← BACK
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(selectedStudent!)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '10px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
                    >
                      📄 PDF REPORT
                    </button>
                  </div>
                  
                  <h2 style={{
                    margin: '0 0 8px 0',
                    fontSize: '24px',
                    fontWeight: '900',
                    letterSpacing: '-0.5px'
                  }}>
                    Student Profile
                  </h2>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '6px 20px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'inline-block',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}>
                    Registered: {selectedStudent.created_at ? new Date(selectedStudent.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}
                  </div>
                </div>

                {/* ID Badge Overlay - Smaller */}
                <div style={{ textAlign: 'center', marginTop: '-18px', position: 'relative', zIndex: 10 }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: 'white',
                    padding: '8px 24px',
                    borderRadius: '16px',
                    fontSize: '14px',
                    fontWeight: '800',
                    display: 'inline-block',
                    boxShadow: '0 8px 20px rgba(217, 119, 6, 0.25)',
                    border: '3px solid white',
                    textTransform: 'uppercase'
                  }}>
                    🎓 REG NO: #{selectedStudent.id}
                  </div>
                </div>

                {/* Profile Grid - High Density */}
                <div style={{ padding: '20px 32px 32px', display: 'grid', gap: '20px' }}>
                  
                  {/* General Info */}
                  <div style={{
                    background: '#F9FAFB',
                    padding: '20px',
                    borderRadius: '20px',
                    border: '1px solid #F3F4F6'
                  }}>
                    <h3 style={{
                      color: '#633194',
                      fontSize: '16px',
                      fontWeight: '800',
                      margin: '0 0 16px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <span style={{ fontSize: '20px' }}>👤</span>
                      Personal Information
                    </h3>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '16px'
                    }}>
                      {[
                        { label: 'Full Name', value: `${selectedStudent.first_name} ${selectedStudent.last_name}` },
                        { label: 'Date of Birth', value: calculateAge(selectedStudent.date_of_birth) ? `${selectedStudent.date_of_birth} (${calculateAge(selectedStudent.date_of_birth)})` : selectedStudent.date_of_birth },
                        { label: 'Gender', value: selectedStudent.gender },
                        { label: 'Religion', value: selectedStudent.religion },
                        { label: 'Ethnicity', value: selectedStudent.ethnicity || 'Not specified' },
                        { label: 'Nationality', value: selectedStudent.nationality },
                        { label: 'Home Address', value: selectedStudent.address, full: true }
                      ].map((info, i) => (
                        <div key={i} style={{ 
                          background: 'white', 
                          padding: '12px', 
                          borderRadius: '12px', 
                          border: '1px solid #F3F4F6',
                          gridColumn: info.full ? '1 / -1' : 'auto'
                        }}>
                          <div style={{ color: '#6B7280', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>{info.label}</div>
                          <div style={{ color: '#1E1B4B', fontSize: '13px', fontWeight: '700' }}>{info.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Parent Info */}
                  <div style={{
                    background: '#F5F3FF',
                    padding: '20px',
                    borderRadius: '20px',
                    border: '1px solid #EDE9FE'
                  }}>
                    <h3 style={{
                      color: '#8B5CF6',
                      fontSize: '16px',
                      fontWeight: '800',
                      margin: '0 0 16px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <span style={{ fontSize: '20px' }}>👨‍👩‍👧‍👦</span>
                      Guardian Information
                    </h3>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '16px'
                    }}>
                      {[
                        { label: 'Parent Type', value: selectedStudent.parent_type },
                        { label: 'Parent Name', value: selectedStudent.parent_name },
                        { label: 'Contact Phone', value: selectedStudent.parent_phone },
                        { label: 'Email Address', value: selectedStudent.parent_email || 'Not provided' },
                        { label: 'Parent Address', value: selectedStudent.parent_address, full: true }
                      ].map((info, i) => (
                        <div key={i} style={{ 
                          background: 'white', 
                          padding: '12px', 
                          borderRadius: '12px', 
                          border: '1px solid #EDE9FE',
                          gridColumn: info.full ? '1 / -1' : 'auto'
                        }}>
                          <div style={{ color: '#8B5CF6', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>{info.label}</div>
                          <div style={{ color: '#1E1B4B', fontSize: '13px', fontWeight: '700' }}>{info.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {students
                .filter(student =>
                  `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  student.id.toString().includes(searchTerm)
                )
                .map((student, index) => (
                  <div
                    key={student.id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '20px',
                      padding: '0',
                      boxShadow: '0 2px 12px rgba(99, 49, 148, 0.06)',
                      border: '1px solid rgba(99, 49, 148, 0.08)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      overflow: 'hidden',
                      animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(99, 49, 148, 0.12)';
                      e.currentTarget.style.borderColor = '#633194';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 12px rgba(99, 49, 148, 0.06)';
                      e.currentTarget.style.borderColor = 'rgba(99, 49, 148, 0.08)';
                    }}
                  >
                    {/* Registration Number at Top */}
                    <div style={{
                      background: 'linear-gradient(135deg, #633194 0%, #4B2380 100%)',
                      color: 'white',
                      padding: '6px 24px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      fontFamily: 'monospace',
                      textAlign: 'center',
                      letterSpacing: '1px'
                    }}>
                      🎓 {generateRegistrationNumber(student)}
                    </div>

                    {/* Left Accent Strip */}
                    <div style={{
                      position: 'absolute',
                      top: '34px', // Adjusted for further reduced registration number height
                      left: 0,
                      width: '6px',
                      height: 'calc(100% - 34px)', // Adjusted height
                      background: 'linear-gradient(135deg, #633194 0%, #4B2380 100%)'
                    }} />

                    {/* Student Card Content */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 20px',
                      gap: '20px'
                    }}>
                      {/* Avatar Section */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, #633194 0%, #4B2380 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.6rem',
                          boxShadow: '0 4px 16px rgba(99, 49, 148, 0.25)',
                          transition: 'transform 0.3s ease'
                        }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                          }}
                        >
                          {student.gender === 'male' ? '👦' : student.gender === 'female' ? '👧' : '👤'}
                        </div>
                        <div style={{
                          color: '#1F2937',
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          textAlign: 'center',
                          maxWidth: '160px',
                          lineHeight: '1.1',
                          whiteSpace: 'nowrap'
                        }}>
                          {student.first_name} {student.last_name}
                        </div>
                      </div>

                      {/* Student Info Section */}
                      <div style={{
                        flex: 1,
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr 1fr',
                        gap: '20px',
                        alignItems: 'center'
                      }}>
                        {/* Empty space for balance */}
                        <div></div>

                        {/* Birthday */}
                        <div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginBottom: '1px',
                            whiteSpace: 'nowrap'
                          }}>
                            <span style={{ fontSize: '1rem' }}>🎂</span>
                            <span style={{
                              color: '#374151',
                              fontSize: '0.85rem',
                              fontWeight: '600'
                            }}>
                              {(() => {
                                // Debug: Log the actual data
                                console.log('DEBUG - student.date_of_birth:', student.date_of_birth);

                                // Handle timezone issue - ensure local date display
                                let dateInput: any = student.date_of_birth;

                                // If it's a Date object (with timezone), convert to local date string
                                if (dateInput instanceof Date) {
                                  const pad = (n: number) => String(n).padStart(2, '0');
                                  // Use local timezone components
                                  const year = dateInput.getFullYear();
                                  const month = dateInput.getMonth() + 1; // getMonth() is 0-based
                                  const day = dateInput.getDate();
                                  dateInput = `${year}-${pad(month)}-${pad(day)}`;
                                  console.log('DEBUG - converted Date object to string:', dateInput);
                                }

                                // Convert to string for further processing
                                let dateStr = String(dateInput);

                                // If it's an ISO string with timezone, extract local date
                                if (typeof dateStr === 'string' && dateStr.includes('T')) {
                                  const localDate = new Date(dateStr);
                                  const pad = (n: number) => String(n).padStart(2, '0');
                                  const year = localDate.getFullYear();
                                  const month = localDate.getMonth() + 1;
                                  const day = localDate.getDate();
                                  dateStr = `${year}-${pad(month)}-${pad(day)}`;
                                  console.log('DEBUG - converted ISO string to local date:', dateStr);
                                }

                                if (!dateStr || dateStr === 'Invalid Date') return 'Not specified';

                                // If it's already a string in YYYY-MM-DD format, format it nicely
                                if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                  const [year, month, day] = dateStr.split('-');
                                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                  const result = `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
                                  console.log('DEBUG - formatted result:', result);
                                  return result;
                                }

                                // Fallback for any other format
                                console.log('DEBUG - fallback to original:', dateStr);
                                return dateStr;
                              })()}
                            </span>
                          </div>
                          <div style={{
                            color: '#6B7280',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span>Birthday</span>
                            <span style={{ 
                              color: '#633194', 
                              fontWeight: '700',
                              fontSize: '0.7rem',
                              background: '#F5F3FF',
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}>
                              {calculateAge(student.date_of_birth)}
                            </span>
                          </div>
                        </div>

                        {/* Parent Info */}
                        <div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginBottom: '1px'
                          }}>
                            <span style={{ fontSize: '1rem' }}>👨‍👩‍👧‍👦</span>
                            <div>
                              <div style={{
                                color: '#374151',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                textTransform: 'capitalize'
                              }}>
                                {student.parent_type}
                              </div>
                            </div>
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            color: '#6B7280',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}>
                            <span style={{ fontSize: '0.8rem' }}>📞</span>
                            <span>{student.parent_phone}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{
                          display: 'flex',
                          gap: '6px',
                          justifyContent: 'flex-end',
                          position: 'relative',
                          zIndex: 100,
                          pointerEvents: 'auto'
                        }}>
                          <button
                            onClick={() => handleEditStudent(student)}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #633194 0%, #4B2380 100%)',
                              color: 'white',
                              border: 'none',
                              fontSize: '0.9rem',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 2px 8px rgba(99, 49, 148, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              pointerEvents: 'auto',
                              position: 'relative',
                              zIndex: 1001
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1.1)';
                              e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 49, 148, 0.35)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = 'translateY(0) scale(1)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 49, 148, 0.25)';
                            }}
                            title="Edit Student"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleViewStudent(student)}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                              color: 'white',
                              border: 'none',
                              fontSize: '0.9rem',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              pointerEvents: 'auto',
                              position: 'relative',
                              zIndex: 1001
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1.1)';
                              e.currentTarget.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.35)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = 'translateY(0) scale(1)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.25)';
                            }}
                            title="View Student Details"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(student)}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              fontSize: '0.9rem',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              pointerEvents: 'auto',
                              position: 'relative',
                              zIndex: 1001
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1.1)';
                              e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.35)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = 'translateY(0) scale(1)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.25)';
                            }}
                            title="Download PDF"
                          >
                            📄
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                              color: 'white',
                              border: 'none',
                              fontSize: '0.9rem',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              pointerEvents: 'auto',
                              position: 'relative',
                              zIndex: 1001
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1.1)';
                              e.currentTarget.style.boxShadow = '0 4px 16px rgba(239, 68, 68, 0.35)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = 'translateY(0) scale(1)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.25)';
                            }}
                            title="Delete Student"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Custom Notification Toast */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 10000,
          animation: 'slideInRight 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
          maxWidth: '400px'
        }}>
          <div style={{
            background: notification.type === 'error' 
              ? 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)' 
              : 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
            border: `1px solid ${notification.type === 'error' ? '#FECACA' : '#A7F3D0'}`,
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: notification.type === 'error' ? '#EF4444' : '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.2rem',
              boxShadow: `0 4px 12px ${notification.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
            }}>
              {notification.type === 'error' ? '⚠️' : '✅'}
            </div>
            <div>
              <div style={{ color: notification.type === 'error' ? '#991B1B' : '#065F46', fontWeight: '800', fontSize: '14px', marginBottom: '2px' }}>
                {notification.type === 'error' ? 'Validation Error' : 'Success'}
              </div>
              <div style={{ color: notification.type === 'error' ? '#B91C1C' : '#059669', fontSize: '13px', fontWeight: '500' }}>
                {notification.message}
              </div>
            </div>
            <button 
              onClick={() => setNotification(null)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: notification.type === 'error' ? '#B91C1C' : '#059669',
                cursor: 'pointer',
                fontSize: '1.2rem',
                opacity: 0.5,
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '0.5')}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Redesigned Edit Student Modal - Project Sync */}
      {showEditModal && editingStudent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(30, 27, 75, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2500,
          padding: '16px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(99, 49, 148, 0.25)',
            border: '1px solid #E5E7EB',
            position: 'relative'
          }}>
            {/* Professional Header */}
            <div style={{
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #633194 0%, #4B2380 100%)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(99, 49, 148, 0.15)'
            }}>
              <div>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '24px' }}>👤</span>
                  Edit Student Profile
                </h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: '2px 0 0', fontSize: '12px', fontWeight: 500 }}>
                  ID: #{editingStudent.id} • Registered Student Record
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingStudent(null);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
              >
                ×
              </button>
            </div>

            {/* Form Content - High Density Scrollable */}
            <div style={{
              padding: '20px 32px',
              overflowY: 'auto',
              flex: 1,
              background: '#F9FAFB'
            }}>
              {/* Information Cards */}
              <div style={{ display: 'grid', gap: '20px' }}>
                
                {/* SECTION 1: STUDENT INFORMATION */}
                <div style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '20px',
                  border: '1px solid #F3F4F6',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ width: '3px', height: '16px', background: '#633194', borderRadius: '4px' }}></div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E1B4B', margin: 0 }}>Student Information</h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>First Name</label>
                      <input
                        type="text"
                        value={editingStudent.first_name}
                        onChange={(e) => setEditingStudent({ ...editingStudent, first_name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1px solid #E5E7EB',
                          background: '#FFFFFF',
                          color: '#1E1B4B',
                          fontSize: '13px',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#633194')}
                        onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Last Name</label>
                      <input
                        type="text"
                        value={editingStudent.last_name}
                        onChange={(e) => setEditingStudent({ ...editingStudent, last_name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1px solid #E5E7EB',
                          background: '#FFFFFF',
                          color: '#1E1B4B',
                          fontSize: '13px',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#633194')}
                        onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>
                        Date of Birth
                        {editingStudent.date_of_birth && !isNaN(parseLocalDateSafe(editingStudent.date_of_birth).getTime()) && (() => {
                          const age = calculateAge(editingStudent.date_of_birth);
                          return (
                            <span style={{ 
                              fontSize: '10px', 
                              background: '#F3F4F6', 
                              color: '#633194', 
                              padding: '2px 8px', 
                              borderRadius: '8px', 
                              fontWeight: 800,
                              marginLeft: '8px'
                            }}>
                              {age} YEARS OLD
                            </span>
                          );
                        })()}
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select
                          value={(() => {
                            if (!editingStudent.date_of_birth) return '';
                            const date = parseLocalDateSafe(editingStudent.date_of_birth);
                            return isNaN(date.getTime()) ? '' : date.getDate();
                          })()}
                          onChange={(e) => {
                            const day = parseInt(e.target.value);
                            const currentDate = editingStudent.date_of_birth ? parseLocalDateSafe(editingStudent.date_of_birth) : new Date();
                            const month = currentDate.getMonth();
                            const year = currentDate.getFullYear();
                            const newDate = new Date(year, month, day);
                            setEditingStudent({ ...editingStudent, date_of_birth: toLocalDateString(newDate) });
                          }}
                          style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '10px',
                            border: '1px solid #E5E7EB',
                            background: '#FFFFFF',
                            fontSize: '13px'
                          }}
                        >
                          <option value="">Day</option>
                          {Array.from({ length: 31 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                        <select
                          value={(() => {
                            if (!editingStudent.date_of_birth) return '';
                            const date = parseLocalDateSafe(editingStudent.date_of_birth);
                            return isNaN(date.getTime()) ? '' : date.getMonth() + 1;
                          })()}
                          onChange={(e) => {
                            const month = parseInt(e.target.value) - 1;
                            const currentDate = editingStudent.date_of_birth ? parseLocalDateSafe(editingStudent.date_of_birth) : new Date();
                            const day = currentDate.getDate();
                            const year = currentDate.getFullYear();
                            const newDate = new Date(year, month, day);
                            setEditingStudent({ ...editingStudent, date_of_birth: toLocalDateString(newDate) });
                          }}
                          style={{
                            flex: 1.5,
                            padding: '8px',
                            borderRadius: '10px',
                            border: '1px solid #E5E7EB',
                            background: '#FFFFFF',
                            fontSize: '13px'
                          }}
                        >
                          <option value="">Month</option>
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => (
                            <option key={m} value={idx + 1}>{m}</option>
                          ))}
                        </select>
                        <select
                          value={(() => {
                            if (!editingStudent.date_of_birth) return '';
                            const date = parseLocalDateSafe(editingStudent.date_of_birth);
                            return isNaN(date.getTime()) ? '' : date.getFullYear();
                          })()}
                          onChange={(e) => {
                            const year = parseInt(e.target.value);
                            const currentDate = editingStudent.date_of_birth ? parseLocalDateSafe(editingStudent.date_of_birth) : new Date();
                            const day = currentDate.getDate();
                            const month = currentDate.getMonth();
                            const newDate = new Date(year, month, day);
                            setEditingStudent({ ...editingStudent, date_of_birth: toLocalDateString(newDate) });
                          }}
                          style={{
                            flex: 1.2,
                            padding: '8px',
                            borderRadius: '10px',
                            border: '1px solid #E5E7EB',
                            background: '#FFFFFF',
                            fontSize: '13px'
                          }}
                        >
                          <option value="">Year</option>
                          {Array.from({ length: 100 }, (_, i) => {
                            const year = new Date().getFullYear() - i;
                            return <option key={year} value={year}>{year}</option>;
                          })}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Gender</label>
                      <select
                        value={editingStudent.gender}
                        onChange={(e) => setEditingStudent({ ...editingStudent, gender: e.target.value as 'male' | 'female' | 'other' })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1px solid #E5E7EB',
                          background: '#FFFFFF',
                          fontSize: '13px'
                        }}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Religion</label>
                      <input
                        type="text"
                        value={editingStudent.religion}
                        onChange={(e) => setEditingStudent({ ...editingStudent, religion: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1px solid #E5E7EB',
                          fontSize: '13px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Ethnicity</label>
                      <input
                        type="text"
                        value={editingStudent.ethnicity || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, ethnicity: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1px solid #E5E7EB',
                          fontSize: '13px'
                        }}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Home Address</label>
                      <textarea
                        value={editingStudent.address}
                        onChange={(e) => setEditingStudent({ ...editingStudent, address: e.target.value })}
                        rows={2}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1px solid #E5E7EB',
                          fontSize: '13px',
                          resize: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: PARENT DETAILS */}
                <div style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '20px',
                  border: '1px solid #F3F4F6',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ width: '3px', height: '16px', background: '#8B5CF6', borderRadius: '4px' }}></div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E1B4B', margin: 0 }}>Parent / Guardian Details</h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Parent Type</label>
                      <select
                        value={editingStudent.parent_type}
                        onChange={(e) => setEditingStudent({ ...editingStudent, parent_type: e.target.value as 'father' | 'mother' | 'guardian' })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1px solid #E5E7EB',
                          fontSize: '13px'
                        }}
                      >
                        <option value="father">Father</option>
                        <option value="mother">Mother</option>
                        <option value="guardian">Guardian</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Parent Name</label>
                      <input
                        type="text"
                        value={editingStudent.parent_name}
                        onChange={(e) => setEditingStudent({ ...editingStudent, parent_name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1px solid #E5E7EB',
                          fontSize: '13px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Contact Phone</label>
                      <input
                        type="text"
                        value={editingStudent.parent_phone}
                        onChange={(e) => {
                          const onlyNums = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                          setEditingStudent({ ...editingStudent, parent_phone: onlyNums });
                        }}
                        placeholder="10 Digits"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1px solid #E5E7EB',
                          fontSize: '13px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Email Address</label>
                      <input
                        type="email"
                        value={editingStudent.parent_email || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, parent_email: e.target.value })}
                        placeholder="parent@example.com"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1px solid #E5E7EB',
                          fontSize: '13px'
                        }}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Parent Address</label>
                      <textarea
                        value={editingStudent.parent_address}
                        onChange={(e) => setEditingStudent({ ...editingStudent, parent_address: e.target.value })}
                        rows={2}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1px solid #E5E7EB',
                          fontSize: '13px',
                          resize: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div style={{
              padding: '16px 32px',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              background: '#FFFFFF'
            }}>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingStudent(null);
                }}
                style={{
                  padding: '8px 18px',
                  background: 'transparent',
                  color: '#6B7280',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#F9FAFB';
                  e.currentTarget.style.color = '#111827';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#6B7280';
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStudent(editingStudent)}
                style={{
                  padding: '8px 22px',
                  background: 'linear-gradient(135deg, #633194 0%, #4B2380 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(99, 49, 148, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 49, 148, 0.25)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 49, 148, 0.15)';
                }}
              >
                <span>Update Changes</span>
                <span style={{ fontSize: '14px' }}>✔️</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Redesigned Delete Modal - Project Sync */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(30, 27, 75, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          padding: '16px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '24px',
            maxWidth: '380px',
            width: '100%',
            border: '1px solid #FEE2E2',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Danger Indicator Bar */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)'
            }} />

            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: '#FEF2F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '24px',
              color: '#EF4444',
              transform: 'rotate(10deg)',
              boxShadow: '0 8px 16px rgba(239, 68, 68, 0.1)'
            }}>
              ⚠️
            </div>
            
            <h2 style={{ color: '#1E1B4B', fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0' }}>
              Confirm Deletion
            </h2>
            <p style={{ color: '#6B7280', fontSize: '13px', margin: '0 0 24px 0', lineHeight: '1.5' }}>
              Are you sure you want to remove this record? This action is <strong style={{ color: '#EF4444' }}>permanent</strong> and cannot be undone.
            </p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingStudentId(null);
                }}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  background: '#F9FAFB',
                  color: '#6B7280',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#F3F4F6')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#F9FAFB')}
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 8px 16px rgba(239, 68, 68, 0.2)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 10px 18px rgba(239, 68, 68, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(239, 68, 68, 0.2)';
                }}
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentList;
