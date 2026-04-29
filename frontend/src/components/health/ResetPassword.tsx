import { useState } from "react";
import "../../css/health/ResetPassword.css";

interface ResetPasswordProps {
  onBack: () => void;
  username: string;
}

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const KeyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 14, height: 14 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 15, height: 15 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

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
    } catch {
      alert("Connection error");
    }
  };

  return (
    <div className="rp-root">
      {/* Background blobs */}
      <div className="rp-blob-1" />
      <div className="rp-blob-2" />

      {/* Back button */}
      <button className="rp-back-btn" onClick={onBack}>
        <BackIcon /> Back to Dashboard
      </button>

      {/* Card */}
      <div className="rp-card">
        {/* Icon */}
        <div className="rp-icon-wrap">
          <KeyIcon />
        </div>

        <h1 className="rp-heading">Reset Password</h1>

        <div className="rp-sub">
          <span className="rp-username-badge">👤 {username}</span>
        </div>

        <form className="rp-form" onSubmit={handleSubmit}>
          {/* Old password */}
          <div className="rp-field">
            <label className="rp-label">Current Password</label>
            <div className="rp-input-wrap">
              <span className="rp-input-icon"><LockIcon /></span>
              <input
                className="rp-input"
                type="password"
                placeholder="Enter current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="rp-divider" />

          {/* New password */}
          <div className="rp-field">
            <label className="rp-label">New Password</label>
            <div className="rp-input-wrap">
              <span className="rp-input-icon"><LockIcon /></span>
              <input
                className="rp-input"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Confirm new password */}
          <div className="rp-field">
            <label className="rp-label">Confirm New Password</label>
            <div className="rp-input-wrap">
              <span className="rp-input-icon"><LockIcon /></span>
              <input
                className="rp-input"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="rp-submit-btn">
            Reset Password <ArrowIcon />
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
