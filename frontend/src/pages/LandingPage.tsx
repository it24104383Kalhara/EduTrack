import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const Icon = {
    menu: <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>,
    close: <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
    trophy: <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4m-7-9a7 7 0 0114 0v1H3v-1z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 8V5H3m15 3V5h3" /></svg>,
    chart: <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    building: <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    truck: <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 .001M13 16H9m4 0h5l1-5H13V7" /></svg>,
    heart: <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
    book: <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    users: <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    star: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
    arrow: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>,
    check: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
    sparkle: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>,
};

const MODULES = [
    {
        id: 'sports',
        label: 'Sports',
        icon: Icon.trophy,
        color: 'text-orange-500',
        bg: 'bg-[#FFF0E6]',
        border: 'border-orange-100',
        accent: 'from-orange-400 to-orange-500',
        desc: 'Manage activities, clubs, attendance tracking and coach reports for all sports & extracurricular programs.',
        stats: '24 Active Clubs',
        href: '/sports/activities',
    },
    {
        id: 'progress',
        label: 'Student Progress',
        icon: Icon.chart,
        color: 'text-[#633194]',
        bg: 'bg-[#F4F0FF]',
        border: 'border-purple-100',
        accent: 'from-[#633194] to-[#9b59b6]',
        desc: 'Track academic performance, achievements, and behavioral records for every student in real time.',
        stats: '1,248 Students',
        href: '#',
    },
    {
        id: 'hostel',
        label: 'Hostel',
        icon: Icon.building,
        color: 'text-blue-500',
        bg: 'bg-[#E1F5FE]',
        border: 'border-blue-100',
        accent: 'from-blue-400 to-blue-600',
        desc: 'Oversee room allocation, student check-ins, fees, and hostel facility management with ease.',
        stats: '320 Rooms',
        href: '#',
    },
    {
        id: 'transport',
        label: 'Transport',
        icon: Icon.truck,
        color: 'text-emerald-600',
        bg: 'bg-[#E8F5E9]',
        border: 'border-green-100',
        accent: 'from-emerald-400 to-emerald-600',
        desc: 'Schedule bus routes, track vehicles in real time, and manage driver assignments and student boarding.',
        stats: '18 Bus Routes',
        href: '#',
    },
    {
        id: 'health',
        label: 'Health',
        icon: Icon.heart,
        color: 'text-rose-500',
        bg: 'bg-rose-50',
        border: 'border-rose-100',
        accent: 'from-rose-400 to-pink-500',
        desc: 'Maintain student health records, medical appointments, vaccinations, and nurse visit logs digitally.',
        stats: '98% Records',
        href: '#',
    },
    {
        id: 'library',
        label: 'Library',
        icon: Icon.book,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-100',
        accent: 'from-amber-400 to-yellow-500',
        desc: 'Catalog books, manage lending & returns, track overdue items, and send automated reminders.',
        stats: '8,500 Books',
        href: '#',
    },
];

const STATS = [
    { value: '12,768', label: 'Total Students', icon: Icon.users },
    { value: '320+', label: 'Teaching Staff', icon: Icon.users },
    { value: '24', label: 'Active Clubs', icon: Icon.trophy },
    { value: '6', label: 'Core Modules', icon: Icon.sparkle },
];

const TESTIMONIALS = [
    { name: 'Dr. Priya Mendis', role: 'Principal, Royal College', text: 'EduTrack transformed the way we manage our school. The attendance and reporting tools alone saved us hours every week.', avatar: 'P' },
    { name: 'Mr. Chamara Silva', role: 'Sports Coordinator', text: "Managing 24 clubs used to be chaos. Now I can see every student's attendance and submit reports in minutes.", avatar: 'C' },
    { name: 'Ms. Nilufar Perera', role: 'Head of Hostel', text: 'The hostel module is intuitive and powerful. Room allocation and fee tracking have never been this smooth.', avatar: 'N' },
];

const FEATURES = [
    'Real-time attendance tracking',
    'Multi-role access control',
    'Automated Principal reports',
    'Mobile-responsive dashboard',
    'Instant teacher notifications',
    'Cross-module data integration',
];

export default function LandingPage() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [activeModule, setActiveModule] = useState<string | null>(null);

    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 20);
            setShowBackToTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div className="min-h-screen bg-white font-sans antialiased text-gray-800 overflow-x-hidden">

            {/* ─── NAV ─────────────────────────────────────────────────────────────── */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 hover:opacity-80 transition-all group">
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform" style={{ background: 'linear-gradient(135deg,#633194,#9b59b6)' }}>
                            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" stroke="currentColor" strokeWidth={2}>
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold text-[#633194]">EduTrack</span>
                    </Link>

                    {/* Desktop Module Links */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {MODULES.map((m, idx) => (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * idx }}
                            >
                                <Link
                                    to={m.href}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-[#633194] hover:bg-[#F4F0FF] transition-all"
                                >
                                    <span className={`${m.color}`} style={{ display: 'flex' }}>
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                            {m.id === 'sports' && <><path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4m-7-9a7 7 0 0114 0v1H3v-1z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 8V5H3m15 3V5h3" /></>}
                                            {m.id === 'progress' && <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
                                            {m.id === 'hostel' && <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />}
                                            {m.id === 'transport' && <><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 .001M13 16H9m4 0h5l1-5H13V7" /></>}
                                            {m.id === 'health' && <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />}
                                            {m.id === 'library' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />}
                                        </svg>
                                    </span>
                                    {m.label}
                                </Link>
                            </motion.div>
                        ))}
                    </nav>

                    {/* CTA buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Link to="/login" className="hidden sm:block px-4 py-2 rounded-xl text-sm font-semibold text-[#633194] hover:bg-[#F4F0FF] transition-all">
                            Login
                        </Link>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Link
                                to="/dashboard"
                                className="px-4 py-2 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center"
                                style={{ background: 'linear-gradient(135deg,#633194,#9b59b6)' }}
                            >
                                Get Started
                            </Link>
                        </motion.div>
                        {/* Mobile hamburger */}
                        <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500" onClick={() => setMenuOpen(!menuOpen)}>
                            {menuOpen ? Icon.close : Icon.menu}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {menuOpen && (
                    <div className="lg:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-1 shadow-lg">
                        {MODULES.map(m => (
                            <a key={m.id} href={m.href} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:text-[#633194] ${m.bg} transition-all`}>
                                <span className={m.color}>{m.icon}</span> {m.label}
                            </a>
                        ))}
                        <div className="pt-2 border-t border-gray-100 mt-2">
                            <a href="/login" className="block px-3 py-2.5 text-sm font-semibold text-[#633194] rounded-xl hover:bg-[#F4F0FF] transition-all">Login</a>
                        </div>
                    </div>
                )}
            </header>

            {/* ─── HERO ─────────────────────────────────────────────────────────────── */}
            <section className="relative pt-28 pb-20 px-6 overflow-hidden" style={{ background: 'linear-gradient(160deg, #faf8ff 0%, #f0e9ff 40%, #e8f5fe 100%)' }}>
                {/* Background blobs */}
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #c39bd3 0%, transparent 70%)' }} />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #93c5fd 0%, transparent 70%)' }} />

                <div className="relative max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                        {/* LEFT — Copy */}
                        <div className="text-center lg:text-left">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 bg-white border border-purple-200 text-[#633194] text-xs font-bold px-3 py-1.5 rounded-full shadow-sm mb-6">
                                <span className="flex">{Icon.sparkle}</span>
                                All-in-one school management platform
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-gray-900 leading-tight mb-6">
                                Smart, Seamless,<br />
                                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg,#633194,#9b59b6)' }}>
                                    Powerful
                                </span>{' '}
                                School<br />Management
                            </h1>

                            <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
                                EduTrack brings Sports, Student Progress, Hostel, Transport, Health, and Library management into one elegant platform — built for modern schools.
                            </p>

                            {/* Feature checklist */}
                            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 mb-8 text-sm text-gray-600 max-w-md mx-auto lg:mx-0">
                                {FEATURES.map(f => (
                                    <li key={f} className="flex items-center gap-2">
                                        <span className="h-5 w-5 rounded-full bg-[#F4F0FF] text-[#633194] flex items-center justify-center flex-shrink-0">{Icon.check}</span>
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <motion.div 
                                className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Link
                                        to="/dashboard"
                                        className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white shadow-lg hover:shadow-xl transition-all"
                                        style={{ background: 'linear-gradient(135deg,#633194,#9b59b6)' }}
                                    >
                                        <span>Get Started Now</span>
                                        {Icon.arrow}
                                    </Link>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <a
                                        href="#modules"
                                        className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-[#633194] bg-white border-2 border-[#633194]/20 hover:border-[#633194] hover:bg-[#F4F0FF] transition-all"
                                    >
                                        Explore Modules
                                    </a>
                                </motion.div>
                            </motion.div>
                        </div>

                        {/* RIGHT — Visual hero */}
                        <div className="relative flex items-center justify-center">
                            {/* Big circle backdrop */}
                            <div className="absolute w-80 h-80 rounded-full opacity-60" style={{ background: 'linear-gradient(145deg, #e9d5ff, #c4b5fd)' }} />

                            {/* Central student illustration (stylized) */}
                            <div className="relative z-10 w-64 h-80 rounded-3xl overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(160deg,#633194 0%,#9b59b6 50%, #c39bd3 100%)' }}>
                                {/* Decorative shapes inside */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                                    <div className="h-20 w-20 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center">
                                        <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10 text-white" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                        </svg>
                                    </div>
                                    <p className="text-white font-bold text-lg text-center leading-tight">EduTrack</p>
                                    <p className="text-white/75 text-xs text-center">Your complete school management ecosystem</p>
                                    {/* Mini module icons */}
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {MODULES.map(m => (
                                            <div key={m.id} className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center" title={m.label}>
                                                <span className="text-white [&>svg]:h-5 [&>svg]:w-5">{m.icon}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Floating stat cards */}
                            <div className="absolute -left-4 top-8 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 z-20 border border-gray-100 animate-bounce" style={{ animationDuration: '3s' }}>
                                <div className="h-9 w-9 rounded-xl bg-[#F4F0FF] flex items-center justify-center text-[#633194]">{Icon.users}</div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium">Total Students</p>
                                    <p className="text-lg font-extrabold text-gray-800">12,768</p>
                                </div>
                            </div>

                            <div className="absolute -right-4 bottom-16 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 z-20 border border-gray-100 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
                                <div className="h-9 w-9 rounded-xl bg-[#FFF0E6] flex items-center justify-center text-orange-500">{Icon.trophy}</div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium">Active Clubs</p>
                                    <p className="text-lg font-extrabold text-gray-800">24</p>
                                </div>
                            </div>

                            <div className="absolute -right-2 top-6 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 z-20 border border-gray-100 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                                <div className="h-9 w-9 rounded-xl bg-[#E8F5E9] flex items-center justify-center text-emerald-500">{Icon.check}</div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium">Attendance Rate</p>
                                    <p className="text-lg font-extrabold text-gray-800">94.2%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── TRUSTED BY / STATS STRIP ────────────────────────────────────────── */}
            <section className="py-14 border-y border-gray-100 bg-white">
                <div className="max-w-5xl mx-auto px-6">
                    <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">Trusted across departments</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                        {STATS.map(s => (
                            <div key={s.label} className="flex flex-col items-center gap-2 text-center">
                                <p className="text-4xl font-extrabold text-gray-900">{s.value}</p>
                                <p className="text-sm text-gray-500 font-medium">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── MODULES GRID ─────────────────────────────────────────────────────── */}
            <section id="modules" className="py-24 px-6 bg-[#F9FAFB]">
                <div className="max-w-7xl mx-auto">
                    {/* Section header */}
                    <div className="text-center mb-14">
                        <div className="inline-flex items-center gap-2 bg-[#F4F0FF] border border-purple-200 text-[#633194] text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                            {Icon.sparkle} Core Modules
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
                            Everything your school needs,<br className="hidden sm:block" /> in one platform
                        </h2>
                        <p className="text-gray-500 text-lg max-w-xl mx-auto">
                            Six powerful modules covering every dimension of school management — connected, real-time, and easy to use.
                        </p>
                    </div>

                    {/* Module Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {MODULES.map((m, idx) => (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 * idx }}
                            >
                                <Link
                                    to={m.href}
                                    onMouseEnter={() => setActiveModule(m.id)}
                                    onMouseLeave={() => setActiveModule(null)}
                                    className={`group relative h-full bg-white rounded-3xl border ${m.border} p-6 flex flex-col gap-4 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
                                >
                                    {/* Accent gradient on hover */}
                                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${m.accent} transition-all duration-300 ${activeModule === m.id ? 'h-1.5' : ''}`} />

                                    {/* Icon */}
                                    <div className={`h-13 w-13 rounded-2xl ${m.bg} flex items-center justify-center ${m.color} transition-transform group-hover:scale-110`} style={{ height: 52, width: 52 }}>
                                        {m.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className={`text-base font-bold text-gray-800 group-hover:${m.color} transition-colors`}>{m.label}</h3>
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${m.bg} ${m.color} border ${m.border}`}>{m.stats}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 leading-relaxed">{m.desc}</p>
                                    </div>

                                    {/* Arrow link */}
                                    <div className={`flex items-center gap-1.5 text-xs font-bold ${m.color} transition-all group-hover:gap-2.5`}>
                                        Open Module
                                        <span className="group-hover:translate-x-1 transition-transform">{Icon.arrow}</span>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── FEATURE HIGHLIGHT ────────────────────────────────────────────────── */}
            <section className="py-24 px-6 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        {/* Left — visual */}
                        <div className="relative">
                            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(135deg,#633194 0%,#9b59b6 60%,#c39bd3 100%)' }}>
                                <div className="p-8 h-full flex flex-col justify-between">
                                    {/* Mock dashboard header */}
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
                                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth={2}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </div>
                                        <span className="font-bold text-white text-sm">EduTrack Admin Dashboard</span>
                                    </div>

                                    {/* Mock stat cards */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { l: 'Students', v: '1,248', clr: 'bg-blue-300/20' },
                                            { l: 'Employees', v: '132', clr: 'bg-purple-300/20' },
                                            { l: 'Activities', v: '24', clr: 'bg-orange-300/20' },
                                            { l: 'Reports', v: '48', clr: 'bg-emerald-300/20' },
                                        ].map(c => (
                                            <div key={c.l} className={`${c.clr} backdrop-blur-sm rounded-2xl p-3 border border-white/20`}>
                                                <p className="text-white/70 text-xs">{c.l}</p>
                                                <p className="text-white font-extrabold text-2xl">{c.v}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Attendance progress mock */}
                                    <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20">
                                        <div className="flex justify-between text-xs text-white/80 mb-2">
                                            <span className="font-semibold">Attendance Rate</span>
                                            <span className="font-bold">94.2%</span>
                                        </div>
                                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                            <div className="h-full w-[94%] bg-white rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating card */}
                            <div className="absolute -bottom-5 -right-5 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                                <p className="text-xs text-gray-400 font-medium">Today's Reports</p>
                                <p className="text-2xl font-extrabold text-gray-800">📊 12 <span className="text-sm text-emerald-500 font-semibold">+3 new</span></p>
                            </div>
                        </div>

                        {/* Right — text */}
                        <div>
                            <div className="inline-flex items-center gap-2 bg-[#F4F0FF] border border-purple-200 text-[#633194] text-xs font-bold px-3 py-1.5 rounded-full mb-6">
                                {Icon.sparkle} Why EduTrack?
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-5 leading-tight">
                                Unlock the future of<br />
                                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg,#633194,#9b59b6)' }}>learning management</span>
                            </h2>
                            <p className="text-gray-500 text-base mb-8 leading-relaxed">
                                EduTrack brings powerful automation and real-time insights to every corner of your school — from the sports field to the library. One login, complete control.
                            </p>
                            <ul className="space-y-4 mb-8">
                                {[
                                    { title: 'Instant Notifications', desc: 'Teachers and principals get instant alerts when reports are submitted or approved.' },
                                    { title: 'Role-Based Access', desc: 'Admins, Coaches, Teachers and Students each see exactly what they need.' },
                                    { title: 'Auto-Generated Reports', desc: 'Attendance reports compile automatically from session data — no manual entry.' },
                                ].map(f => (
                                    <li key={f.title} className="flex gap-4">
                                        <div className="h-8 w-8 rounded-xl bg-[#F4F0FF] text-[#633194] flex items-center justify-center flex-shrink-0 mt-0.5">{Icon.check}</div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{f.title}</p>
                                            <p className="text-sm text-gray-500 mt-0.5">{f.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <a
                                href="/dashboard"
                                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                                style={{ background: 'linear-gradient(135deg,#633194,#9b59b6)' }}
                            >
                                Try the Dashboard {Icon.arrow}
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── TESTIMONIALS ─────────────────────────────────────────────────────── */}
            <section className="py-24 px-6 bg-[#F9FAFB]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">The sound of success</h2>
                        <p className="text-gray-500 text-lg">Hear from the educators and coordinators who use EduTrack daily.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {TESTIMONIALS.map(t => (
                            <div key={t.name} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                                {/* Stars */}
                                <div className="flex gap-0.5 text-amber-400 mb-4">
                                    {[...Array(5)].map((_, i) => <span key={i}>{Icon.star}</span>)}
                                </div>
                                <p className="text-sm text-gray-600 italic leading-relaxed mb-5">"{t.text}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: 'linear-gradient(135deg,#633194,#9b59b6)' }}>
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{t.name}</p>
                                        <p className="text-xs text-gray-500">{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CTA BAND ─────────────────────────────────────────────────────────── */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center rounded-3xl p-12 shadow-2xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#633194 0%,#9b59b6 60%,#c39bd3 100%)' }}>
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle,#fff,transparent 70%)', transform: 'translate(30%,-30%)' }} />
                    <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle,#fff,transparent 70%)', transform: 'translate(-30%,30%)' }} />

                    <div className="relative z-10">
                        <p className="text-white/80 text-sm font-semibold uppercase tracking-widest mb-4">Ready to get started?</p>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">EduTrack is widely acclaimed<br />by school management teams.</h2>
                        <p className="text-white/75 text-base mb-8 max-w-xl mx-auto">
                            Join hundreds of educators who have streamlined their school operations with our comprehensive, easy-to-use platform.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <a
                                href="/dashboard"
                                className="px-7 py-3.5 rounded-2xl text-sm font-bold bg-white text-[#633194] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                            >
                                Enter Dashboard
                            </a>
                            <a
                                href="#modules"
                                className="px-7 py-3.5 rounded-2xl text-sm font-bold text-white border-2 border-white/40 hover:bg-white/10 transition-all"
                            >
                                Explore Modules
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── FOOTER ───────────────────────────────────────────────────────────── */}
            <footer className="bg-gray-900 text-gray-400 py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                        {/* Brand */}
                        <div className="lg:col-span-1">
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#633194,#9b59b6)' }}>
                                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth={2}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                                <span className="text-white font-bold">EduTrack</span>
                            </div>
                            <p className="text-sm leading-relaxed">A comprehensive school management platform unifying all departments under one roof.</p>
                        </div>

                        {/* Modules */}
                        <div>
                            <h4 className="text-white font-semibold text-sm mb-3">Modules</h4>
                            <ul className="space-y-2 text-sm">
                                {MODULES.map(m => <li key={m.id}><a href={m.href} className="hover:text-white transition-colors">{m.label}</a></li>)}
                            </ul>
                        </div>

                        {/* Platform */}
                        <div>
                            <h4 className="text-white font-semibold text-sm mb-3">Platform</h4>
                            <ul className="space-y-2 text-sm">
                                {['Dashboard', 'Attendance', 'Reports', 'Notifications', 'Analytics'].map(l => (
                                    <li key={l}><a href="/dashboard" className="hover:text-white transition-colors">{l}</a></li>
                                ))}
                            </ul>
                        </div>

                        {/* Info */}
                        <div>
                            <h4 className="text-white font-semibold text-sm mb-3">School Info</h4>
                            <ul className="space-y-2 text-sm">
                                <li>🎓 Management System</li>
                                <li>📅 Academic Year 2025/26</li>
                                <li>🌐 edutrack.school</li>
                                <li>📧 admin@edutrack.school</li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <p>© 2026 EduTrack School Management Platform. All rights reserved.</p>
                        <div className="flex gap-4">
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
            {/* ─── BACK TO TOP ────────────────────────────────────────────── */}
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                aria-label="Back to top"
                className="fixed bottom-8 right-8 z-50 h-12 w-12 rounded-2xl text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                style={{
                    background: 'linear-gradient(135deg,#633194,#9b59b6)',
                    opacity: showBackToTop ? 1 : 0,
                    transform: showBackToTop ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.9)',
                    pointerEvents: showBackToTop ? 'auto' : 'none',
                }}
            >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
            </button>
        </div>
    );
}
