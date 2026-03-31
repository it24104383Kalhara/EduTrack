import React, { useState, useEffect } from 'react';
import { studentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Student {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other' | '';
  religion: string;
  ethnicity: string;
  address: string;
  nationality: string;
  parent_type: 'father' | 'mother' | 'guardian' | '';
  parent_name: string;
  parent_phone: string;
  parent_address: string;
  parent_gender: 'male' | 'female' | 'other' | '';
  parent_email: string;
  parent_religion: string;
  parent_ethnicity: string;
  parent_nationality: string;
}

const StudentRegistrationForm: React.FC = () => {
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
            Hello, <strong>{user?.username}</strong>! This module is reserved for administrators, but you can continue using your dashboard and academic tools from the sidebar.
          </p>
          <div style={{ marginTop: '32px', background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#633194' }}></div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Role: {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1)} Access</span>
          </div>
        </div>
      </div>
    );
  }

  const [formData, setFormData] = useState<Student>({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    religion: '',
    ethnicity: '',
    address: '',
    nationality: '',
    parent_type: '',
    parent_name: '',
    parent_phone: '',
    parent_address: '',
    parent_gender: '',
    parent_email: '',
    parent_religion: '',
    parent_ethnicity: '',
    parent_nationality: ''
  });

  const [registration, setRegistration] = useState<{
    success: boolean;
    registrationNumber?: string;
    studentName?: string;
    message?: string;
  } | null>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Parse 'YYYY-MM-DD' or 'YYYY.MM.DD' in local time to avoid UTC off-by-one bug
  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date();

    // Handle both YYYY-MM-DD and YYYY.MM.DD formats
    let [year, month, day] = dateStr.includes('.')
      ? dateStr.split('.').map(Number)
      : dateStr.split('-').map(Number);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return new Date();
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for phone number - only allow exactly 10 digits
    if (name === 'parent_phone') {
      const onlyNums = value.replace(/[^0-9]/g, '').slice(0, 10);
      setFormData(prev => ({
        ...prev,
        [name]: onlyNums
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (step1Error) setStep1Error(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Final validation check for phone number - must be exactly 10 digits
    if (!/^\d{10}$/.test(formData.parent_phone)) {
      setNotification({ message: 'Parent phone number must be exactly 10 digits.', type: 'error' });
      return;
    }

    // Email validation
    if (formData.parent_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parent_email)) {
      setNotification({ message: 'Please enter a valid email address (e.g., parent@example.com).', type: 'error' });
      return;
    }

    // Birthday validation (2006-12-31 to 2016-01-31)
    if (formData.date_of_birth) {
      const dob = new Date(formData.date_of_birth);
      const minDob = new Date('2006-12-31');
      const maxDob = new Date('2016-01-31');

      if (dob < minDob || dob > maxDob) {
        setNotification({ 
          message: 'Registration Denied: Student must be born between Dec 31, 2006 and Jan 31, 2016.', 
          type: 'error' 
        });
        return;
      }
    }

    try {
      const newStudent = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender as 'male' | 'female' | 'other',
        religion: formData.religion,
        ethnicity: formData.ethnicity,
        address: formData.address,
        nationality: formData.nationality,
        parent_type: formData.parent_type as 'father' | 'mother' | 'guardian',
        parent_name: formData.parent_name,
        parent_phone: formData.parent_phone,
        parent_address: formData.parent_address,
        parent_gender: formData.parent_gender as 'male' | 'female' | 'other',
        parent_email: formData.parent_email,
        parent_religion: formData.parent_religion,
        parent_ethnicity: formData.parent_ethnicity,
        parent_nationality: formData.parent_nationality
      };

      console.log('Student data being sent:', JSON.stringify(newStudent, null, 2));
      setIsSubmitting(true);

      const createdStudent = await studentApi.create(newStudent);

      const registrationNumber = `EDU-${new Date().getFullYear()}-${String(createdStudent.id).toString().padStart(6, '0')}`;
      const studentName = `${formData.first_name} ${formData.last_name}`;

      setRegistration({
        success: true,
        registrationNumber: registrationNumber,
        studentName: studentName,
        message: 'Student registered successfully!'
      });
      setIsSubmitting(false);
      setCurrentStep(1);

      setFormData({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: '',
        religion: '',
        ethnicity: '',
        address: '',
        nationality: '',
        parent_type: '',
        parent_name: '',
        parent_phone: '',
        parent_address: '',
        parent_gender: '',
        parent_email: '',
        parent_religion: '',
        parent_ethnicity: '',
        parent_nationality: ''
      });

    } catch (error) {
      console.error('Error submitting form:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // If the backend specifies exactly what failed (like age), show it directly
      const displayMessage = errorMessage || 'Failed to register student';

      setRegistration({
        success: false,
        message: displayMessage
      });
      setIsSubmitting(false);
    }
  };

  const validateStep1 = () => {
    const requiredFields = ['first_name', 'last_name', 'date_of_birth', 'gender', 'religion', 'ethnicity', 'address', 'nationality'];
    for (const field of requiredFields) {
      if (!formData[field as keyof Student]) return false;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      setStep1Error(null);
    } else {
      setStep1Error('Please fill in all required Student Information fields before proceeding.');
    }
  };

  const prevStep = () => {
    setCurrentStep(1);
  };

  if (registration && registration.success) {
    return (
      <div className="success-message registration-form" style={{
        maxWidth: '500px',
        margin: '50px auto',
        padding: '30px',
        background: '#F9FAFB',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(99, 49, 148, 0.1)',
        textAlign: 'center',
        fontFamily: 'Inter, sans-serif',
        border: '1px solid #E5E7EB'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          background: 'linear-gradient(135deg, #633194 0%, #4B2380 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '24px',
          color: 'white',
          boxShadow: '0 4px 15px rgba(99, 49, 148, 0.3)'
        }}>
          ✓
        </div>
        <h2 style={{ margin: '0 0 15px 0', color: '#1F2937', fontSize: '24px', fontWeight: '600' }}>Registration Successful!</h2>
        <div style={{
          background: '#F4F0FF',
          padding: '20px',
          borderRadius: '12px',
          margin: '20px 0',
          border: '1px solid #E5E7EB'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6B7280', fontWeight: '500' }}>Registration Number:</p>
          <p style={{ margin: '0', fontSize: '20px', fontWeight: '600', color: '#633194' }}>
            {registration.registrationNumber}
          </p>
        </div>
        <p style={{ margin: '10px 0', color: '#6B7280', fontSize: '16px' }}>
          Student: <strong style={{ color: '#1F2937' }}>{registration.studentName}</strong>
        </p>
        <button
          onClick={() => setRegistration(null)}
          style={{
            marginTop: '25px',
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #633194 0%, #4B2380 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 2px 8px rgba(99, 49, 148, 0.3)',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Register Another Student
        </button>
      </div>
    );
  }

  return (
    <div className="registration-form" style={{
      maxWidth: '720px',
      margin: '20px auto',
      padding: '20px',
      background: '#F9FAFB',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(99, 49, 148, 0.1)',
      fontFamily: 'Inter, sans-serif',
      border: '1px solid #E5E7EB'
    }}>
      <style>{`
        @media (max-width: 768px) {
          .registration-form {
            padding: 15px !important;
            margin: 10px !important;
          }
          .form-grid-2 {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .form-grid-3 {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .form-title {
            font-size: 20px !important;
            margin-bottom: 20px !important;
          }
          .section-title {
            font-size: 14px !important;
            margin-bottom: 10px !important;
          }
          .form-input {
            padding: 10px !important;
            font-size: 16px !important;
          }
          .submit-button {
            padding: 15px 25px !important;
            font-size: 16px !important;
            width: 100% !important;
          }
        }
        @media (max-width: 480px) {
          .registration-form {
            padding: 10px !important;
            margin: 5px !important;
          }
          .success-message {
            padding: 20px !important;
            margin: 20px 10px !important;
          }
        }
      `}</style>
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
                {notification.type === 'error' ? 'Validation Error' : 'Error'}
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

      <h1 className="form-title" style={{
        textAlign: 'center',
        margin: '0 0 20px 0',
        color: '#633194',
        fontSize: '28px',
        fontWeight: '600'
      }}>
        Student Registration Form
      </h1>

      {/* Step Indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '30px', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: currentStep >= 1 ? '#633194' : '#E5E7EB',
            color: currentStep >= 1 ? 'white' : '#6B7280',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '600', fontSize: '14px', transition: 'all 0.3s'
          }}>1</div>
          <span style={{ fontSize: '14px', fontWeight: currentStep >= 1 ? '600' : '400', color: currentStep >= 1 ? '#1F2937' : '#6B7280' }}>Student Information</span>
        </div>
        <div style={{ width: '40px', height: '2px', background: currentStep >= 2 ? '#633194' : '#E5E7EB', transition: 'all 0.3s' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: currentStep >= 2 ? '#633194' : '#E5E7EB',
            color: currentStep >= 2 ? 'white' : '#6B7280',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '600', fontSize: '14px', transition: 'all 0.3s'
          }}>2</div>
          <span style={{ fontSize: '14px', fontWeight: currentStep >= 2 ? '600' : '400', color: currentStep >= 2 ? '#1F2937' : '#6B7280' }}>Parent / Guardian</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Student Information */}
        {currentStep === 1 && (
          <div style={{ marginBottom: '25px' }}>
            <h2 className="section-title" style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '15px',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '5px'
            }}>
              Student Information
            </h2>

            <div className="form-grid-2" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px',
              marginBottom: '15px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#374151' }}>
                  First Name *
                </label>
                <input
                  className="form-input"
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#374151' }}>
                  Last Name *
                </label>
                <input
                  className="form-input"
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div className="form-grid-3" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', fontSize: '13px', color: '#374151', gap: '8px' }}>
                  Date of Birth *
                  {formData.date_of_birth && !isNaN(parseLocalDate(formData.date_of_birth).getTime()) && (() => {
                    const dob = parseLocalDate(formData.date_of_birth);
                    const diffMs = Date.now() - dob.getTime();
                    const age = diffMs >= 0 ? Math.abs(new Date(diffMs).getUTCFullYear() - 1970) : 0;
                    return (
                      <span style={{ 
                        fontSize: '11px', 
                        background: '#F4F0FF', 
                        color: '#633194', 
                        padding: '2px 8px', 
                        borderRadius: '10px', 
                        fontWeight: '700' 
                      }}>
                        {age} yrs
                      </span>
                    );
                  })()}
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    name="day"
                    value={(() => {
                      if (!formData.date_of_birth) return '';
                      const date = parseLocalDate(formData.date_of_birth);
                      return isNaN(date.getTime()) ? '' : date.getDate();
                    })()}
                    onChange={(e) => {
                      const day = e.target.value;
                      const currentDate = formData.date_of_birth ? parseLocalDate(formData.date_of_birth) : new Date();
                      const month = currentDate.getMonth();
                      const year = currentDate.getFullYear();
                      const newDate = new Date(year, month, parseInt(day));
                      const pad = (n: number) => String(n).padStart(2, '0');
                      setFormData(prev => ({
                        ...prev,
                        date_of_birth: `${newDate.getFullYear()}-${pad(newDate.getMonth() + 1)}-${pad(newDate.getDate())}`
                      }));
                    }}
                    required
                    style={{
                      flex: '1',
                      padding: '10px 8px',
                      border: '2px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: '#ffffff'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#633194';
                      e.target.style.boxShadow = '0 0 0 3px rgba(99, 49, 148, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>

                  <select
                    name="month"
                    value={(() => {
                      if (!formData.date_of_birth) return '';
                      const date = parseLocalDate(formData.date_of_birth);
                      return isNaN(date.getTime()) ? '' : date.getMonth() + 1;
                    })()}
                    onChange={(e) => {
                      const month = parseInt(e.target.value) - 1;
                      const currentDate = formData.date_of_birth ? parseLocalDate(formData.date_of_birth) : new Date();
                      const day = currentDate.getDate();
                      const year = currentDate.getFullYear();
                      const newDate = new Date(year, month, day);
                      const pad = (n: number) => String(n).padStart(2, '0');
                      setFormData(prev => ({
                        ...prev,
                        date_of_birth: `${newDate.getFullYear()}-${pad(newDate.getMonth() + 1)}-${pad(newDate.getDate())}`
                      }));
                    }}
                    required
                    style={{
                      flex: '1.5',
                      padding: '10px 8px',
                      border: '2px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: '#ffffff'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#633194';
                      e.target.style.boxShadow = '0 0 0 3px rgba(99, 49, 148, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="">Month</option>
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>

                  <select
                    name="year"
                    value={(() => {
                      if (!formData.date_of_birth) return '';
                      const date = parseLocalDate(formData.date_of_birth);
                      return isNaN(date.getTime()) ? '' : date.getFullYear();
                    })()}
                    onChange={(e) => {
                      const year = parseInt(e.target.value);
                      const currentDate = formData.date_of_birth ? parseLocalDate(formData.date_of_birth) : new Date();
                      const day = currentDate.getDate();
                      const month = currentDate.getMonth();
                      const newDate = new Date(year, month, day);
                      const pad = (n: number) => String(n).padStart(2, '0');
                      setFormData(prev => ({
                        ...prev,
                        date_of_birth: `${newDate.getFullYear()}-${pad(newDate.getMonth() + 1)}-${pad(newDate.getDate())}`
                      }));
                    }}
                    required
                    style={{
                      flex: '1.2',
                      padding: '10px 8px',
                      border: '2px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: '#ffffff'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#633194';
                      e.target.style.boxShadow = '0 0 0 3px rgba(99, 49, 148, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="">Year</option>
                    {Array.from({ length: 100 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <option key={year} value={year}>{year}</option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#374151' }}>
                  Gender *
                </label>
                <select
                  className="form-input"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#374151' }}>
                  Nationality *
                </label>
                <input
                  className="form-input"
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., American"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div className="form-grid-3" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '15px',
              marginBottom: '15px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#374151' }}>
                  Religion *
                </label>
                <input
                  className="form-input"
                  type="text"
                  name="religion"
                  value={formData.religion}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Christianity"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#374151' }}>
                  Ethnicity *
                </label>
                <input
                  className="form-input"
                  type="text"
                  name="ethnicity"
                  value={formData.ethnicity}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Asian"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#374151' }}>
                Address *
              </label>
              <textarea
                className="form-input"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
              <div style={{ flex: 1 }}>
                {step1Error && (
                  <div style={{
                    background: '#fef2f2',
                    color: '#dc2626',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: '1px solid #fee2e2'
                  }}>
                    <span style={{ fontSize: '16px' }}>⚠️</span>
                    {step1Error}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={nextStep}
                style={{
                  padding: '12px 28px',
                  background: 'linear-gradient(135deg, #633194 0%, #4B2380 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 2px 8px rgba(99, 49, 148, 0.3)',
                  transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 49, 148, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 49, 148, 0.3)';
                }}
              >
                Continue to Parent Details →
              </button>
            </div>
          </div>
        )}

        {/* Parent/Guardian Information */}
        {currentStep === 2 && (
          <div style={{ marginBottom: '25px' }}>
            <h2 className="section-title" style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '15px',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '5px'
            }}>
              Parent/Guardian Information
            </h2>

            <div className="form-grid-2" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#374151' }}>
                  Parent Type *
                </label>
                <select
                  className="form-input"
                  name="parent_type"
                  value={formData.parent_type}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select type</option>
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="guardian">Guardian</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#374151' }}>
                  Parent Name *
                </label>
                <input
                  className="form-input"
                  type="text"
                  name="parent_name"
                  value={formData.parent_name}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div className="form-grid-3" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '15px',
              marginBottom: '15px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#374151' }}>
                  Parent Phone *
                </label>
                <input
                  className="form-input"
                  type="tel"
                  name="parent_phone"
                  value={formData.parent_phone}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#374151' }}>
                  Parent Email
                </label>
                <input
                  className="form-input"
                  type="email"
                  name="parent_email"
                  value={formData.parent_email}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#374151' }}>
                  Parent Gender *
                </label>
                <select
                  className="form-input"
                  name="parent_gender"
                  value={formData.parent_gender}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            <div className="form-grid-3" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '15px',
              marginBottom: '15px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#374151' }}>
                  Parent Religion *
                </label>
                <input
                  className="form-input"
                  type="text"
                  name="parent_religion"
                  value={formData.parent_religion}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#374151' }}>
                  Parent Ethnicity *
                </label>
                <input
                  className="form-input"
                  type="text"
                  name="parent_ethnicity"
                  value={formData.parent_ethnicity}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#374151' }}>
                  Parent Nationality *
                </label>
                <input
                  className="form-input"
                  type="text"
                  name="parent_nationality"
                  value={formData.parent_nationality}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#374151' }}>
                Parent Address *
              </label>
              <textarea
                className="form-input"
                name="parent_address"
                value={formData.parent_address}
                onChange={handleInputChange}
                required
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        )}

        {registration && !registration.success && (
          <div style={{
            background: '#fef2f2',
            color: '#dc2626',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '15px',
            fontSize: '14px'
          }}>
            {registration.message}
          </div>
        )}

        {currentStep === 2 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
            <button
              type="button"
              onClick={prevStep}
              style={{
                padding: '8px 18px',
                background: '#F3F4F6',
                color: '#4B5563',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#E5E7EB';
                e.currentTarget.style.color = '#1F2937';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#F3F4F6';
                e.currentTarget.style.color = '#4B5563';
              }}
            >
              ← Back
            </button>
            <button
              className="submit-button"
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 24px',
                background: isSubmitting ? '#9CA3AF' : 'linear-gradient(135deg, #633194 0%, #4B2380 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                boxShadow: isSubmitting ? 'none' : '0 2px 8px rgba(99, 49, 148, 0.2)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 49, 148, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 49, 148, 0.3)';
                }
              }}
            >
              {isSubmitting ? 'Registering...' : 'Register Student ✓'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default StudentRegistrationForm;
