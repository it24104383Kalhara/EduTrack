import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../../utils/auth";
import clsx from "clsx";

interface DashboardLayoutProps {
    children?: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Activities & Clubs', path: '/sports/activities' },
        { name: 'Inventory', path: '/sports/inventory' },
        { name: 'Facilities', path: '/sports/facilities' },
        { name: 'Attendance', path: '/sports/attendance' },
        { name: 'Achievements', path: '/sports/achievements' },
    ];

    const getPageTitle = () => {
        const currentItem = navItems.find(item => item.path === location.pathname);
        return currentItem ? currentItem.name : 'Dashboard';
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-lg overflow-y-auto hidden md:block z-10">
                <div className="p-4 border-b flex items-center gap-2">
                    <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">E</div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">EduTrack</h1>
                        <p className="text-xs text-gray-500">Sports Management</p>
                    </div>
                </div>
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                "block px-4 py-2.5 text-sm font-medium rounded-md transition-colors",
                                location.pathname === item.path
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm z-0">
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
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                    {children ? children : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900">Upcoming Matches</h3>
                                <p className="mt-2 text-sm text-gray-500">No matches scheduled for today.</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
                                <p className="mt-2 text-sm text-gray-500">3 pending alerts requiring attention.</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900">Inventory Status</h3>
                                <p className="mt-2 text-sm text-gray-500">All equipment accounted for.</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
