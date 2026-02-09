import { useState } from "react";
import "./health.css";

interface HealthProps {
  onLoginSuccess: () => void;
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
        onLoginSuccess();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Connection error");
    }
  };

  return (
    <div className="page">
      {/* LEFT HERO SECTION */}
      <div className="hero">
        <div className="hero-content">
          <h1 className="title">Student First Aid & Health Management</h1>

          <p className="description">
            A smart system to digitally record student clinic visits, symptoms,
            treatments and emergency details. Reduce paperwork and securely
            manage student health records.
          </p>

          <ul className="features">
            <li>✔ Record student medical visits</li>
            <li>✔ Track symptoms & treatments</li>
            <li>✔ Inform parents quickly</li>
            <li>✔ Find nearest hospitals</li>
          </ul>
        </div>
      </div>

      {/* RIGHT LOGIN */}
      <div className="login-side">
        <div className="login-container">
          <h2>Welcome Back</h2>
          <p className="subtitle">Login to continue</p>

          <form onSubmit={handleLogin}>
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit">Sign In</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Health;
