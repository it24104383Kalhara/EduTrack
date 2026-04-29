import { useState } from "react";
import "./health.css";

interface HealthProps {
  onLoginSuccess: (username: string) => void;
}

function Health({ onLoginSuccess }: HealthProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (data.success) {
        onLoginSuccess(username);
      } else {
        alert(data.message);
      }
    } catch {
      alert("Connection error");
    }
  };

  return (
    <div className="page">
      {/* ── LEFT HERO ── */}
      <div className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
            </svg>
            EduTrack Health Module
          </div>

          <h1 className="title">
            <span className="highlight">Student First Aid</span> &amp; Health Management
          </h1>

          <p className="description">
            A smart system to digitally record student clinic visits, symptoms,
            treatments, and emergency details. Reduce paperwork and securely
            manage student health records.
          </p>

          <ul className="features">
            <li>
              <span className="feature-icon">🏥</span>
              Record student medical visits
            </li>
            <li>
              <span className="feature-icon">💊</span>
              Track symptoms &amp; treatments
            </li>
            <li>
              <span className="feature-icon">📩</span>
              Inform parents quickly
            </li>
            <li>
              <span className="feature-icon">📍</span>
              Find nearest hospitals
            </li>
          </ul>
        </div>
      </div>

      {/* ── RIGHT LOGIN ── */}
      <div className="login-side">
        <div className="login-container">
          <div className="login-logo">
            <svg viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>

          <h2>Welcome Back</h2>
          <p className="login-subtitle">Sign in to continue to EduTrack</p>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="login-form-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="login-form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="signin-btn">Sign In</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Health;