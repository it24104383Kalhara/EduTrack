import { useState, useEffect } from "react";
import "../../css/health/HeartRateMonitor.css";

interface HeartRateMonitorProps {
  onLogout: () => void;
  onBack: () => void;
}

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const BackIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    style={{ width: 14, height: 14 }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

function HeartRateMonitor({ onLogout, onBack }: HeartRateMonitorProps) {
  const [heartRate, setHeartRate] = useState<number>(0);
  const [fingerDetected, setFingerDetected] = useState<boolean>(false);
  const [history, setHistory] = useState<number[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [esp32IP, setEsp32IP] = useState("192.168.1.100");

  useEffect(() => {
    const interval = setInterval(() => {
      fetchHeartRate();
    }, 500);
    return () => clearInterval(interval);
  }, [esp32IP]);

  const fetchHeartRate = async () => {
    try {
      const response = await fetch(`http://${esp32IP}/heartrate`);
      const data = await response.json();
      setHeartRate(data.bpm);
      setFingerDetected(data.fingerDetected);
      setIsConnected(true);
      if (data.bpm > 0 && data.fingerDetected) {
        setHistory((prev) => [...prev.slice(-19), data.bpm]);
      }
    } catch {
      setIsConnected(false);
    }
  };

  const getStatus = (): "waiting" | "low" | "high" | "normal" => {
    if (!fingerDetected) return "waiting";
    if (heartRate < 60) return "low";
    if (heartRate > 100) return "high";
    return "normal";
  };

  const statusLabels = {
    waiting: "Place finger on sensor",
    low: "Low — Below Normal",
    high: "High — Above Normal",
    normal: "Normal",
  };

  const status = getStatus();
  const avg = history.length
    ? Math.round(history.reduce((a, b) => a + b, 0) / history.length)
    : 0;
  const min = history.length ? Math.min(...history) : 0;
  const max = history.length ? Math.max(...history) : 0;
  const graphMax = Math.max(...history, 120);

  return (
    <div className="hrm-root">
      {/* Background blobs */}
      <div className="hrm-blob-1" />
      <div className="hrm-blob-2" />

      {/* ─── Sticky Header ─────────────────────────────────────────────── */}
      <header className="hrm-header">
        <div className="hrm-header-inner">
          {/* Logo */}
          <a href="/" className="hrm-logo">
            <div className="hrm-logo-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="hrm-logo-text">EduTrack</span>
          </a>

          {/* Page title */}
          <div className="hrm-title-group">
            <span className="hrm-page-title">❤️ Heart Rate Monitor</span>
            <span className="hrm-page-sub">Health Module · Real-time</span>
          </div>

          {/* Actions */}
          <div className="hrm-header-actions">
            <button onClick={onBack} className="hrm-btn-back">
              <BackIcon /> Back
            </button>
            <button onClick={onLogout} className="hrm-btn-logout">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main ──────────────────────────────────────────────────────── */}
      <main className="hrm-main">
        {/* Connection + IP row */}
        <div className="hrm-top-row">
          {/* Connection status */}
          <div className="hrm-card">
            <div className="hrm-conn-header">
              <span
                className={`hrm-conn-dot${isConnected ? " connected" : ""}`}
              />
              <span className="hrm-conn-label">
                {isConnected ? "Connected to ESP32" : "Connecting…"}
              </span>
              <span
                className={`hrm-conn-badge${isConnected ? " connected" : " disconnected"}`}
              >
                {isConnected ? "● Live" : "○ Offline"}
              </span>
            </div>
          </div>

          {/* IP config */}
          <div className="hrm-card">
            <label className="hrm-ip-label">ESP32 IP Address</label>
            <input
              className="hrm-ip-input"
              type="text"
              value={esp32IP}
              onChange={(e) => setEsp32IP(e.target.value)}
              placeholder="192.168.1.100"
            />
          </div>
        </div>

        {/* ─── Hero BPM Card ─────────────────────────────────────────── */}
        <div className="hrm-hero-card">
          <div className={`hrm-heart-icon${fingerDetected ? " beating" : ""}`}>
            ❤️
          </div>

          <div className="hrm-bpm-row">
            <span
              className={`hrm-bpm-value ${status === "waiting" ? "" : status}`}
            >
              {heartRate}
            </span>
            <span className="hrm-bpm-unit">BPM</span>
          </div>

          <div
            className={`hrm-status-badge ${status === "waiting" ? "" : status}`}
          >
            {statusLabels[status]}
          </div>

          <div className="hrm-range">Normal range: 60 – 100 BPM</div>
        </div>

        {/* ─── Stats row ─────────────────────────────────────────────── */}
        {history.length > 0 && (
          <div className="hrm-stats-row">
            <div className="hrm-stat-card">
              <div className="hrm-stat-icon">📊</div>
              <div className="hrm-stat-value">{avg}</div>
              <div className="hrm-stat-label">Avg BPM</div>
            </div>
            <div className="hrm-stat-card">
              <div className="hrm-stat-icon">⬇️</div>
              <div className="hrm-stat-value">{min}</div>
              <div className="hrm-stat-label">Min BPM</div>
            </div>
            <div className="hrm-stat-card">
              <div className="hrm-stat-icon">⬆️</div>
              <div className="hrm-stat-value">{max}</div>
              <div className="hrm-stat-label">Max BPM</div>
            </div>
          </div>
        )}

        {/* ─── History Graph ─────────────────────────────────────────── */}
        {history.length > 0 && (
          <div className="hrm-history-card">
            <div className="hrm-section-label">
              <span />
              Recent Readings ({history.length} samples)
            </div>
            <div className="hrm-graph">
              {history.map((bpm, i) => (
                <div
                  key={i}
                  className={`hrm-bar${bpm < 60 || bpm > 100 ? " abnormal" : " normal"}`}
                  style={{ height: `${(bpm / graphMax) * 100}%` }}
                  data-bpm={bpm}
                />
              ))}
            </div>
          </div>
        )}

        {/* ─── Instructions ──────────────────────────────────────────── */}
        <div className="hrm-info-card">
          <div className="hrm-section-label">
            <span />
            Instructions
          </div>
          <ul className="hrm-info-list">
            {[
              "Make sure ESP32 is connected to WiFi",
              "Enter the ESP32 IP address in the field above",
              "Place your finger gently on the sensor",
              "Keep your finger still for accurate readings",
              "Normal resting heart rate is between 60 – 100 BPM",
            ].map((item) => (
              <li key={item}>
                <span className="hrm-check">
                  <CheckIcon />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}

export default HeartRateMonitor;
