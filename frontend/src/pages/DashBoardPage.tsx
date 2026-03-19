import { useAuth } from "../utils/auth";
import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "../services/api";
import { 
    AcademicCapIcon, 
    BriefcaseIcon, 
    TrophyIcon, 
    CalendarDaysIcon,
    BellAlertIcon,
    DocumentTextIcon
} from "@heroicons/react/24/outline";
import clsx from "clsx";

// ─── Inventory Analytics Component ──────────────────────────────────────────

function InventoryAnalytics() {
    const { data: inventory } = useQuery({
        queryKey: ['inventory'],
        queryFn: inventoryService.getAll
    });

    const stats = (inventory ?? []).reduce((acc, item) => {
        acc.total += item.total_quantity;
        acc.available += item.available_quantity;
        return acc;
    }, { total: 0, available: 0 });

    const reserved = stats.total - stats.available;
    const availablePercent = stats.total > 0 ? (stats.available / stats.total) * 100 : 0;
    const reservedPercent = stats.total > 0 ? (reserved / stats.total) * 100 : 0;

    // SVG Circular Chart Logic
    const size = 220;
    const center = size / 2;
    const radiusOuter = 82;
    const radiusInner = 60;
    const strokeWidth = 14;
    const circumferenceOuter = 2 * Math.PI * radiusOuter;
    const circumferenceInner = 2 * Math.PI * radiusInner;

    const offsetOuter = circumferenceOuter - (availablePercent / 100) * circumferenceOuter;
    const offsetInner = circumferenceInner - (reservedPercent / 100) * circumferenceInner;

    return (
        <div className="bg-[#F8F9FB] rounded-[24px] border border-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center relative overflow-hidden group">
            {/* Ambient Glows */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#6A11CB]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#FF7E5F]/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="w-full flex justify-start items-center mb-4 relative z-10">
                <h3 className="text-base font-bold text-gray-800 tracking-tight">Inventory Status</h3>
            </div>

            {/* Chart Area */}
            <div className="relative mb-6 drop-shadow-2xl">
                <svg width={size} height={size} className="transform -rotate-90">
                    <defs>
                        {/* Gradients */}
                        <linearGradient id="gradAvailable" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6A11CB" />
                            <stop offset="100%" stopColor="#2575FC" />
                        </linearGradient>
                        <linearGradient id="gradReserved" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FF7E5F" />
                            <stop offset="100%" stopColor="#FEB47B" />
                        </linearGradient>
                        
                        {/* Glow Filter */}
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>

                        {/* Drop Shadow for segments */}
                        <filter id="segmentShadow" x="-10%" y="-10%" width="120%" height="120%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
                        </filter>
                    </defs>

                    {/* Background Tracks (Soft Hybrid feel) */}
                    <circle
                        cx={center} cy={center} r={radiusOuter}
                        stroke="#E2E8F0" strokeWidth={strokeWidth} strokeOpacity="0.4" fill="transparent"
                    />
                    <circle
                        cx={center} cy={center} r={radiusInner}
                        stroke="#E2E8F0" strokeWidth={strokeWidth} strokeOpacity="0.4" fill="transparent"
                    />
                    
                    {/* Active Segments */}
                    <circle
                        cx={center} cy={center} r={radiusOuter}
                        stroke="url(#gradAvailable)" strokeWidth={strokeWidth} fill="transparent"
                        strokeDasharray={circumferenceOuter}
                        strokeDashoffset={offsetOuter}
                        strokeLinecap="round"
                        filter="url(#glow)"
                        className="transition-all duration-1000 ease-out"
                    />
                    <circle
                        cx={center} cy={center} r={radiusInner}
                        stroke="url(#gradReserved)" strokeWidth={strokeWidth} fill="transparent"
                        strokeDasharray={circumferenceInner}
                        strokeDashoffset={offsetInner}
                        strokeLinecap="round"
                        filter="url(#glow)"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total Items</p>
                    <p className="text-[44px] font-black text-gray-800 leading-none tracking-tight">
                        {stats.total}
                    </p>
                </div>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-2 relative z-10 w-full px-2">
                <div className="flex items-center gap-2 group/item cursor-default">
                    <div className="h-3 w-3 rounded-full shadow-sm" style={{ background: 'linear-gradient(135deg, #6A11CB, #2575FC)' }} />
                    <span className="text-xs font-bold text-gray-500 group-hover/item:text-gray-700 transition-colors">Available</span>
                </div>
                <div className="flex items-center gap-2 group/item cursor-default">
                    <div className="h-3 w-3 rounded-full shadow-sm" style={{ background: 'linear-gradient(135deg, #FF7E5F, #FEB47B)' }} />
                    <span className="text-xs font-bold text-gray-500 group-hover/item:text-gray-700 transition-colors">Reserved</span>
                </div>
            </div>
        </div>
    );
}

// ─── Inventory Analytics Component ──────────────────────────────────────────

export default function DashBoardPage() {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">{user?.role} Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.name}!</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Inventory Analytics Graph */}
                <div className="lg:col-span-1">
                    <InventoryAnalytics />
                </div>

                {/* Info Cards Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
            </div>
        </div>
    );
}
