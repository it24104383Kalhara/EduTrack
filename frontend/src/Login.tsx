import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");

  const navigate = useNavigate();

  const handleLogin = async () => {
    setMessage("");

    try {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data: {
        message: string;
        role?: string;
        user?: { username: string };
      } = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      setMessageType("success");
      setMessage(data.message);

      // Redirect depending on role
      if (data.role === "librarian") {
        navigate("/dashboard");
      } else if (data.role === "roomUser") {
        navigate("/roomsBooking");
      }

    } catch (err) {
      setMessageType("error");
      if (err instanceof Error) {
        setMessage(err.message);
      } else {
        setMessage("An unknown error occurred");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your account</p>
        </div>

        <form className="login-form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleLogin();
                }
              }}
            />
          </div>

          <button type="submit" className="login-button">
            Sign In
          </button>
        </form>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

      </div>
    </div>
  );
}