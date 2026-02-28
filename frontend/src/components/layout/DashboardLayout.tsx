import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../../utils/auth";
import clsx from "clsx";
import {
    HomeIcon,
    AcademicCapIcon,
    BriefcaseIcon,
    UsersIcon,
    RectangleStackIcon,
    BuildingOfficeIcon,
    CalendarDaysIcon,
    TrophyIcon,
    CurrencyDollarIcon,
    ChatBubbleLeftEllipsisIcon,
    DocumentTextIcon,
    ShieldCheckIcon,
    BellAlertIcon,
} from '@heroicons/react/24/outline';

interface DashboardLayoutProps {
    children?: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
        { name: 'Academics', path: '/academics', icon: AcademicCapIcon },
        { name: 'Administration', path: '/admin', icon: BriefcaseIcon },
        { name: 'Activities & Clubs', path: '/sports/activities', icon: UsersIcon },
        { name: 'Inventory', path: '/sports/inventory', icon: RectangleStackIcon },
        { name: 'Facilities', path: '/sports/facilities', icon: BuildingOfficeIcon },
        { name: 'Attendance', path: '/sports/attendance', icon: CalendarDaysIcon },
        { name: 'Submit Report', path: '/sports/attendance/report', icon: DocumentTextIcon },
        { name: 'Principal View', path: '/sports/principal', icon: ShieldCheckIcon },
        { name: 'Teacher Alerts', path: '/sports/teacher-notifications', icon: BellAlertIcon },
        { name: 'Achievements', path: '/sports/achievements', icon: TrophyIcon },
    ];

    const getPageTitle = () => {
        const currentItem = navItems.find(item => item.path === location.pathname);
        return currentItem ? currentItem.name : 'Dashboard';
    };

    return (
        <div className="flex h-screen bg-[#FFFFFF]">
            {/* Sidebar */}
            <div className="w-64 bg-[#1a3b70] shadow-xl overflow-y-auto hidden md:block z-10 text-white">
                <div className="p-4 border-b border-indigo-900 flex items-center gap-2">
                    <div className="h-8 w-8 bg-indigo-500 rounded flex items-center justify-center text-white font-bold">E</div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-wide">EduTrack</h1>
                        <p className="text-xs text-indigo-300 uppercase tracking-widest font-semibold">Management</p>
                    </div>
                </div>
                <nav className="p-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors border border-transparent",
                                location.pathname === item.path
                                    ? "bg-[#11274a] text-white border-indigo-500 shadow-sm"
                                    : "text-indigo-100 hover:bg-[#11274a] hover:text-white"
                            )}
                        >
                            <item.icon className={clsx(
                                "h-5 w-5",
                                location.pathname === item.path ? "text-indigo-400" : "text-indigo-300 group-hover:text-white"
                            )} />
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#FFFFFF]">
                <header className="bg-white shadow-sm z-0 border-b border-gray-100">
                    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                <p className="text-xs text-gray-500">{user?.role}</p>
                            </div>
                            <button
                                onClick={logout}
                                className="text-xs bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-800 font-medium px-3 py-1.5 rounded-md transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white p-6">
                    {children ? children : (
                        <div className="space-y-6">
                            {/* Stats Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Student Card */}
                                <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-[#1a3b70]">
                                        <UsersIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 truncate">Total Students</p>
                                        <p className="text-2xl font-bold text-gray-900">1,248</p>
                                    </div>
                                </div>
                                {/* Employees Card */}
                                <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center text-[#7e22ce]">
                                        <BriefcaseIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 truncate">Total Employees</p>
                                        <p className="text-2xl font-bold text-gray-900">132</p>
                                    </div>
                                </div>
                                {/* Inflows Card (Financial/Success) */}
                                <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-[#10b981]">
                                        <CurrencyDollarIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 truncate">Total Inflows</p>
                                        <p className="text-2xl font-bold text-gray-900">$84,300</p>
                                    </div>
                                </div>
                                {/* Messages Card (Alerts) */}
                                <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-[#e11d48]">
                                        <ChatBubbleLeftEllipsisIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 truncate">New Messages</p>
                                        <p className="text-2xl font-bold text-gray-900">24</p>
                                    </div>
                                </div>
                            </div>

                            {/* Modular Cards Below Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
                                    <h3 className="text-lg font-semibold text-gray-900">Upcoming Matches</h3>
                                    <p className="mt-2 text-sm text-gray-500">No matches scheduled for today.</p>
                                </div>
                                <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
                                    <h3 className="text-lg font-semibold text-[#e11d48]">Active Alerts</h3>
                                    <p className="mt-2 text-sm text-gray-500">3 pending alerts requiring attention.</p>
                                </div>
                                <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
                                    <h3 className="text-lg font-semibold text-[#7e22ce]">System Notifications</h3>
                                    <p className="mt-2 text-sm text-gray-500">All equipment accounted for. Server backup completed.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
