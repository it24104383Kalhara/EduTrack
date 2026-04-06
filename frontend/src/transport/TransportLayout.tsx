import { useState } from 'react';
import Sidebar, { type TransportPage } from './Sidebar';
import Dashboard from './pages/Dashboard';
import LiveMap from './pages/LiveMap';
import Logs from './pages/Logs';
import Messages from './pages/Messages';
import Registration from './pages/Registration';
import Settings from './pages/Settings';
import './transport.css';

export default function TransportLayout() {
    const [activePage, setActivePage] = useState<TransportPage>('dashboard');

    const renderPage = () => {
        switch (activePage) {
            case 'dashboard': return <Dashboard />;
            case 'livemap': return <LiveMap />;
            case 'logs': return <Logs />;
            case 'messages': return <Messages />;
            case 'registration': return <Registration />;
            case 'settings': return <Settings />;
            default: return <Dashboard />;
        }
    };

    return (
        <div className="transport-shell">
            <Sidebar activePage={activePage} onNavigate={setActivePage} />
            <main className="transport-content">
                {renderPage()}
            </main>
        </div>
    );
}
