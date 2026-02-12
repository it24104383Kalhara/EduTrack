import { useNavigate } from "react-router-dom";
import { useAuth } from "../../utils/auth";

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-lg overflow-y-auto hidden md:block">
                <div className="p-4 border-b">
                    <h1 className="text-xl font-bold text-indigo-600">EduTrack Sports</h1>
                    <p className="text-xs text-gray-500">School Management System</p>
                </div>
                <nav className="p-4 space-y-2">
                    <a href="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md">Dashboard</a>
                    <a href="/sports/activities" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md">Activities & Clubs</a>
                    <a href="/sports/inventory" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md">Inventory</a>
                    <a href="/sports/facilities" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md">Facilities</a>
                    <a href="/sports/attendance" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md">Attendance</a>
                    <a href="/sports/achievements" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md">Achievements</a>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow">
                    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-gray-500">Welcome, {user?.name} ({user?.role})</span>
                            <button onClick={logout} className="text-sm text-red-600 hover:text-red-800 font-medium">Logout</button>
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    {/* Placeholder for routed content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium text-gray-900">Upcoming Matches</h3>
                            <p className="mt-2 text-gray-600">No matches scheduled for today.</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium text-gray-900">Active Alerts</h3>
                            <p className="mt-2 text-gray-600">3 pending alerts requiring attention.</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium text-gray-900">Inventory Status</h3>
                            <p className="mt-2 text-gray-600">All equipment accounts for.</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
