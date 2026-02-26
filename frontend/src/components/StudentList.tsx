import React, { useState, useEffect } from 'react';

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  religion: string;
  address: string;
  nationality: string;
  parent_type: 'father' | 'mother' | 'guardian';
  parent_name: string;
  parent_phone: string;
  parent_address: string;
  parent_gender: 'male' | 'female' | 'other';
  parent_email?: string;
  parent_religion: string;
  parent_nationality: string;
  created_at?: string;
}

const StudentList: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<number | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const clearAllStudents = () => {
    setStudents([]);
    localStorage.removeItem('demoStudents');
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setShowEditModal(true);
  };

  const handleDeleteStudent = (studentId: number) => {
    setDeletingStudentId(studentId);
    setShowDeleteModal(true);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    const demoStudents = JSON.parse(localStorage.getItem('demoStudents') || '[]');
    const updatedStudents = demoStudents.map((student: Student) => 
      student.id === updatedStudent.id ? updatedStudent : student
    );
    localStorage.setItem('demoStudents', JSON.stringify(updatedStudents));
    setStudents(updatedStudents);
    setShowEditModal(false);
    setEditingStudent(null);
  };

  const handleConfirmDelete = () => {
    if (deletingStudentId) {
      const demoStudents = JSON.parse(localStorage.getItem('demoStudents') || '[]');
      const updatedStudents = demoStudents.filter((student: Student) => student.id !== deletingStudentId);
      localStorage.setItem('demoStudents', JSON.stringify(updatedStudents));
      setStudents(updatedStudents);
      setShowDeleteModal(false);
      setDeletingStudentId(null);
    }
  };

  const handleDownloadPDF = (student: Student) => {
    // Create a beautiful HTML document for PDF
    const studentName = `${student.first_name}_${student.last_name}`;
    const registrationNumber = generateRegistrationNumber(student);
    
    // Create beautiful HTML content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Student Details - ${student.first_name} ${student.last_name}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            font-size: 28px;
            margin: 0 0 10px 0;
            font-weight: 300;
            letter-spacing: 2px;
        }
        .header p {
            font-size: 14px;
            margin: 0;
            opacity: 0.9;
        }
        .reg-number {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            letter-spacing: 1px;
            margin: 30px;
            border-radius: 10px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .section {
            margin: 30px;
            padding: 25px;
            border-radius: 10px;
            background: #f8f9fa;
            border-left: 5px solid #667eea;
        }
        .section h2 {
            font-size: 20px;
            margin: 0 0 20px 0;
            color: #667eea;
            font-weight: 600;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .info-item {
            margin: 10px 0;
            display: flex;
            align-items: center;
        }
        .info-label {
            font-weight: 600;
            color: #333;
            min-width: 120px;
            margin-right: 10px;
        }
        .info-value {
            color: #555;
            flex: 1;
        }
        .address-item {
            grid-column: 1 / -1;
        }
        .footer {
            background: #2c3e50;
            color: white;
            padding: 30px;
            text-align: center;
        }
        .footer p {
            margin: 5px 0;
            font-size: 12px;
        }
        .validation {
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            color: white;
            padding: 15px;
            text-align: center;
            font-weight: bold;
            border-radius: 5px;
            margin-top: 20px;
        }
        @media print {
            body { 
                background: white; 
                padding: 0;
            }
            .container {
                box-shadow: none;
                border-radius: 0;
            }
            .section {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>STUDENT REGISTRATION DETAILS</h1>
            <p>EduTrack Student Management System | Professional Student Management Solution</p>
        </div>

        <div class="reg-number">
            🎓 REGISTRATION NUMBER: ${registrationNumber}
        </div>

        <div class="section">
            <h2>📚 STUDENT INFORMATION</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Full Name:</span>
                    <span class="info-value">${student.first_name} ${student.last_name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Date of Birth:</span>
                    <span class="info-value">${student.date_of_birth}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Gender:</span>
                    <span class="info-value">${student.gender.charAt(0).toUpperCase() + student.gender.slice(1)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Religion:</span>
                    <span class="info-value">${student.religion}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Nationality:</span>
                    <span class="info-value">${student.nationality}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Student ID:</span>
                    <span class="info-value">#${student.id}</span>
                </div>
                <div class="info-item address-item">
                    <span class="info-label">Address:</span>
                    <span class="info-value">${student.address}</span>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>👨‍👩‍👧‍👦 PARENT/GUARDIAN INFORMATION</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Parent Type:</span>
                    <span class="info-value">${student.parent_type ? student.parent_type.charAt(0).toUpperCase() + student.parent_type.slice(1) : 'Not provided'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Parent Name:</span>
                    <span class="info-value">${student.parent_name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Parent Phone:</span>
                    <span class="info-value">${student.parent_phone}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Parent Gender:</span>
                    <span class="info-value">${student.parent_gender.charAt(0).toUpperCase() + student.parent_gender.slice(1)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Parent Email:</span>
                    <span class="info-value">${student.parent_email || 'Not provided'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Parent Religion:</span>
                    <span class="info-value">${student.parent_religion}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Parent Nationality:</span>
                    <span class="info-value">${student.parent_nationality}</span>
                </div>
                <div class="info-item address-item">
                    <span class="info-label">Parent Address:</span>
                    <span class="info-value">${student.parent_address}</span>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>📅 REGISTRATION INFORMATION</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Registration Date:</span>
                    <span class="info-value">${student.created_at ? new Date(student.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Recently'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">System Version:</span>
                    <span class="info-value">EduTrack Pro v2.0.0</span>
                </div>
            </div>
        </div>

        <div class="footer">
            <p><strong>🔐 VALID DOCUMENT FOR OFFICIAL USE</strong></p>
            <p>This document is electronically generated by EduTrack Student Management System</p>
            <p>Generated on: ${new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            <p>© 2024 EduTrack. All rights reserved. | www.edutrack.com | support@edutrack.com</p>
            <p>Authentication Code: EDU-${student.id}-${Date.now()}</p>
        </div>
    </div>
</body>
</html>
    `;

    // Create blob and download as HTML file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${studentName}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // Also open in new window for immediate viewing and printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Auto-trigger print dialog for PDF option
        setTimeout(() => {
            printWindow.print();
        }, 1000);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      // First try to get demo students from localStorage
      const demoStudents = JSON.parse(localStorage.getItem('demoStudents') || '[]');
      
      if (demoStudents.length > 0) {
        setStudents(demoStudents);
        setLoading(false);
        return;
      }
      
      // If no demo students, try backend
      const response = await fetch('http://localhost:5000/api/students');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStudents(result.data);
        } else {
          // Start with empty array
          setStudents([]);
        }
      } else {
        // Start with empty array
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      // Start with empty array
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
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #1e293b 75%, #0f172a 100%)',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '0',
      position: 'relative',
      boxSizing: 'border-box',
      width: '100%',
      height: '100%',
      overflow: 'auto'
    }}>
      {/* Developer Grid Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        opacity: '0.5'
      }} />
      
      {/* Floating Background Elements */}
      <div style={{
        position: 'absolute',
        top: '15%',
        right: '10%',
        width: '180px',
        height: '180px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
        borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '25%',
        left: '8%',
        width: '120px',
        height: '120px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
        borderRadius: '50%'
      }} />
      
      <div style={{ 
        width: '100%',
        height: '100%',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 50%, rgba(15, 23, 42, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '40px 90px',
          marginBottom: '30px',
          textAlign: 'center',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 100px rgba(99, 102, 241, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          boxSizing: 'border-box',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Header Glow Effect */}
          <div style={{
            position: 'absolute',
            top: '-2px',
            left: '-2px',
            right: '-2px',
            bottom: '-2px',
            background: 'linear-gradient(45deg, #6366f1, #8b5cf6, #3b82f6, #6366f1)',
            borderRadius: '24px',
            zIndex: '-1',
            opacity: '0.6',
            filter: 'blur(8px)'
          }} />
          
          <div>
            <h1 style={{
              fontSize: '3.5rem',
              fontWeight: '800',
              margin: '0 0 15px 0',
              letterSpacing: '-1px',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              backgroundColor: 'transparent',
              textShadow: '0 0 30px rgba(99, 102, 241, 0.5)'
            }}>
              Registered Students
            </h1>
            <p style={{
              color: '#e2e8f0',
              fontSize: '1.2rem',
              margin: '0',
              opacity: 0.9
            }}>
              Total Students: {students.length}
            </p>
          </div>
          {students.length > 0 && (
            <button
              onClick={clearAllStudents}
              style={{
                padding: '15px 30px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                position: 'fixed',
                bottom: '30px',
                right: '50px',
                zIndex: '1000'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(239, 68, 68, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(239, 68, 68, 0.3)';
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>🗑️</span>
              Clear All
            </button>
          )}
        </div>

        {/* Students Grid */}
        {students.length === 0 ? (
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 50%, rgba(15, 23, 42, 0.9) 100%)',
            backdropFilter: 'blur(20px)',
            padding: '140px 200px',
            borderRadius: '24px',
            textAlign: 'center',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 100px rgba(99, 102, 241, 0.2)',
            width: '100%',
            boxSizing: 'border-box',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Empty State Glow Effect */}
            <div style={{
              position: 'absolute',
              top: '-2px',
              left: '-2px',
              right: '-2px',
              bottom: '-2px',
              background: 'linear-gradient(45deg, #6366f1, #8b5cf6, #3b82f6, #6366f1)',
              borderRadius: '24px',
              zIndex: '-1',
              opacity: '0.4',
              filter: 'blur(8px)'
            }} />
            <div style={{ 
              fontSize: '6rem', 
              marginBottom: '30px',
              filter: 'drop-shadow(0 0 30px rgba(99, 102, 241, 0.6))'
            }}>📚</div>
            <h2 style={{ 
              fontSize: '2.5rem', 
              margin: '0 0 15px 0',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: '700',
              backgroundImage: 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)',
              backgroundColor: 'transparent',
              textShadow: '0 0 20px rgba(99, 102, 241, 0.3)'
            }}>
              No Students Yet
            </h2>
            <p style={{ 
              fontSize: '1.2rem', 
              margin: '0',
              color: '#e2e8f0',
              fontWeight: '500',
              opacity: 0.8
            }}>
              Start by registering your first student!
            </p>
            <button
              onClick={() => {/* This would need to be passed as prop */}}
              style={{
                marginTop: '30px',
                padding: '15px 35px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(99, 102, 241, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(99, 102, 241, 0.3)';
              }}
            >
              Register First Student
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: '50px',
            width: '100%'
          }}>
            {students.map((student, index) => (
              <div
                key={student.id}
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 50%, rgba(15, 23, 42, 0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '24px',
                  padding: '30px',
                  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 80px rgba(99, 102, 241, 0.2)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  transition: 'all 0.4s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 30px 60px rgba(0, 0, 0, 0.6), 0 0 100px rgba(99, 102, 241, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
                  e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
                }}
              >
                {/* Background Gradient */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                  opacity: '0.5'
                }} />

                {/* Registration Number Badge */}
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  padding: '10px 18px',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  fontFamily: 'monospace',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  zIndex: '1'
                }}>
                  {generateRegistrationNumber(student)}
                </div>

                {/* Student Info */}
                <div style={{ marginBottom: '25px', position: 'relative', zIndex: '1' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    marginBottom: '15px'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.8rem',
                      boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)'
                    }}>
                      {student.gender === 'male' ? '👦' : student.gender === 'female' ? '👧' : '👤'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        color: '#f1f5f9',
                        fontSize: '1.8rem',
                        fontWeight: '700',
                        margin: '0 0 5px 0',
                        letterSpacing: '-0.5px'
                      }}>
                        {student.first_name} {student.last_name}
                      </h3>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        color: '#94a3b8',
                        fontSize: '0.95rem'
                      }}>
                        <span>🎂 {student.date_of_birth}</span>
                        <span>🌍 {student.nationality}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parent Info */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.6) 100%)',
                  padding: '20px',
                  borderRadius: '16px',
                  marginBottom: '20px',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  position: 'relative',
                  zIndex: '1'
                }}>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#64748b',
                    marginBottom: '8px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {student.parent_type.charAt(0).toUpperCase() + student.parent_type.slice(1)}
                  </div>
                  <div style={{
                    color: '#e2e8f0',
                    fontWeight: '600',
                    fontSize: '1.1rem',
                    marginBottom: '8px'
                  }}>
                    {student.parent_name}
                  </div>
                  <div style={{
                    color: '#94a3b8',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>📞</span>
                    <span>{student.parent_phone}</span>
                  </div>
                </div>

                {/* Footer */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: '#64748b',
                  fontSize: '0.85rem',
                  position: 'relative',
                  zIndex: '1'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      background: '#10b981',
                      borderRadius: '50%',
                      boxShadow: '0 0 8px #10b981'
                    }} />
                    <span>Active</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ fontSize: '0.75rem', opacity: '0.7' }}>
                      ID: #{student.id}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEditStudent(student)}
                        style={{
                          padding: '6px 12px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(student)}
                        style={{
                          padding: '6px 12px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                        }}
                      >
                        📄 Download
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        style={{
                          padding: '6px 12px',
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '2000'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{
              color: '#f1f5f9',
              fontSize: '1.8rem',
              fontWeight: '700',
              margin: '0 0 30px 0',
              textAlign: 'center'
            }}>
              Edit Student Information
            </h2>
            
            <div style={{ display: 'grid', gap: '20px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
              {/* Student Details Section */}
              <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <h3 style={{ color: '#6366f1', fontSize: '1.1rem', fontWeight: '700', margin: '0 0 15px 0' }}>Student Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editingStudent.first_name}
                      onChange={(e) => setEditingStudent({...editingStudent, first_name: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editingStudent.last_name}
                      onChange={(e) => setEditingStudent({...editingStudent, last_name: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={editingStudent.date_of_birth}
                      onChange={(e) => setEditingStudent({...editingStudent, date_of_birth: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                      Gender
                    </label>
                    <select
                      value={editingStudent.gender}
                      onChange={(e) => setEditingStudent({...editingStudent, gender: e.target.value as 'male' | 'female' | 'other'})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                      Religion
                    </label>
                    <input
                      type="text"
                      value={editingStudent.religion}
                      onChange={(e) => setEditingStudent({...editingStudent, religion: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                      Nationality
                    </label>
                    <input
                      type="text"
                      value={editingStudent.nationality}
                      onChange={(e) => setEditingStudent({...editingStudent, nationality: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </div>
                
                <div style={{ marginTop: '15px' }}>
                  <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                    Address
                  </label>
                  <textarea
                    value={editingStudent.address}
                    onChange={(e) => setEditingStudent({...editingStudent, address: e.target.value})}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '6px',
                      color: '#e2e8f0',
                      fontSize: '0.9rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              {/* Parent/Guardian Details Section */}
              <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <h3 style={{ color: '#8b5cf6', fontSize: '1.1rem', fontWeight: '700', margin: '0 0 15px 0' }}>Parent/Guardian Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                      Parent Type
                    </label>
                    <select
                      value={editingStudent.parent_type}
                      onChange={(e) => setEditingStudent({...editingStudent, parent_type: e.target.value as 'father' | 'mother' | 'guardian'})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value="father">Father</option>
                      <option value="mother">Mother</option>
                      <option value="guardian">Guardian</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                      Parent Name
                    </label>
                    <input
                      type="text"
                      value={editingStudent.parent_name}
                      onChange={(e) => setEditingStudent({...editingStudent, parent_name: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                      Parent Phone
                    </label>
                    <input
                      type="text"
                      value={editingStudent.parent_phone}
                      onChange={(e) => setEditingStudent({...editingStudent, parent_phone: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                      Parent Gender
                    </label>
                    <select
                      value={editingStudent.parent_gender}
                      onChange={(e) => setEditingStudent({...editingStudent, parent_gender: e.target.value as 'male' | 'female' | 'other'})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                      Parent Email
                    </label>
                    <input
                      type="email"
                      value={editingStudent.parent_email || ''}
                      onChange={(e) => setEditingStudent({...editingStudent, parent_email: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                      Parent Religion
                    </label>
                    <input
                      type="text"
                      value={editingStudent.parent_religion}
                      onChange={(e) => setEditingStudent({...editingStudent, parent_religion: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                      Parent Nationality
                    </label>
                    <input
                      type="text"
                      value={editingStudent.parent_nationality}
                      onChange={(e) => setEditingStudent({...editingStudent, parent_nationality: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </div>
                
                <div style={{ marginTop: '15px' }}>
                  <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                    Parent Address
                  </label>
                  <textarea
                    value={editingStudent.parent_address}
                    onChange={(e) => setEditingStudent({...editingStudent, parent_address: e.target.value})}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '6px',
                      color: '#e2e8f0',
                      fontSize: '0.9rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '15px', marginTop: '30px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingStudent(null);
                }}
                style={{
                  padding: '12px 25px',
                  background: 'rgba(148, 163, 184, 0.2)',
                  color: '#94a3b8',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStudent(editingStudent)}
                style={{
                  padding: '12px 25px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '2000'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '400px',
            width: '90%',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 25px',
              fontSize: '2rem',
              color: 'white',
              boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)'
            }}>
              ⚠️
            </div>
            
            <h2 style={{
              color: '#f1f5f9',
              fontSize: '1.5rem',
              fontWeight: '700',
              margin: '0 0 15px 0'
            }}>
              Delete Student
            </h2>
            
            <p style={{
              color: '#94a3b8',
              fontSize: '1rem',
              margin: '0 0 30px 0',
              lineHeight: '1.5'
            }}>
              Are you sure you want to delete this student? This action cannot be undone.
            </p>
            
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingStudentId(null);
                }}
                style={{
                  padding: '12px 25px',
                  background: 'rgba(148, 163, 184, 0.2)',
                  color: '#94a3b8',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: '12px 25px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
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
      `}</style>
    </div>
  );
};

export default StudentList;
