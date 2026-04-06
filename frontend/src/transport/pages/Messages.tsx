import { useState } from 'react';

interface Message {
    id: number;
    sender: string;
    text: string;
    time: string;
    mine: boolean;
}

interface Contact {
    id: number;
    name: string;
    role: string;
    last: string;
    unread: number;
    online: boolean;
}

const CONTACTS: Contact[] = [
    { id: 1, name: 'Suresh Perera', role: 'Driver – BUS-01', last: 'On my way to stop A', unread: 2, online: true },
    { id: 2, name: 'Kamal Silva', role: 'Driver – BUS-02', last: 'Arrived at school', unread: 0, online: false },
    { id: 3, name: 'Nimal Fernando', role: 'Driver – BUS-03', last: 'Slight delay, 5 mins', unread: 1, online: true },
    { id: 4, name: 'Admin Office', role: 'Admin', last: 'Please check route 5', unread: 0, online: true },
];

const SEED_MESSAGES: Record<number, Message[]> = {
    1: [
        { id: 1, sender: 'Suresh Perera', text: 'On my way to stop A', time: '08:10', mine: false },
        { id: 2, sender: 'You', text: 'OK, students are waiting', time: '08:11', mine: true },
        { id: 3, sender: 'Suresh Perera', text: 'Arriving in 3 minutes', time: '08:13', mine: false },
    ],
    2: [
        { id: 1, sender: 'Kamal Silva', text: 'Arrived at school', time: '07:55', mine: false },
    ],
    3: [
        { id: 1, sender: 'Nimal Fernando', text: 'Slight delay, 5 mins', time: '08:30', mine: false },
        { id: 2, sender: 'You', text: 'Please inform parents', time: '08:31', mine: true },
    ],
    4: [
        { id: 1, sender: 'Admin Office', text: 'Please check route 5', time: '09:00', mine: false },
    ],
};

export default function Messages() {
    const [selected, setSelected] = useState<Contact>(CONTACTS[0]);
    const [threads, setThreads] = useState(SEED_MESSAGES);
    const [draft, setDraft] = useState('');

    const messages = threads[selected.id] || [];

    function sendMessage() {
        const text = draft.trim();
        if (!text) return;
        const msg: Message = {
            id: Date.now(),
            sender: 'You',
            text,
            time: new Date().toTimeString().slice(0, 5),
            mine: true,
        };
        setThreads(prev => ({ ...prev, [selected.id]: [...(prev[selected.id] || []), msg] }));
        setDraft('');
    }

    return (
        <div className="msg-page">
            {/* Contacts List */}
            <div className="msg-contacts">
                <div className="msg-contacts-header">
                    <span>Messages</span>
                </div>
                {CONTACTS.map(c => (
                    <button
                        key={c.id}
                        className={`msg-contact-btn ${selected.id === c.id ? 'active' : ''}`}
                        onClick={() => setSelected(c)}
                    >
                        <div className="msg-avatar">
                            {c.name.charAt(0)}
                            {c.online && <span className="msg-online-dot" />}
                        </div>
                        <div className="msg-contact-info">
                            <span className="msg-contact-name">{c.name}</span>
                            <span className="msg-contact-last">{c.last}</span>
                        </div>
                        {c.unread > 0 && (
                            <span className="msg-unread-badge">{c.unread}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Thread */}
            <div className="msg-thread">
                {/* Thread header */}
                <div className="msg-thread-header">
                    <div className="msg-avatar lg">
                        {selected.name.charAt(0)}
                        {selected.online && <span className="msg-online-dot" />}
                    </div>
                    <div>
                        <div className="msg-thread-name">{selected.name}</div>
                        <div className="msg-thread-role">{selected.role} · {selected.online ? 'Online' : 'Offline'}</div>
                    </div>
                </div>

                {/* Messages */}
                <div className="msg-body">
                    {messages.map(m => (
                        <div key={m.id} className={`msg-bubble-wrap ${m.mine ? 'mine' : ''}`}>
                            <div className={`msg-bubble ${m.mine ? 'mine' : ''}`}>
                                <span>{m.text}</span>
                                <span className="msg-time">{m.time}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input */}
                <div className="msg-input-row">
                    <input
                        className="msg-input"
                        type="text"
                        placeholder={`Message ${selected.name}…`}
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                    />
                    <button className="msg-send-btn" onClick={sendMessage}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
