import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Layers, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { username, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid username or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', width: '100%' }}>
      {/* Left Section - Purple Branding */}
      <div style={{ 
          flex: '1.2', 
          background: 'linear-gradient(180deg, #6D28D9 0%, #4C1D95 100%)', 
          padding: '4rem', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
      }}>
        {/* Logo and Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'absolute', top: '3rem', left: '4rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '0.5rem', borderRadius: '0.5rem' }}>
            <Layers size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', lineHeight: '1', color: 'white' }}>EduTrack</h2>
            <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8, color: 'white' }}>MANAGEMENT</p>
          </div>
        </div>

        {/* Main Branding Text */}
        <div style={{ maxWidth: '600px' }}>
          <h1 style={{ fontSize: '4.5rem', fontWeight: '800', lineHeight: '1.1', marginBottom: '2rem', color: 'white' }}>
            Manage your hostel<br />with confidence.
          </h1>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.6', opacity: 0.9, marginBottom: '3rem', color: 'white' }}>
            A comprehensive platform for managing student registrations, room allocations, pending payments, and automated email notifications — all in one place.
          </p>

          {/* Feature Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {['Student Registration', 'Room Allocation', 'Payment Tracking', 'Maintenance Requests', 'Email Alerts'].map(feature => (
              <span key={feature} style={{ 
                  background: 'rgba(255, 255, 255, 0.15)', 
                  padding: '0.6rem 1.2rem', 
                  borderRadius: '2rem', 
                  fontSize: '0.9rem', 
                  fontWeight: '500',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', padding: '2rem' }}>
        <div style={{ width: '400px' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem' }}>EduTrack Portal</h1>
            <p style={{ color: '#6B7280', fontSize: '1rem' }}>Sign in to access the dashboard</p>
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Username</label>
              <input 
                className="form-control" 
                type="text" 
                placeholder="iresha"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                style={{ 
                    height: '3.5rem', 
                    background: '#EFF6FF', 
                    border: 'none', 
                    borderRadius: '0.75rem', 
                    padding: '0 1.5rem',
                    fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Password</label>
              <input 
                className="form-control" 
                type="password" 
                placeholder="••••••••"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ 
                    height: '3.5rem', 
                    background: '#EFF6FF', 
                    border: 'none', 
                    borderRadius: '0.75rem', 
                    padding: '0 1.5rem',
                    fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ textAlign: 'right', marginBottom: '2rem' }}>
              <a href="#" style={{ color: '#6D28D9', fontSize: '0.875rem', fontWeight: '600', textDecoration: 'none' }}>Forgot Password?</a>
            </div>

            <button 
              type="submit" 
              className="btn" 
              disabled={isSubmitting}
              style={{ 
                  width: '100%', 
                  height: '3.5rem', 
                  background: '#5B21B6', 
                  color: 'white', 
                  borderRadius: '0.75rem', 
                  fontSize: '1.1rem', 
                  fontWeight: '700',
                  boxShadow: '0 10px 15px -3px rgba(91, 33, 182, 0.3)'
              }}>
              {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : "Sign In"}
            </button>
          </form>

          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <p style={{ color: '#6B7280' }}>
              Don't have an account? <a href="#" style={{ color: '#6D28D9', fontWeight: '700', textDecoration: 'none' }}>Sign Up</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
