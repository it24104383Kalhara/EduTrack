import { useState } from "react";
import "./ResetPassword.css";

interface ResetPasswordProps {
  onBack: () => void;
  username: string;
}

function ResetPassword({ onBack, username }: ResetPasswordProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("New passwords don't match!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, oldPassword, newPassword }),
      });
      const data = await response.json();
      alert(data.message);
      if (data.success) {
        onBack();
      }
    } catch (error) {
      alert("Connection error");
    }
  };

  return (
    <div className="reset-page">
      <button className="back-btn" onClick={onBack}>
        ← Back to Dashboard
      </button>
      <div className="reset-container">
        <h1>Reset Password</h1>
        <p>User: {username}</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Old Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit">Reset Password</button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
