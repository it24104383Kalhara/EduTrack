import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");

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

      setMessage(data.message);

      // Redirect depending on role
      if (data.role === "librarian") {
        navigate("/dashboard");
      } else if (data.role === "roomUser") {
        navigate("/roomsBooking");
      }

    } catch (err) {
      if (err instanceof Error) {
        setMessage(err.message);
      } else {
        setMessage("An unknown error occurred");
      }
    }
  };

  return (
    <div style={{ maxWidth: 300, margin: "50px auto", textAlign: "center" }}>
      <h2>Login</h2>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ display: "block", marginBottom: 10, width: "100%", padding: 5 }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", marginBottom: 10, width: "100%", padding: 5 }}
      />

      <button onClick={handleLogin} style={{ width: "100%", padding: 5 }}>
        Login
      </button>

      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </div>
  );
}