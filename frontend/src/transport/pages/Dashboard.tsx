import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { db, FIREBASE_READY } from '../../firebaseConfig';
import { ref, onValue, limitToLast, query } from 'firebase/database';

// ── SETTINGS ────────────────────────────────────────────────────────────────
const SCHOOL_COORDS: [number, number] = [6.9271, 79.8612];
const SHOW_POLYLINE = true; // Set to false to easily disable polyline
// ────────────────────────────────────────────────────────────────────────────

interface BusData {
    vehicle_id: string;
    latitude: number;
    longitude: number;
    speed: number;
    timestamp: number;
    driverName?: string;
    busNumber?: string;
}

function createBusIcon() {
    return L.divIcon({
        className: 'pulsating-blue-dot-container',
        html: `
            <div class="blue-dot-pulse"></div>
            <div class="blue-dot-core"></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });
}

export default function Dashboard() {
    const [buses, setBuses] = useState<BusData[]>([]);
    const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
    const [lastAlert, setLastAlert] = useState<any>(null);
    const lastEventIdRef = useRef<string | null>(null);

    const notificationRequestRef = useRef(false);

    // ── Real-time Tracking ──────────────────────────────────────────────
    useEffect(() => {
        if (!FIREBASE_READY || !db) return;

        const trackingRef = ref(db, 'tracking');
        const unsub = onValue(trackingRef, (snapshot) => {
            if (!snapshot.exists()) return;
            const raw = snapshot.val() as Record<string, Omit<BusData, 'vehicle_id'>>;
            const list = Object.entries(raw).map(([id, v]) => ({ vehicle_id: id, ...v }));
            setBuses(list);

            // Generate polyline for first active bus (Uber style - black line)
            if (SHOW_POLYLINE && list.length > 0) {
                const bus = list[0];
                fetch(`https://router.project-osrm.org/route/v1/driving/${bus.longitude},${bus.latitude};${SCHOOL_COORDS[1]},${SCHOOL_COORDS[0]}?overview=full&geometries=geojson`)
                    .then(r => r.json())
                    .then(data => {
                        if (data.routes?.[0]?.geometry?.coordinates) {
                            const pts = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
                            setRoutePoints(pts);
                        }
                    }).catch(() => { });
            }
        });

        // ── SOS Notifications & Events ──────────────────────────────────
        const eventsRef = query(ref(db, 'events'), limitToLast(1));
        const unsubEvents = onValue(eventsRef, (snapshot) => {
            if (!snapshot.exists()) return;
            const entries = Object.entries(snapshot.val());
            if (entries.length === 0) return;
            const [id, data] = entries[0] as [string, any];

            if (lastEventIdRef.current !== id) {
                lastEventIdRef.current = id;
                // Only notify if event is recent (last 30s)
                if (Date.now() - data.timestamp < 30000) {
                    setLastAlert(data);
                    if (data.type === 'delay_reported' || data.type === 'sos' || data.message?.includes('SOS')) {
                        if (Notification.permission === 'granted') {

                            new Notification("🚨 EduTrack Alert", {
                                body: data.message || "Emergency alert from driver",
                                icon: '/favicon.ico'
                            });
                        }
                    }
                }
            }
        });

        if (!notificationRequestRef.current && "Notification" in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
            notificationRequestRef.current = true;
        }

        return () => { unsub(); unsubEvents(); };
    }, []);

    // ── Easy-to-edit stat cards ──────────────────────────────────
    const stats = [
        {
            label: 'Total Buses',
            value: '12',
            change: '+2 this month',
            changeType: 'up' as const,
            color: '#eff6ff',
            iconColor: '#2563eb',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="5" width="22" height="14" rx="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                    <path d="M7 19v2M17 19v2" />
                </svg>
            ),
        },
        {
            label: 'Active Routes',
            value: '8',
            change: 'All on time',
            changeType: 'neutral' as const,
            color: '#f0fdf4',
            iconColor: '#16a34a',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
            ),
        },
        {
            label: 'Students Today',
            value: '348',
            change: '+12 vs yesterday',
            changeType: 'up' as const,
            color: '#faf5ff',
            iconColor: '#9333ea',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ),
        },
        {
            label: 'Active Drivers',
            value: '10',
            change: '2 on leave',
            changeType: 'neutral' as const,
            color: '#fff7ed',
            iconColor: '#ea580c',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M3 20c0-4 4-7 9-7s9 3 9 7" />
                </svg>
            ),
        },
    ];

    // ── Driver details — edit here ───────────────────────────────
    const driver = {
        name: 'Suresh Perera',
        age: 42,
        phone: '+94 77 123 4567',
        vehicle: 'Bus 03 – Route A',
        status: 'On Duty',
    };

    return (
        <div className="dashboard-page">
            {/* ── Header ── */}
            {/* 🚨 Live Alerts 🚨 */}
            {lastAlert && (
                <div className="lm-alerts" style={{ marginBottom: 24 }}>
                    <div className="lm-alert-item" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626' }}>
                        <span>🚨 {lastAlert.message || 'Emergency Alert!'}</span>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <button
                                onClick={() => setLastAlert(null)}
                                style={{ background: '#dc2626', color: 'white', padding: '6px 12px', borderRadius: 12, fontSize: 13, fontWeight: 700 }}
                            >
                                SAFE / RESOLVE
                            </button>
                            <button onClick={() => setLastAlert(null)} style={{ color: '#dc2626', fontSize: 18 }}>✕</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="dashboard-header">

                <div className="dashboard-welcome">
                    <h1>Welcome 👋</h1>
                    <p>Here's what's happening with transport today.</p>
                </div>
                <div className="profile-avatar" title="Profile">
                    <svg viewBox="0 0 24 24">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="dashboard-cards">
                {stats.map((s) => (
                    <div className="stat-card" key={s.label}>
                        <div className="stat-card-icon" style={{ background: s.color, color: s.iconColor }}>
                            <span style={{ display: 'flex' }}>{s.icon}</span>
                        </div>
                        <div className="stat-card-value">{s.value}</div>
                        <div className="stat-card-label">{s.label}</div>
                        <span className={`stat-card-change ${s.changeType}`}>{s.change}</span>
                    </div>
                ))}
            </div>

            {/* ── Live Map ── */}
            <div className="dashboard-map-section">
                <h2 className="section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                    Live Location
                    <span className="live-badge">LIVE</span>
                </h2>
                <div className="map-container">
                    <MapContainer
                        center={SCHOOL_COORDS}
                        zoom={13}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                        {/* School Marker */}
                        <Marker position={SCHOOL_COORDS} icon={L.divIcon({ className: '', html: '<div style="background:#ef4444;width:12px;height:12px;border-radius:50%;border:2px solid white;"></div>' })} />

                        {/* Bus Markers */}
                        {buses.map(bus => (
                            <Marker key={bus.vehicle_id} position={[bus.latitude, bus.longitude]} icon={createBusIcon()}>
                                <Popup>{bus.busNumber || bus.vehicle_id} - {bus.speed} km/h</Popup>
                            </Marker>
                        ))}

                        {/* Uber Style Polyline (follows roads - black like Uber) */}
                        {SHOW_POLYLINE && routePoints.length > 0 && (
                            <Polyline positions={routePoints} pathOptions={{ color: 'black', weight: 4, opacity: 0.8 }} />
                        )}
                    </MapContainer>
                </div>
            </div>

            {/* ── Driver Details ── */}
            <div className="driver-details-card">
                <div className="driver-avatar">
                    <svg viewBox="0 0 24 24">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                </div>
                <div className="driver-info">
                    <div className="driver-info-item">
                        <label>Driver Name</label>
                        <span>{driver.name}</span>
                    </div>
                    <div className="driver-info-item">
                        <label>Age</label>
                        <span>{driver.age}</span>
                    </div>
                    <div className="driver-info-item">
                        <label>Telephone</label>
                        <span>{driver.phone}</span>
                    </div>
                    <div className="driver-info-item">
                        <label>Vehicle</label>
                        <span>{driver.vehicle}</span>
                    </div>
                    <div className="driver-info-item">
                        <label>Status</label>
                        <span className="driver-status-badge">
                            <span className="driver-status-dot" />
                            {driver.status}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
