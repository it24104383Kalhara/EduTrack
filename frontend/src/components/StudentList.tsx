import React, { useState, useEffect } from 'react';

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

const StudentList: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const clearAllStudents = () => {
    if (confirm('Are you sure you want to delete all students? This action cannot be undone.')) {
      setStudents([]);
      localStorage.removeItem('students');
    }
  };

  const fetchStudents = () => {
    // Get students from localStorage
    const savedStudents = JSON.parse(localStorage.getItem('students') || '[]');
    setStudents(savedStudents);
    setLoading(false);
  };

  const generateRegistrationNumber = (student: Student) => {
    return `EDU${student.id.toString().padStart(4, '0')}${new Date().getFullYear()}`;
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setShowEditModal(true);
  };

  const handleViewStudent = (student: Student) => {
    setViewingStudent(student);
    setShowViewModal(true);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const updatedStudents = students.map((s: Student) => 
      s.id === updatedStudent.id ? updatedStudent : s
    );
    localStorage.setItem('students', JSON.stringify(updatedStudents));
    setStudents(updatedStudents);
    setShowEditModal(false);
    setEditingStudent(null);
  };

  const handleDeleteStudent = (studentId: number) => {
    // TODO: Implement delete confirmation
    if (confirm('Are you sure you want to delete this student?')) {
      const students = JSON.parse(localStorage.getItem('students') || '[]');
      const updatedStudents = students.filter((s: Student) => s.id !== studentId);
      localStorage.setItem('students', JSON.stringify(updatedStudents));
      setStudents(updatedStudents);
    }
  };

  const handleDownloadPDF = (student: Student) => {
    // Create a beautiful HTML document for PDF
    const pdfContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Registration Details - ${student.first_name} ${student.last_name}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%);
            min-height: 100vh;
        }
        
        .page-wrapper {
            max-width: 900px;
            margin: 0 auto;
            padding: 60px 40px;
            background: white;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
            border-radius: 20px;
            position: relative;
            overflow: hidden;
        }
        
        .page-wrapper::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #6366f1 100%);
            border-radius: 20px 20px 0 0;
        }
        
        .header {
            text-align: center;
            padding: 40px 0;
            margin-bottom: 40px;
            position: relative;
        }
        
        .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 100px;
            height: 3px;
            background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
            border-radius: 2px;
        }
        
        .header h1 {
            color: #1e293b;
            font-size: 36px;
            font-weight: 800;
            margin-bottom: 16px;
            letter-spacing: -0.5px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .registration-badge {
            display: inline-block;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 50px;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 20px;
            box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
            letter-spacing: 0.5px;
        }
        
        .meta-info {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin-bottom: 20px;
        }
        
        .meta-item {
            text-align: center;
        }
        
        .meta-label {
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        
        .meta-value {
            font-size: 18px;
            color: #1e293b;
            font-weight: 600;
        }
        
        .section {
            margin-bottom: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 16px;
            border: 1px solid rgba(99, 102, 241, 0.1);
            position: relative;
        }
        
        .section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
            border-radius: 16px 16px 0 0;
        }
        
        .section-title {
            color: #1e293b;
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .section-icon {
            font-size: 28px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }
        
        .info-item {
            background: white;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
        }
        
        .info-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }
        
        .info-label {
            font-size: 13px;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        
        .info-value {
            font-size: 16px;
            color: #1e293b;
            font-weight: 500;
            line-height: 1.5;
        }
        
        .footer {
            text-align: center;
            margin-top: 50px;
            padding: 30px;
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            border-radius: 16px;
            color: white;
        }
        
        .footer p {
            margin: 8px 0;
            font-size: 14px;
            opacity: 0.9;
        }
        
        .footer strong {
            font-weight: 600;
            color: #f1f5f9;
        }
        
        @media print {
            body { 
                background: white; 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .page-wrapper { 
                box-shadow: none; 
                border: 1px solid #e2e8f0;
            }
        }
    </style>
</head>
<body>
    <div class="page-wrapper">
        <div class="header">
            <h1>Student Registration Details</h1>
            <div class="registration-badge">Registration Number: ${generateRegistrationNumber(student)}</div>
            <div class="meta-info">
                <div class="meta-item">
                    <div class="meta-label">Student ID</div>
                    <div class="meta-value">#${student.id}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Generated</div>
                    <div class="meta-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">
                <span class="section-icon">👤</span>
                Personal Information
            </div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Full Name</div>
                    <div class="info-value">${student.first_name} ${student.last_name}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Date of Birth</div>
                    <div class="info-value">${student.date_of_birth}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Gender</div>
                    <div class="info-value">${student.gender}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Religion</div>
                    <div class="info-value">${student.religion}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Ethnicity</div>
                    <div class="info-value">${student.ethnicity}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Nationality</div>
                    <div class="info-value">${student.nationality}</div>
                </div>
                <div class="info-item" style="grid-column: 1 / -1;">
                    <div class="info-label">Address</div>
                    <div class="info-value">${student.address}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">
                <span class="section-icon">👨‍👩‍👧‍👦</span>
                Parent/Guardian Information
            </div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Parent Type</div>
                    <div class="info-value" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; font-weight: 600; padding: 12px 16px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px;">${student.parent_type.charAt(0).toUpperCase() + student.parent_type.slice(1)}</div>
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
                    <div class="info-label">Parent Gender</div>
                    <div class="info-value">${student.parent_gender}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Parent Religion</div>
                    <div class="info-value">${student.parent_religion}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Parent Ethnicity</div>
                    <div class="info-value">${student.parent_ethnicity}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Parent Nationality</div>
                    <div class="info-value">${student.parent_nationality}</div>
                </div>
                <div class="info-item" style="grid-column: 1 / -1;">
                    <div class="info-label">Parent Address</div>
                    <div class="info-value">${student.parent_address}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">
                <span class="section-icon">📋</span>
                Registration Details
            </div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Registration Date</div>
                    <div class="info-value">${student.created_at ? new Date(student.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Status</div>
                    <div class="info-value" style="color: #059669; font-weight: 600;">✅ Active</div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p><strong>Edu Track Management System</strong></p>
            <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <p>© 2024 Edu Track - Empowering Education Management</p>
        </div>
    </div>
</body>
</html>
    `;

    // Create a new window and print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(pdfContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #1e293b 75%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
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
      minWidth: 0,
      height: '100%',
      overflowX: 'hidden',
      overflowY: 'auto'
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
        boxSizing: 'border-box',
        padding: '40px'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 50%, rgba(15, 23, 42, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '25px 40px',
          marginBottom: '25px',
          textAlign: 'center',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4), 0 0 60px rgba(99, 102, 241, 0.15)',
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
            borderRadius: '20px',
            zIndex: '-1',
            opacity: '0.6',
            filter: 'blur(8px)'
          }} />
          
          <div>
            <h1 style={{
              fontSize: '1.8rem',
              fontWeight: '800',
              margin: '0 0 8px 0',
              color: '#f1f5f9',
              letterSpacing: '-0.5px',
              textShadow: '0 0 20px rgba(99, 102, 241, 0.3)'
            }}>
              📋 Student Management
            </h1>
            <p style={{
              fontSize: '0.95rem',
              margin: '0',
              color: '#94a3b8',
              fontWeight: '500'
            }}>
              View and manage registered students
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <div style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#e2e8f0',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              Total: {students.length} Students
            </div>
            {students.length > 0 && (
              <button
                onClick={clearAllStudents}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
                  borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.3) 100%)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                🗑️ Clear All
              </button>
            )}
          </div>
        </div>

        {/* Student Cards */}
        {students.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 50%, rgba(15, 23, 42, 0.9) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4), 0 0 60px rgba(99, 102, 241, 0.15)'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '20px',
              opacity: 0.7
            }}>📚</div>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: '800',
              margin: '0 0 8px 0',
              color: '#f1f5f9',
              letterSpacing: '-0.5px',
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
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            width: '100%',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            {students.map((student, index) => (
              <div
                key={student.id}
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 50%, rgba(15, 23, 42, 0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '18px',
                  padding: '20px',
                  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4), 0 0 60px rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 80px rgba(99, 102, 241, 0.25)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.4), 0 0 60px rgba(99, 102, 241, 0.15)';
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
                  top: '15px',
                  right: '15px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  fontFamily: 'monospace',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  zIndex: '1'
                }}>
                  {generateRegistrationNumber(student)}
                </div>

                {/* Student Info */}
                <div style={{ marginBottom: '18px', position: 'relative', zIndex: '1' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      width: '45px',
                      height: '45px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem',
                      boxShadow: '0 6px 20px rgba(99, 102, 241, 0.3)'
                    }}>
                      {student.gender === 'male' ? '👦' : student.gender === 'female' ? '👧' : '👤'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        color: '#f1f5f9',
                        fontSize: '1.2rem',
                        fontWeight: '700',
                        margin: '0 0 4px 0',
                        letterSpacing: '-0.3px'
                      }}>
                        {student.first_name} {student.last_name}
                      </h3>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: '#94a3b8',
                        fontSize: '0.75rem'
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
                  padding: '15px',
                  borderRadius: '12px',
                  marginBottom: '15px',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  position: 'relative',
                  zIndex: '1'
                }}>
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#64748b',
                    marginBottom: '6px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {student.parent_type.charAt(0).toUpperCase() + student.parent_type.slice(1)}
                  </div>
                  <div style={{
                    color: '#e2e8f0',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    marginBottom: '6px'
                  }}>
                    {student.parent_name}
                  </div>
                  <div style={{
                    color: '#94a3b8',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
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
                  fontSize: '0.7rem',
                  position: 'relative',
                  zIndex: '1'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📅</span>
                    <span>{student.created_at ? new Date(student.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'Recently'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🆔</span>
                    <span>#{student.id}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '15px',
                  position: 'relative',
                  zIndex: '1'
                }}>
                  <button
                    onClick={() => handleEditStudent(student)}
                    style={{
                      padding: '6px 12px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.7rem',
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
                    onClick={() => handleViewStudent(student)}
                    style={{
                      padding: '6px 12px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.7rem',
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
                    👁️ Read
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(student)}
                    style={{
                      padding: '6px 12px',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                    }}
                  >
                    📄 PDF
                  </button>
                  <button
                    onClick={() => handleDeleteStudent(student.id)}
                    style={{
                      padding: '6px 12px',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.7rem',
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
          zIndex: 2000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '20px',
            maxWidth: '500px',
            width: '85%',
            maxHeight: '70vh',
            overflowY: 'auto',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{
              color: '#f1f5f9',
              fontSize: '1.2rem',
              fontWeight: '700',
              margin: '0 0 15px 0',
              textAlign: 'center'
            }}>
              Edit Student
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                  First Name
                </label>
                <input
                  type="text"
                  value={editingStudent.first_name}
                  onChange={(e) => setEditingStudent({...editingStudent, first_name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
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
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
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
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
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
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
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
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                    Ethnicity
                  </label>
                  <input
                    type="text"
                    value={editingStudent.ethnicity}
                    onChange={(e) => setEditingStudent({...editingStudent, ethnicity: e.target.value})}
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

              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
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

              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
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

              {/* Parent/Guardian Details */}
              <h3 style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: '700', margin: '20px 0 15px 0' }}>
                Parent/Guardian Details
              </h3>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
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
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
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
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
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
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
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
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
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
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
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
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                    Parent Ethnicity
                  </label>
                  <input
                    type="text"
                    value={editingStudent.parent_ethnicity}
                    onChange={(e) => setEditingStudent({...editingStudent, parent_ethnicity: e.target.value})}
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
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
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

              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600', marginBottom: '5px', display: 'block' }}>
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
            
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingStudent(null);
                }}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(148, 163, 184, 0.2)',
                  color: '#94a3b8',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStudent(editingStudent)}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Student Details Modal */}
      {showViewModal && viewingStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '85vh',
            overflowY: 'auto',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{
              color: '#f1f5f9',
              fontSize: '1.5rem',
              fontWeight: '700',
              margin: '0 0 20px 0',
              textAlign: 'center'
            }}>
              Student Details
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Student Information */}
              <div style={{
                background: 'rgba(99, 102, 241, 0.1)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid rgba(99, 102, 241, 0.2)'
              }}>
                <h3 style={{
                  color: '#f1f5f9',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  margin: '0 0 15px 0'
                }}>
                  👤 Personal Information
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>
                      <strong>Full Name:</strong> {viewingStudent.first_name} {viewingStudent.last_name}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>
                      <strong>Date of Birth:</strong> {viewingStudent.date_of_birth}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>
                      <strong>Gender:</strong> {viewingStudent.gender}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>
                      <strong>Religion:</strong> {viewingStudent.religion}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>
                      <strong>Ethnicity:</strong> {viewingStudent.ethnicity}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>
                      <strong>Nationality:</strong> {viewingStudent.nationality}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>
                      <strong>Address:</strong> {viewingStudent.address}
                    </p>
                  </div>
                  
                  <div>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>
                      <strong>Registration Number:</strong> {generateRegistrationNumber(viewingStudent)}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>
                      <strong>Student ID:</strong> #{viewingStudent.id}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>
                      <strong>Registration Date:</strong> {viewingStudent.created_at ? new Date(viewingStudent.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Recently'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Parent/Guardian Information */}
              <div style={{
                background: 'rgba(139, 92, 246, 0.1)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid rgba(139, 92, 246, 0.2)'
              }}>
                <h3 style={{
                  color: '#f1f5f9',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  margin: '0 0 15px 0'
                }}>
                  👨‍👩‍👧‍👦 Parent/Guardian Information
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>
                      <strong>Parent Type:</strong> {viewingStudent.parent_type.charAt(0).toUpperCase() + viewingStudent.parent_type.slice(1)}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>
                      <strong>Parent Name:</strong> {viewingStudent.parent_name}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>
                      <strong>Parent Phone:</strong> {viewingStudent.parent_phone}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>
                      <strong>Parent Email:</strong> {viewingStudent.parent_email || 'Not provided'}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>
                      <strong>Parent Gender:</strong> {viewingStudent.parent_gender}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>
                      <strong>Parent Religion:</strong> {viewingStudent.parent_religion}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>
                      <strong>Parent Ethnicity:</strong> {viewingStudent.parent_ethnicity}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>
                      <strong>Parent Nationality:</strong> {viewingStudent.parent_nationality}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>
                      <strong>Parent Address:</strong> {viewingStudent.parent_address}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingStudent(null);
                }}
                style={{
                  padding: '15px 30px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
