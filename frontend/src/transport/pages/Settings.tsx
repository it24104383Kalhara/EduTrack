import { useState } from 'react';

export default function Settings() {
    const [notifications, setNotifications] = useState(true);
    const [liveTracking, setLiveTracking] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [mapProvider, setMapProvider] = useState('OpenStreetMap');
    const [refreshInterval, setRefreshInterval] = useState('30');

    return (
        <div className="settings-page">
            <div className="page-header">
                <h1>Settings</h1>
                <p>Configure transport system preferences and integrations.</p>
            </div>

            {/* ── General Settings ── */}
            <div className="settings-section">
                <div className="settings-section-header">
                    <h2>General</h2>
                    <p>Basic transport module configuration</p>
                </div>

                <div className="settings-row">
                    <div className="settings-row-info">
                        <label>Push Notifications</label>
                        <span>Receive alerts for route delays and GPS issues</span>
                    </div>
                    <button
                        className={`settings-toggle ${notifications ? 'on' : ''}`}
                        onClick={() => setNotifications(!notifications)}
                        aria-label="Toggle notifications"
                    />
                </div>

                <div className="settings-row">
                    <div className="settings-row-info">
                        <label>Live Tracking</label>
                        <span>Enable real-time GPS tracking for all vehicles</span>
                    </div>
                    <button
                        className={`settings-toggle ${liveTracking ? 'on' : ''}`}
                        onClick={() => setLiveTracking(!liveTracking)}
                        aria-label="Toggle live tracking"
                    />
                </div>

                <div className="settings-row">
                    <div className="settings-row-info">
                        <label>Auto-Refresh Dashboard</label>
                        <span>Automatically refresh dashboard data</span>
                    </div>
                    <button
                        className={`settings-toggle ${autoRefresh ? 'on' : ''}`}
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        aria-label="Toggle auto refresh"
                    />
                </div>

                <div className="settings-row">
                    <div className="settings-row-info">
                        <label>Refresh Interval (seconds)</label>
                        <span>How often the dashboard data updates</span>
                    </div>
                    <input
                        className="settings-input"
                        type="number"
                        min={10}
                        max={300}
                        value={refreshInterval}
                        onChange={(e) => setRefreshInterval(e.target.value)}
                    />
                </div>
            </div>

            {/* ── Map Settings ── */}
            <div className="settings-section">
                <div className="settings-section-header">
                    <h2>Map & Location</h2>
                    <p>Map provider and location tracking preferences</p>
                </div>

                <div className="settings-row">
                    <div className="settings-row-info">
                        <label>Map Provider</label>
                        <span>Choose the map service to use for live tracking</span>
                    </div>
                    <select
                        className="settings-input"
                        value={mapProvider}
                        onChange={(e) => setMapProvider(e.target.value)}
                        style={{ cursor: 'pointer' }}
                    >
                        <option>OpenStreetMap</option>
                        <option>Google Maps</option>
                        <option>Mapbox</option>
                    </select>
                </div>
            </div>

            {/* Save button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                    className="settings-save-btn"
                    onClick={() => alert('Settings saved!')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Save Changes
                </button>
            </div>
        </div>
    );
}
