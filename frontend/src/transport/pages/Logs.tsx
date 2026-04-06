import { useState, useEffect } from 'react';
import { db, FIREBASE_READY } from '../../firebaseConfig';
import { ref, onValue } from 'firebase/database';

interface EventLog {
    id: string | number;
    time: string;
    event: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp?: number;
}

// ── Event log sample data — fallback when Firebase is offline ─────────────────
const SAMPLE_LOGS: EventLog[] = [
    { id: 1, time: '08:05 AM', event: 'Bus 03 departed from School', type: 'info', timestamp: Date.now() },
    { id: 2, time: '08:22 AM', event: 'Bus 01 arrived at Stop A', type: 'success', timestamp: Date.now() - 10000 },
    { id: 3, time: '09:10 AM', event: 'Bus 07 delayed — traffic', type: 'warning', timestamp: Date.now() - 50000 },
];

interface Driver {
    driver_id: number;
    first_name: string;
    last_name: string;
    phone: string;
    nic_number: string;
    bus_plate: string;
    bus_number: string;
    username: string;
    status: string;
}

import defaultDrivers from '../data/drivers.json';

export default function Logs() {
    const [tab, setTab] = useState<'events' | 'drivers'>('events');
    const [search, setSearch] = useState('');
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [logs, setLogs] = useState<EventLog[]>(SAMPLE_LOGS);
    const [loading, setLoading] = useState(false);

    // Fetch live events from Firebase
    useEffect(() => {
        if (!FIREBASE_READY) return;

        const eventsRef = ref(db as any, 'events');
        const unsubscribe = onValue(eventsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const fetched: EventLog[] = [];
                Object.keys(data).forEach(key => {
                    const evt = data[key];
                    const date = new Date(evt.timestamp || Date.now());
                    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    let uiType: 'info' | 'success' | 'warning' | 'error' = 'info';
                    if (evt.type === 'trip_started' || evt.type === 'trip_ended') uiType = 'success';
                    if (evt.type === 'delay_reported') uiType = 'warning';
                    if (evt.type === 'sos' || evt.message?.includes('SOS')) uiType = 'error';
                    if (evt.type === 'message_sent') uiType = 'info';

                    fetched.push({
                        id: key,
                        time: timeStr,
                        event: evt.message || `${evt.type} - ${evt.busPlate}`,
                        type: uiType,
                        timestamp: evt.timestamp || Date.now()
                    });
                });

                fetched.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                setLogs(fetched);
            }
        });

        return () => unsubscribe();
    }, []);

    // Fetch registered drivers from localStorage when tab switches
    useEffect(() => {
        if (tab !== 'drivers') return;
        setLoading(true);
        setTimeout(() => {
            const local = localStorage.getItem('edutrack_drivers');
            if (local) {
                setDrivers(JSON.parse(local));
            } else {
                localStorage.setItem('edutrack_drivers', JSON.stringify(defaultDrivers));
                // @ts-ignore - mock data compat
                setDrivers(defaultDrivers);
            }
            setLoading(false);
        }, 400); // simulate network latency
    }, [tab]);

    const filteredLogs = logs.filter(l =>
        l.event.toLowerCase().includes(search.toLowerCase())
    );

    const filteredDrivers = drivers.filter(d =>
        `${d.first_name} ${d.last_name} ${d.username} ${d.bus_plate} ${d.bus_number}`
            .toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="logs-page">
            <div className="page-header">
                <h1>Logs</h1>
                <p>System activity records and registered driver directory.</p>
            </div>

            {/* Tab switcher */}
            <div className="logs-tabs">
                <button
                    className={`logs-tab-btn ${tab === 'events' ? 'active' : ''}`}
                    onClick={() => { setTab('events'); setSearch(''); }}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    Event Logs
                </button>
                <button
                    className={`logs-tab-btn ${tab === 'drivers' ? 'active' : ''}`}
                    onClick={() => { setTab('drivers'); setSearch(''); }}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Registered Drivers
                </button>
            </div>

            {/* Search + filters */}
            <div className="logs-toolbar">
                <input
                    className="logs-search"
                    type="text"
                    placeholder={tab === 'events' ? 'Search events…' : 'Search drivers…'}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                {tab === 'events' && (
                    <>
                        <button className="logs-filter-btn">All Types</button>
                        <button className="logs-filter-btn">Today</button>
                    </>
                )}
            </div>

            {/* ── Event Logs Tab ── */}
            {tab === 'events' && (
                <div className="logs-table-wrapper">
                    {filteredLogs.length > 0 ? (
                        <table className="logs-table">
                            <thead>
                                <tr>
                                    <th>#</th><th>Time</th><th>Event</th><th>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map(log => (
                                    <tr key={log.id}>
                                        <td style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{log.id}</td>
                                        <td style={{ fontVariantNumeric: 'tabular-nums', color: '#64748b' }}>{log.time}</td>
                                        <td>{log.event}</td>
                                        <td><span className={`log-badge ${log.type}`}>{log.type.charAt(0).toUpperCase() + log.type.slice(1)}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="logs-empty"><div className="logs-empty-icon">📋</div><p>No logs match your search.</p></div>
                    )}
                </div>
            )}

            {/* ── Registered Drivers Tab ── */}
            {tab === 'drivers' && (
                <div className="logs-table-wrapper">
                    {loading ? (
                        <div className="logs-empty"><div className="logs-empty-icon">⟳</div><p>Loading drivers…</p></div>
                    ) : filteredDrivers.length > 0 ? (
                        <table className="logs-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Full Name</th>
                                    <th>Phone</th>
                                    <th>NIC</th>
                                    <th>Bus Plate</th>
                                    <th>Bus No.</th>
                                    <th>Username</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDrivers.map((d, i) => (
                                    <tr key={d.driver_id}>
                                        <td style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{i + 1}</td>
                                        <td><strong>{d.first_name} {d.last_name}</strong></td>
                                        <td>{d.phone}</td>
                                        <td style={{ fontFamily: 'monospace' }}>{d.nic_number}</td>
                                        <td><span className="log-badge info">{d.bus_plate}</span></td>
                                        <td>{d.bus_number}</td>
                                        <td style={{ color: '#64748b' }}>{d.username}</td>
                                        <td>
                                            <span className={`log-badge ${d.status === 'active' ? 'success' : 'warning'}`}>
                                                {d.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="logs-empty">
                            <div className="logs-empty-icon">👤</div>
                            <p>{search ? 'No drivers match your search.' : 'No registered drivers yet. Use the Registration page to add one.'}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
