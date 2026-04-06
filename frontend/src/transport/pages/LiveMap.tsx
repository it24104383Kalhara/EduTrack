import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { db, FIREBASE_READY } from '../../firebaseConfig';
import { ref, onValue, query, limitToLast } from 'firebase/database';

// ── ADJUSTABLE CONSTANTS ────────────────────────────────────────────────────
const MAP_UPDATE_INTERVAL_MS = 5000;
const DELAY_IDLE_THRESHOLD_MS = 20000;
const SCHOOL_COORDS: [number, number] = [6.9271, 79.8612];
// ────────────────────────────────────────────────────────────────────────────

interface BusData {
    vehicle_id: string;
    latitude: number;
    longitude: number;
    speed: number;
    timestamp: number;
    driverName?: string;
    busNumber?: string;
    busPlate?: string;
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

function FlyToFirst({ buses }: { buses: BusData[] }) {
    const map = useMap();
    const flownRef = useRef(false);
    useEffect(() => {
        if (!flownRef.current && buses.length > 0) {
            map.flyTo([buses[0].latitude, buses[0].longitude], 14, { duration: 1.5 });
            flownRef.current = true;
        }
    }, [buses, map]);
    return null;
}



export default function LiveMap() {
    const [buses, setBuses] = useState<BusData[]>([]);
    const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
    const [sosAlerts, setSosAlerts] = useState<any[]>([]);
    const [alerts, setAlerts] = useState<string[]>([]);
    const [fbError, setFbError] = useState(false);

    const prevPositions = useRef<Record<string, { lat: number; lng: number; since: number }>>({});
    const alertTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    useEffect(() => {
        if (!FIREBASE_READY || !db) {
            setFbError(true);
            return;
        }

        let interval: ReturnType<typeof setInterval> | null = null;

        try {
            const trackingRef = ref(db, 'tracking');
            const unsub = onValue(
                trackingRef,
                (snapshot) => {
                    if (!snapshot.exists()) {
                        setBuses([]); // Clear demo data if connected but empty
                        return;
                    }
                    setFbError(false);
                    const raw = snapshot.val() as Record<string, Omit<BusData, 'vehicle_id'>>;
                    const list: BusData[] = Object.entries(raw).map(([id, v]) => ({ vehicle_id: id, ...v }));

                    if (interval) clearInterval(interval);
                    interval = setInterval(() => {
                        setBuses(list);
                        checkDelayAlerts(list);
                    }, MAP_UPDATE_INTERVAL_MS);

                    setBuses(list);
                    checkDelayAlerts(list);

                    // Uber Style Polyline for first bus
                    if (list.length > 0) {
                        const bus = list[0];
                        fetch(`https://router.project-osrm.org/route/v1/driving/${bus.longitude},${bus.latitude};${SCHOOL_COORDS[1]},${SCHOOL_COORDS[0]}?overview=full&geometries=geojson`)
                            .then(r => r.json())
                            .then(data => {
                                if (data.routes?.[0]?.geometry?.coordinates) {
                                    setRoutePoints(data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]));
                                }
                            }).catch(() => { });
                    }
                },
                () => setFbError(true),
            );

            // SOS Alert Listener
            const eventsRef = query(ref(db, 'events'), limitToLast(5));
            const unsubEvents = onValue(eventsRef, (snapshot) => {
                if (!snapshot.exists()) return;
                const vals = Object.entries(snapshot.val()).map(([id, v]: any) => ({ id, ...v }));
                const recentSos = vals.filter(v => (v.type === 'sos' || v.type === 'delay_reported' || v.message?.includes('SOS')) && Date.now() - v.timestamp < 3600000);
                setSosAlerts(recentSos.reverse());
            });

            return () => { unsub(); unsubEvents(); if (interval) clearInterval(interval); };
        } catch {
            setFbError(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function checkDelayAlerts(list: BusData[]) {
        const now = Date.now();
        list.forEach((bus) => {
            const prev = prevPositions.current[bus.vehicle_id];
            if (prev) {
                const samePos = Math.abs(prev.lat - bus.latitude) < 0.0001 &&
                    Math.abs(prev.lng - bus.longitude) < 0.0001;
                if (samePos) {
                    // Bus has not moved — start/keep idle timer
                    if (!alertTimers.current[bus.vehicle_id]) {
                        alertTimers.current[bus.vehicle_id] = setTimeout(() => {
                            // DELAY_IDLE_THRESHOLD_MS reached — fire alert
                            setAlerts(a => [`⚠ ${bus.busNumber || bus.vehicle_id} appears delayed (idle > ${DELAY_IDLE_THRESHOLD_MS / 1000}s)`, ...a].slice(0, 5));
                            delete alertTimers.current[bus.vehicle_id];
                        }, DELAY_IDLE_THRESHOLD_MS - (now - prev.since));
                    }
                } else {
                    // Bus moved — reset timer
                    if (alertTimers.current[bus.vehicle_id]) {
                        clearTimeout(alertTimers.current[bus.vehicle_id]);
                        delete alertTimers.current[bus.vehicle_id];
                    }
                    prevPositions.current[bus.vehicle_id] = { lat: bus.latitude, lng: bus.longitude, since: now };
                }
            } else {
                prevPositions.current[bus.vehicle_id] = { lat: bus.latitude, lng: bus.longitude, since: now };
            }
        });
    }

    const getStatusColor = (bus: BusData) => {
        if (bus.speed === 0) return '#f59e0b'; // idle/stopped
        return '#22c55e';                       // moving
    };

    return (
        <div className="livemap-page">
            <div className="page-header" style={{ marginBottom: 16 }}>
                <h1>
                    Live Map{' '}
                    <span className="live-badge" style={{ fontSize: '0.65rem', verticalAlign: 'middle' }}>LIVE</span>
                </h1>
                <p>Real-time GPS tracking — updates every {MAP_UPDATE_INTERVAL_MS / 1000}s · Delay alert after {DELAY_IDLE_THRESHOLD_MS / 1000}s idle</p>
            </div>

            {/* Firebase connection notice */}
            {fbError && (
                <div className="lm-notice">
                    ℹ Demo mode — Firebase not connected. Add credentials to <code>.env</code> to enable live tracking.
                </div>
            )}

            {/* Delay alerts */}
            {alerts.length > 0 && (
                <div className="lm-alerts">
                    {alerts.map((a, i) => (
                        <div key={i} className="lm-alert-item">
                            {a}
                            <button onClick={() => setAlerts(p => p.filter((_, j) => j !== i))}>✕</button>
                        </div>
                    ))}
                </div>
            )}

            <div className="lm-body">
                {/* Map */}
                <div className="livemap-fullmap">
                    <MapContainer
                        center={[6.9271, 79.8612]}
                        zoom={13}
                        style={{ width: '100%', height: '100%' }}
                        zoomControl
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <FlyToFirst buses={buses} />

                        {/* School Marker */}
                        <Marker position={SCHOOL_COORDS} icon={L.divIcon({ className: '', html: '<div style="background:#ef4444;width:12px;height:12px;border-radius:50%;border:2px solid white;"></div>' })} />

                        {/* Uber Polyline */}
                        {routePoints.length > 0 && (
                            <Polyline positions={routePoints} pathOptions={{ color: 'black', weight: 4, opacity: 0.8 }} />
                        )}

                        {buses.map(bus => (
                            <Marker
                                key={bus.vehicle_id}
                                position={[bus.latitude, bus.longitude]}
                                icon={createBusIcon()}
                            >
                                <Popup>
                                    <div style={{ minWidth: 160 }}>
                                        <strong>{bus.busNumber || bus.vehicle_id}</strong><br />
                                        {bus.driverName && <><span>Driver: {bus.driverName}</span><br /></>}
                                        {bus.busPlate && <><span>Plate:  {bus.busPlate}</span><br /></>}
                                        <span>Speed: {bus.speed} km/h</span><br />
                                        <span style={{ color: bus.speed === 0 ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>
                                            {bus.speed === 0 ? '⬤ Idle / Stopped' : '⬤ Moving'}
                                        </span>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                {/* Side panel */}
                <div className="lm-panel">
                    <div className="lm-panel-title">Active Vehicles ({buses.length})</div>
                    {buses.map(bus => (
                        <div key={bus.vehicle_id} className="lm-bus-card">
                            <div className="lm-bus-dot" style={{ background: getStatusColor(bus) }} />
                            <div className="lm-bus-info">
                                <span className="lm-bus-name">{bus.busNumber || bus.vehicle_id}</span>
                                {bus.driverName && <span className="lm-bus-driver">{bus.driverName}</span>}
                                {bus.busPlate && <span className="lm-bus-plate">{bus.busPlate}</span>}
                                <span className="lm-bus-speed">{bus.speed} km/h</span>
                            </div>
                        </div>
                    ))}

                    {/* SOS / Emergency */}
                    <div className="lm-sos-section">
                        <div className="lm-panel-title" style={{ marginTop: 20 }}>🚨 Emergency Alerts</div>
                        {sosAlerts.length === 0 ? (
                            <div className="lm-sos-empty">No active emergencies</div>
                        ) : (
                            sosAlerts.map(sos => (
                                <div key={sos.id} className="lm-bus-card" style={{ borderLeft: '4px solid #ef4444' }}>
                                    <div className="lm-bus-info">
                                        <span className="lm-bus-name" style={{ color: '#ef4444' }}>{sos.type.toUpperCase()}</span>
                                        <span className="lm-bus-driver">{sos.message}</span>
                                        <span className="lm-bus-plate">{new Date(sos.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
