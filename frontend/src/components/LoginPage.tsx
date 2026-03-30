import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../services/api';

const LoginPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('female');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthday, setBirthday] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (isForgotPassword) {
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, newPassword: password }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setSuccessMsg(data.message || 'Password reset successful!');
          setIsForgotPassword(false);
          setUsername('');
          setPassword('');
          setConfirmPassword('');
        } else {
          setError(data.message || 'Password reset failed.');
        }
      } else if (isRegister) {
        // Phone number validation: Allow digits, +, -, and spaces, but must be exactly 10 digits
        const phoneRegex = /^[0-9+\-\s]+$/;
        const digitCount = (phoneNumber.match(/\d/g) || []).length;

        if (phoneNumber && !phoneRegex.test(phoneNumber)) {
          setError('Please enter a valid phone number (numeric characters only).');
          setIsLoading(false);
          return;
        }

        if (phoneNumber && digitCount !== 10) {
          setError('Phone number must be exactly 10 digits.');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            username, 
            email, 
            password, 
            role: 'teacher',
            first_name: firstName,
            last_name: lastName,
            gender,
            phone_number: phoneNumber,
            birthday,
            address
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setSuccessMsg(data.message);
          setIsRegister(false);
          setUsername('');
          setPassword('');
          setEmail('');
          setFirstName('');
          setLastName('');
          setGender('female');
          setPhoneNumber('');
          setBirthday('');
          setAddress('');
        } else {
          setError(data.message || 'Registration failed.');
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          login(data.data.token, data.data.user);
        } else {
          setError(data.message || 'Login failed. Please verify your credentials.');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Network error. Unable to reach the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif',
      flexDirection: 'row'
    }}>
      <style>
        {`
          @media (max-width: 768px) {
            .login-left-panel {
              display: none !important;
            }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      
      {/* Left Panel - Branding */}
      <div className="login-left-panel" style={{
        flex: 1,
        background: 'linear-gradient(135deg, #7A43B6 0%, #5E2A8C 100%)',
        padding: '48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-15%',
          right: '-10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)',
          borderRadius: '50%',
          zIndex: 0
        }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '120px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" fillOpacity="0.8" />
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>EduTrack</h2>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>MANAGEMENT</div>
            </div>
          </div>

          <h1 style={{ fontSize: '42px', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2, marginBottom: '24px' }}>
            Manage your school<br />with confidence.
          </h1>
          <p style={{ fontSize: '15px', lineHeight: 1.6, opacity: 0.9, maxWidth: '420px', marginBottom: '32px' }}>
            A comprehensive platform for managing student registrations, daily attendance, academic grades, marks processing, and email notifications — all in one place.
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', maxWidth: '460px' }}>
            {['Student Directory', 'Attendance Management', 'Academic Grades', 'Marks Entry', 'Email Alerts'].map(badge => (
              <span key={badge} style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '8px 16px',
                borderRadius: '24px',
                fontSize: '12px',
                fontWeight: 600,
                backdropFilter: 'blur(4px)'
              }}>
                {badge}
              </span>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto', paddingTop: '64px' }}>
          <p style={{ fontStyle: 'italic', opacity: 0.8, fontSize: '13px', marginBottom: '8px', maxWidth: '420px', lineHeight: 1.5 }}>
            "Education is the most powerful weapon which you can use to change the world."
          </p>
          <p style={{ fontSize: '12px', opacity: 0.6, fontWeight: 500 }}>— Nelson Mandela</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div style={{
        flex: 1,
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        position: 'relative'
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1F2937', marginBottom: '8px' }}>EduTrack Portal</h1>
          <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '32px' }}>
            {isForgotPassword ? 'Reset your password' : isRegister ? 'Register for a new teacher account' : 'Sign in to access the dashboard'}
          </p>

          {successMsg && (
            <div style={{
              background: '#ECFDF5',
              border: '1px solid #10B981',
              color: '#059669',
              padding: '12px 16px',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              lineHeight: 1.5
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              {successMsg}
            </div>
          )}

          {error && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#EF4444',
              padding: '12px 16px',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              lineHeight: 1.5
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: '8px' }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  color: '#1F2937',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#7A43B6';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(122, 67, 182, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                }}
                required
              />
            </div>

            {!isForgotPassword && isRegister && (
              <>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: '8px' }}>First Name</label>
                    <input
                      type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" required
                      style={{ width: '100%', padding: '12px 16px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', color: '#1F2937', fontSize: '14px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#7A43B6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(122, 67, 182, 0.1)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)'; }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: '8px' }}>Last Name</label>
                    <input
                      type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" required
                      style={{ width: '100%', padding: '12px 16px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', color: '#1F2937', fontSize: '14px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#7A43B6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(122, 67, 182, 0.1)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)'; }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: '8px' }}>Gender</label>
                  <select
                    value={gender} onChange={e => setGender(e.target.value)} required
                    style={{ width: '100%', padding: '12px 16px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', color: '#1F2937', fontSize: '14px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#7A43B6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(122, 67, 182, 0.1)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)'; }}
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: '8px' }}>Phone Number</label>
                    <input
                      type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+1-234-567-8900" required
                      style={{ width: '100%', padding: '12px 16px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', color: '#1F2937', fontSize: '14px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#7A43B6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(122, 67, 182, 0.1)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)'; }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: '8px' }}>Birthday</label>
                    <input
                      type="date" value={birthday} onChange={e => setBirthday(e.target.value)} required
                      style={{ width: '100%', padding: '12px 16px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', color: '#1F2937', fontSize: '14px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#7A43B6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(122, 67, 182, 0.1)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)'; }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: '8px' }}>Home Address</label>
                  <textarea
                    value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter your full home address" required rows={2}
                    style={{ width: '100%', padding: '12px 16px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', color: '#1F2937', fontSize: '14px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)', resize: 'vertical' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#7A43B6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(122, 67, 182, 0.1)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)'; }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: '8px' }}>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      color: '#1F2937',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#7A43B6';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(122, 67, 182, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                    }}
                    required
                  />
                </div>
              </>
            )}

            <div style={{ marginBottom: isForgotPassword ? '20px' : '32px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: '8px' }}>
                {isForgotPassword ? 'New Password' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  color: '#1F2937',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#7A43B6';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(122, 67, 182, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                }}
                required
              />
            </div>

            {isForgotPassword && (
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: '8px' }}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    color: '#1F2937',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#7A43B6';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(122, 67, 182, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                  }}
                  required
                />
              </div>
            )}

            {!isRegister && !isForgotPassword && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px', marginTop: '-12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError('');
                    setSuccessMsg('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#7A43B6',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0
                  }}
                  onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px',
                background: '#633194',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.8 : 1,
                transition: 'all 0.2s',
                boxShadow: '0 4px 6px -1px rgba(99, 49, 148, 0.2), 0 2px 4px -1px rgba(99, 49, 148, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => { if (!isLoading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(99, 49, 148, 0.3), 0 4px 6px -1px rgba(99, 49, 148, 0.2)'; } }}
              onMouseOut={(e) => { if (!isLoading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(99, 49, 148, 0.2), 0 2px 4px -1px rgba(99, 49, 148, 0.1)'; } }}
            >
              {isLoading ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {isForgotPassword ? 'Resetting...' : isRegister ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (isForgotPassword ? 'Change Password' : isRegister ? 'Create Account' : 'Sign In')}
            </button>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  if (isForgotPassword) {
                    setIsForgotPassword(false);
                  } else {
                    setIsRegister(!isRegister);
                  }
                  setError('');
                  setSuccessMsg('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7A43B6',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'none'
                }}
                onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                {isForgotPassword ? 'Back to Sign In' : isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
