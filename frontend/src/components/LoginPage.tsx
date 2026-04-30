import { useState } from 'react'
import DashboardPage from './DashboardPage'
import './LoginPage.css'

interface LoginFormData {
  username: string
  password: string
}

const LoginPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: ''
  })

  const [errors, setErrors] = useState<Partial<LoginFormData>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name as keyof LoginFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {}
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      // Check admin credentials
      if (formData.username === 'admin' && formData.password === 'admin123') {
        // Successful admin login - show dashboard
        setIsLoggedIn(true)
      } else {
        // Invalid credentials
        setErrors({
          username: 'Invalid credentials',
          password: 'Invalid credentials'
        })
      }
    }
  }

  // Show dashboard if logged in, otherwise show login form
  if (isLoggedIn) {
    return <DashboardPage />
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Hostel Management System</h1>
          <p>Admin Login Portal</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`form-input ${errors.username ? 'error' : ''}`}
              placeholder="Enter username"
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Enter password"
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
          
          <button type="submit" className="login-button">
            Login
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
