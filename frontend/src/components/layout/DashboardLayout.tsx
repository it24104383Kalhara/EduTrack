import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../../utils/auth";
import clsx from "clsx";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { reportService } from "../../services/api";
import {
    HomeIcon,
    AcademicCapIcon,
    BriefcaseIcon,
    UsersIcon,
    RectangleStackIcon,
    BuildingOfficeIcon,
    CalendarDaysIcon,
    TrophyIcon,
    ChatBubbleLeftEllipsisIcon,
    DocumentTextIcon,
    ShieldCheckIcon,
    BellAlertIcon,
    MagnifyingGlassIcon,
    BellIcon,
    ChatBubbleOvalLeftIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    Bars3Icon,
    ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import ConfirmationModal from "../ui/ConfirmationModal";
import { motion } from "framer-motion";

interface DashboardLayoutProps {
    children?: React.ReactNode;
}

interface NavGroup {
    name: string;
    icon: React.ElementType;
    path?: string;
    children?: { name: string; path: string; allowedRoles?: string[] }[];
    allowedRoles?: string[];
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [expandedGroups, setExpandedGroups] = useState<string[]>(['Sports']);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const notificationsRef = useRef<HTMLDivElement>(null);

    // Fetch real-time notification data
    const isTeacher = user?.role === 'Teacher';
    const isPrincipalOrAdmin = user?.role === 'Principal' || user?.role === 'Admin';

    const { data: teacherNotifications } = useQuery({
        queryKey: ['myNotifications'],
        queryFn: reportService.getMyNotifications,
        enabled: isTeacher,
        refetchInterval: 30_000,
    });

    const { data: principalReports } = useQuery({
        queryKey: ['allReports', 'Pending'],
        queryFn: () => reportService.getAll({ status: 'Pending' }),
        enabled: isPrincipalOrAdmin,
        refetchInterval: 30_000,
    });

    const teacherAlertCount = teacherNotifications?.filter(n => n.status !== 'Actioned').length ?? 0;
    const principalPendingCount = principalReports?.length ?? 0;
    const totalNotifications = isTeacher ? teacherAlertCount : (isPrincipalOrAdmin ? principalPendingCount : 0);

    const navGroups: NavGroup[] = [
        {
            name: 'Dashboard',
            icon: HomeIcon,
            path: '/dashboard',
        },
        {
            name: 'Sports & Activities',
            icon: UsersIcon,
            children: [
                { name: 'Activities & Clubs', path: '/sports/activities' },
                { name: 'Attendance', path: '/sports/attendance', allowedRoles: ['Admin', 'Coach', 'Teacher'] },
                { name: 'Submit Report', path: '/sports/attendance/report', allowedRoles: ['Admin', 'Coach', 'Teacher'] },
            ],
        },
        {
            name: 'Administration',
            icon: ShieldCheckIcon,
            allowedRoles: ['Admin'],
            children: [
                { name: 'Principal View', path: '/sports/principal' },
                { name: 'Teacher Alerts', path: '/sports/teacher-notifications' },
            ],
        },
        { name: 'Academics', icon: AcademicCapIcon, path: '/academics' },
        { name: 'Inventory', icon: RectangleStackIcon, path: '/sports/inventory' },
        { name: 'Facilities', icon: BuildingOfficeIcon, path: '/sports/facilities' },
        { name: 'Achievements', icon: TrophyIcon, path: '/sports/achievements' },
        { name: 'Management', icon: BriefcaseIcon, path: '/admin' },
    ];

    const toggleGroup = (name: string) => {
        setExpandedGroups(prev =>
            prev.includes(name) ? prev.filter(g => g !== name) : [...prev, name]
        );
    };

    const isGroupActive = (group: NavGroup): boolean => {
        if (group.path) return location.pathname === group.path;
        if (group.children) return group.children.some(c => location.pathname === c.path);
        return false;
    };

    // --- Search Functionality ---
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<{name: string, path: string}[]>([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Flattened searchable items
    const searchableItems = navGroups.flatMap(group => {
        if (group.children) {
            return group.children.map(child => ({
                name: `${group.name} > ${child.name}`,
                path: child.path,
                keywords: [child.name, group.name]
            }));
        }
        return [{
            name: group.name,
            path: group.path!,
            keywords: [group.name]
        }];
    });

    // Revert filtering - show all groups
    const finalNavGroups = navGroups;

    useEffect(() => {
        if (searchQuery.trim() === "") {
            setSearchResults([]);
            return;
        }
        const results = searchableItems.filter(item => 
            item.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setSearchResults(results);
    }, [searchQuery]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchFocused(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearchItemClick = (path: string) => {
        navigate(path);
        setSearchQuery("");
        setSearchResults([]);
        setIsSearchFocused(false);
        setMobileSidebarOpen(false);
    };



    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <Link to="/" className="px-6 py-5 flex items-center gap-3 border-b border-purple-100 hover:opacity-80 transition-all group">
                <div className="h-9 w-9 bg-[#633194] rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" stroke="currentColor" strokeWidth={2}>
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-lg font-bold text-[#633194] tracking-wide leading-none">EduTrack</h1>
                    <p className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold">Management</p>
                </div>
            </Link>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {finalNavGroups.map((group) => {
                    const active = isGroupActive(group);
                    const expanded = expandedGroups.includes(group.name);

                    if (group.path) {
                        // Simple link item
                        return (
                            <Link
                                key={group.path}
                                to={group.path}
                                onClick={() => setMobileSidebarOpen(false)}
                                className={clsx(
                                    "relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                                    active
                                        ? "bg-[#F4F0FF] text-[#633194]"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-[#633194]"
                                )}
                            >
                                {active && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#633194] rounded-r-full" />
                                )}
                                <group.icon className={clsx(
                                    "h-5 w-5 flex-shrink-0 transition-colors",
                                    active ? "text-[#633194]" : "text-gray-400 group-hover:text-[#633194]"
                                )} />
                                <span>{group.name}</span>
                            </Link>
                        );
                    }

                    // Group with children
                    return (
                        <div key={group.name}>
                            <button
                                onClick={() => toggleGroup(group.name)}
                                className={clsx(
                                    "relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                                    active
                                        ? "text-[#633194]"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-[#633194]"
                                )}
                            >
                                <group.icon className={clsx(
                                    "h-5 w-5 flex-shrink-0 transition-colors",
                                    active ? "text-[#633194]" : "text-gray-400 group-hover:text-[#633194]"
                                )} />
                                <span className="flex-1 text-left">{group.name}</span>
                                {expanded
                                    ? <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                                    : <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                                }
                            </button>

                            {expanded && (
                                <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-purple-100 pl-3">
                                    {group.children!.map(child => {
                                        const childActive = location.pathname === child.path;
                                        return (
                                            <Link
                                                key={child.path}
                                                to={child.path}
                                                onClick={() => setMobileSidebarOpen(false)}
                                                className={clsx(
                                                    "relative flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                                    childActive
                                                        ? "bg-[#F4F0FF] text-[#633194]"
                                                        : "text-gray-500 hover:bg-gray-50 hover:text-[#633194]"
                                                )}
                                            >
                                                {childActive && (
                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#633194] rounded-r-full" />
                                                )}
                                                {child.name}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Bottom User Card */}
            <div className="px-3 py-4 border-t border-gray-100">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#F4F0FF]">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#633194] to-[#9b59b6] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {user?.name?.charAt(0) ?? 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                        <p className="text-xs text-purple-500 truncate">{user?.role}</p>
                    </div>
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        title="Logout"
                        className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-white/50 transition-all"
                    >
                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex h-screen bg-[#F9FAFB] font-sans"
        >
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 bg-white shadow-sm flex-col flex-shrink-0 border-r border-gray-100 z-10">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {mobileSidebarOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setMobileSidebarOpen(false)}
                    />
                    <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl z-50 flex flex-col">
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Header */}
                <header className="bg-white border-b border-gray-100 z-40 flex-shrink-0 shadow-sm sticky top-0">
                    <div className="px-4 sm:px-6 py-3 flex items-center gap-4">
                        {/* Mobile menu button */}
                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                            onClick={() => setMobileSidebarOpen(true)}
                        >
                            <Bars3Icon className="h-5 w-5" />
                        </button>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-md relative" ref={searchRef}>
                            <MagnifyingGlassIcon className={clsx(
                                "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                                isSearchFocused ? "text-[#633194]" : "text-gray-400"
                            )} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                placeholder="What do you want to find?"
                                className={clsx(
                                    "w-full pl-9 pr-4 py-2 text-sm bg-[#F9FAFB] border rounded-xl focus:outline-none transition-all placeholder:text-gray-400",
                                    isSearchFocused 
                                        ? "border-[#633194] ring-4 ring-[#633194]/10 bg-white" 
                                        : "border-gray-200"
                                )}
                            />

                            {/* Search Results Dropdown */}
                            {isSearchFocused && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in slide-in-from-top-1 duration-200">
                                    <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Matched Sections</p>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto p-2">
                                        {searchResults.map((result, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSearchItemClick(result.path)}
                                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#F4F0FF] transition-all group group-hover:scale-[1.01]"
                                            >
                                                <span className="text-sm font-semibold text-gray-700 group-hover:text-[#633194]">{result.name}</span>
                                                <ChevronRightIcon className="h-4 w-4 text-gray-300 group-hover:text-[#633194] group-hover:translate-x-0.5 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {isSearchFocused && searchQuery.trim() !== "" && searchResults.length === 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 text-center z-[100] animate-in slide-in-from-top-1 duration-200">
                                    <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <MagnifyingGlassIcon className="h-6 w-6 text-gray-300" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-800">No results found</p>
                                    <p className="text-xs text-gray-500 mt-1">Try a different keyword</p>
                                </div>
                            )}
                        </div>

                         <div className="flex items-center gap-2 ml-auto">
                            {/* Notification Icons */}
                            <div className="relative" ref={notificationsRef}>
                                <button 
                                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                                    className="relative p-2 rounded-xl hover:bg-[#F4F0FF] text-gray-500 hover:text-[#633194] transition-all group"
                                >
                                    <motion.div
                                        animate={['Admin', 'Teacher', 'Principal'].includes(user?.role ?? '') ? {
                                            rotate: [0, -10, 10, -10, 10, 0],
                                        } : {}}
                                        transition={{
                                            duration: 0.5,
                                            repeat: Infinity,
                                            repeatDelay: 5
                                        }}
                                    >
                                        <BellIcon className="h-5 w-5" />
                                    </motion.div>
                                    
                                    {totalNotifications > 0 && (
                                        <>
                                            {/* Water Bubbling Effect */}
                                            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[#633194] rounded-full ring-2 ring-white z-10" />
                                            {[0, 0.4, 0.8].map((delay) => (
                                                <motion.span 
                                                    key={delay}
                                                    initial={{ scale: 0.6, opacity: 0.6 }}
                                                    animate={{ scale: 2.5, opacity: 0 }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: Infinity,
                                                        delay: delay,
                                                        ease: "easeOut"
                                                    }}
                                                    className="absolute top-1.5 right-1.5 h-2 w-2 bg-[#633194] rounded-full ring-2 ring-white"
                                                />
                                            ))}
                                        </>
                                    )}
                                </button>

                                {/* Notification Window */}
                                {notificationsOpen && ['Admin', 'Teacher', 'Principal'].includes(user?.role ?? '') && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[110]"
                                    >
                                        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Notifications</p>
                                        </div>
                                        <div className="p-4">
                                            {isTeacher && (
                                                <div className="space-y-4">
                                                    <div className="flex gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                                                            <BellAlertIcon className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-800">Action Required</p>
                                                            <p className="text-xs text-gray-500 leading-relaxed">{teacherAlertCount} student activities have pending attendance alerts.</p>
                                                        </div>
                                                    </div>
                                                    <Link 
                                                        to="/sports/teacher-notifications" 
                                                        onClick={() => setNotificationsOpen(false)}
                                                        className="block w-full text-center py-2 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-colors"
                                                    >
                                                        View Teacher Alerts
                                                    </Link>
                                                </div>
                                            )}

                                            {isPrincipalOrAdmin && (
                                                <div className="space-y-4">
                                                    <div className="flex gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center text-[#633194] flex-shrink-0">
                                                            <DocumentTextIcon className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-800">Pending Approvals</p>
                                                            <p className="text-xs text-gray-500 leading-relaxed">{principalPendingCount} sports attendance reports are waiting for your signature.</p>
                                                        </div>
                                                    </div>
                                                    <Link 
                                                        to="/sports/principal" 
                                                        onClick={() => setNotificationsOpen(false)}
                                                        className="block w-full text-center py-2 bg-[#633194] text-white text-xs font-bold rounded-lg hover:bg-[#4a2370] transition-colors"
                                                    >
                                                        Review All Reports
                                                    </Link>
                                                </div>
                                            )}

                                            {totalNotifications === 0 && (isTeacher || isPrincipalOrAdmin) && (
                                                <div className="py-4 text-center">
                                                    <p className="text-sm text-gray-500 italic">All caught up! No pending tasks.</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                            <button className="p-2 rounded-xl hover:bg-[#F4F0FF] text-gray-500 hover:text-[#633194] transition-all">
                                <ChatBubbleOvalLeftIcon className="h-5 w-5" />
                            </button>

                            {/* Divider */}
                            <div className="h-8 w-px bg-gray-100 mx-1" />

                            {/* User Profile */}
                            <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#F4F0FF] border border-white shadow-sm transition-all group">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#633194] to-[#9b59b6] flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
                                    {user?.name?.charAt(0) ?? 'U'}
                                </div>
                                <div className="hidden sm:block text-right">
                                    <p className="text-sm font-bold text-[#633194] leading-none mb-0.5">{user?.name}</p>
                                    <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">{user?.role}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
                    {children ? children : (
                        <div className="space-y-6">
                            {/* Page Title */}
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
                                <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.name}!</p>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                {/* Students Card */}
                                <div className="bg-[#E1F5FE] p-5 rounded-2xl flex items-center justify-between hover:shadow-md transition-all duration-300 group cursor-default">
                                    <div>
                                        <p className="text-sm font-medium text-blue-600">Students</p>
                                        <p className="text-3xl font-bold text-gray-800 mt-1">1,248</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-white/70 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                        <AcademicCapIcon className="h-7 w-7" />
                                    </div>
                                </div>

                                {/* Employees Card */}
                                <div className="bg-[#F4F0FF] p-5 rounded-2xl flex items-center justify-between hover:shadow-md transition-all duration-300 group cursor-default">
                                    <div>
                                        <p className="text-sm font-medium text-purple-600">Employees</p>
                                        <p className="text-3xl font-bold text-gray-800 mt-1">132</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-white/70 flex items-center justify-center text-[#633194] group-hover:scale-110 transition-transform">
                                        <BriefcaseIcon className="h-7 w-7" />
                                    </div>
                                </div>

                                {/* Activities Card */}
                                <div className="bg-[#FFF0E6] p-5 rounded-2xl flex items-center justify-between hover:shadow-md transition-all duration-300 group cursor-default">
                                    <div>
                                        <p className="text-sm font-medium text-orange-600">Activities</p>
                                        <p className="text-3xl font-bold text-gray-800 mt-1">24</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-white/70 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                                        <TrophyIcon className="h-7 w-7" />
                                    </div>
                                </div>

                                {/* Alerts Card */}
                                <div className="bg-[#E8F5E9] p-5 rounded-2xl flex items-center justify-between hover:shadow-md transition-all duration-300 group cursor-default">
                                    <div>
                                        <p className="text-sm font-medium text-green-600">New Messages</p>
                                        <p className="text-3xl font-bold text-gray-800 mt-1">24</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-white/70 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                                        <ChatBubbleLeftEllipsisIcon className="h-7 w-7" />
                                    </div>
                                </div>
                            </div>

                            {/* Info Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-9 w-9 rounded-xl bg-[#E1F5FE] flex items-center justify-center text-blue-500">
                                            <CalendarDaysIcon className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-base font-semibold text-gray-800">Upcoming Events</h3>
                                    </div>
                                    <p className="text-sm text-gray-500">No events scheduled for today.</p>
                                </div>
                                <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-9 w-9 rounded-xl bg-[#FFF0E6] flex items-center justify-center text-orange-500">
                                            <BellAlertIcon className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-base font-semibold text-gray-800">Active Alerts</h3>
                                    </div>
                                    <p className="text-sm text-gray-500">3 pending alerts requiring attention.</p>
                                </div>
                                <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-9 w-9 rounded-xl bg-[#F4F0FF] flex items-center justify-center text-[#633194]">
                                            <DocumentTextIcon className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-base font-semibold text-gray-800">System Status</h3>
                                    </div>
                                    <p className="text-sm text-gray-500">All systems operational. Backup completed.</p>
                                </div>
                            </div>

                            {/* Recent Updates */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-semibold text-gray-800">Recent Updates</h3>
                                    <button className="text-xs font-semibold text-[#633194] hover:text-[#4a2370] transition-colors">See all</button>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { label: 'New Activity Added', desc: 'Basketball club added to activities', time: 'Just now', color: 'bg-[#E1F5FE]', textColor: 'text-blue-500', icon: TrophyIcon },
                                        { label: 'Attendance Report', desc: 'Swimming club report submitted for review', time: 'Today', color: 'bg-[#FFF0E6]', textColor: 'text-orange-500', icon: DocumentTextIcon },
                                        { label: 'New Alert', desc: 'Grade 10 teacher notification pending', time: 'Yesterday', color: 'bg-[#F4F0FF]', textColor: 'text-[#633194]', icon: BellAlertIcon },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                            <div className={clsx("h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0", item.color)}>
                                                <item.icon className={clsx("h-5 w-5", item.textColor)} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                                                <p className="text-xs text-gray-500 truncate">{item.desc}</p>
                                            </div>
                                            <span className="text-xs text-gray-400 flex-shrink-0">{item.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
            {/* Logout Confirmation */}
            <ConfirmationModal
                isOpen={showLogoutModal}
                title="Confirm Logout"
                message="Are you sure you want to sign out of your account? You will need to login again to access your dashboard."
                confirmText="Sign Out"
                onConfirm={logout}
                onCancel={() => setShowLogoutModal(false)}
                isDestructive={true}
            />
        </motion.div>
    );
};

export default DashboardLayout;
