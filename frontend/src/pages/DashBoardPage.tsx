import { useAuth } from "../utils/auth";
import { useQuery } from "@tanstack/react-query";
import { inventoryService, activityService } from "../services/api";
import { 
    AcademicCapIcon, 
    BriefcaseIcon, 
    TrophyIcon, 
    CalendarDaysIcon,
    BellAlertIcon,
    DocumentTextIcon,
    ChevronRightIcon
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
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

    const size = 180;
    const center = size / 2;
    const radiusOuter = 70;
    const radiusInner = 52;
    const strokeWidth = 12;
    const circumferenceOuter = 2 * Math.PI * radiusOuter;
    const circumferenceInner = 2 * Math.PI * radiusInner;

    const offsetOuter = circumferenceOuter - (availablePercent / 100) * circumferenceOuter;
    const offsetInner = circumferenceInner - (reservedPercent / 100) * circumferenceInner;

    return (
        <div className="bg-[#F8F9FB] rounded-[24px] border border-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center relative overflow-hidden group h-full">
            <div className="w-full flex justify-start items-center mb-2 relative z-10">
                <h3 className="text-sm font-bold text-gray-800 tracking-tight">Inventory Status</h3>
            </div>

            <div className="relative mb-4 drop-shadow-xl h-[180px]">
                <svg width={size} height={size} className="transform -rotate-90">
                    <defs>
                        <linearGradient id="gradAvailable" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6A11CB" />
                            <stop offset="100%" stopColor="#2575FC" />
                        </linearGradient>
                        <linearGradient id="gradReserved" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FF7E5F" />
                            <stop offset="100%" stopColor="#FEB47B" />
                        </linearGradient>
                    </defs>
                    <circle cx={center} cy={center} r={radiusOuter} stroke="#E2E8F0" strokeWidth={strokeWidth} strokeOpacity="0.4" fill="transparent" />
                    <circle cx={center} cy={center} r={radiusInner} stroke="#E2E8F0" strokeWidth={strokeWidth} strokeOpacity="0.4" fill="transparent" />
                    
                    <circle
                        cx={center} cy={center} r={radiusOuter}
                        stroke="url(#gradAvailable)" strokeWidth={strokeWidth} fill="transparent"
                        strokeDasharray={circumferenceOuter}
                        strokeDashoffset={offsetOuter}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                    <circle
                        cx={center} cy={center} r={radiusInner}
                        stroke="url(#gradReserved)" strokeWidth={strokeWidth} fill="transparent"
                        strokeDasharray={circumferenceInner}
                        strokeDashoffset={offsetInner}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
                    <p className="text-[32px] font-black text-gray-800 leading-none tracking-tight">{stats.total}</p>
                </div>
            </div>

            <div className="flex justify-center gap-4 relative z-10 w-full">
                <div className="flex items-center gap-1.5 cursor-default">
                    <div className="h-2 w-2 rounded-full" style={{ background: 'linear-gradient(135deg, #6A11CB, #2575FC)' }} />
                    <span className="text-[10px] font-bold text-gray-500">Available</span>
                </div>
                <div className="flex items-center gap-1.5 cursor-default">
                    <div className="h-2 w-2 rounded-full" style={{ background: 'linear-gradient(135deg, #FF7E5F, #FEB47B)' }} />
                    <span className="text-[10px] font-bold text-gray-500">Reserved</span>
                </div>
            </div>
        </div>
    );
}

// ─── Activity Count Graph Component ───────────────────────────────────────

function ActivityCountGraph({ counts, activities }: { counts: { Sport: number, Club: number, Society: number }, activities: any[] }) {
    const maxValue = Math.max(counts.Sport, counts.Club, counts.Society, 5);

    const getLatestDate = (type: string) => {
        const filtered = activities.filter(a => a.type === type);
        if (filtered.length === 0) return 'Never';
        const latest = filtered.reduce((max, a) => {
            const date = new Date(a.updated_at || a.created_at);
            return date > max ? date : max;
        }, new Date(0));
        return latest.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const data = [
        { label: 'Sports', value: counts.Sport, color: 'linear-gradient(180deg, #FFB38A 0%, #F97316 100%)', latest: getLatestDate('Sport'), icon: TrophyIcon, iconColor: 'text-orange-500', iconBg: 'bg-orange-50', border: 'border-orange-100', tooltipPos: 'left-0' },
        { label: 'Clubs', value: counts.Club, color: 'linear-gradient(180deg, #93C5FD 0%, #3B82F6 100%)', latest: getLatestDate('Club'), icon: BriefcaseIcon, iconColor: 'text-blue-500', iconBg: 'bg-blue-50', border: 'border-blue-100', tooltipPos: 'left-1/2 -translate-x-1/2' },
        { label: 'Societies', value: counts.Society, color: 'linear-gradient(180deg, #86EFAC 0%, #16A34A 100%)', latest: getLatestDate('Society'), icon: AcademicCapIcon, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-50', border: 'border-emerald-100', tooltipPos: 'right-0' },
    ];

    return (
        <div className="bg-white rounded-[24px] border border-gray-100 p-4 shadow-sm flex flex-col relative group h-full">
            <div className="flex justify-between items-center mb-6 px-1">
                <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Activity Status</h3>
                </div>
            </div>

            <div className="flex flex-1 gap-2">
                <div className="flex-1 flex justify-around items-end h-full min-h-[140px] pb-6 relative pr-1">
                    <div className="absolute left-0 right-0 top-0 h-[1px] bg-gray-50/50" />
                    <div className="absolute left-0 right-0 bottom-[24px] h-[1px] bg-gray-50/50" />

                    {data.map((item, i) => {
                        const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                        return (
                            <div key={item.label} className="flex flex-col items-center gap-2 flex-1 relative z-10 group/bar max-w-[60px]">
                                <div className="w-full max-w-[32px] rounded-full h-[120px] relative flex items-end bg-transparent">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${height}%` }}
                                        transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                                        className="w-full rounded-2xl border-r-2 border-white/20 shadow-[0_4px_15px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.3)] relative"
                                        style={{ background: item.color }}
                                    >
                                        {/* Activity Creation Themed Tooltip */}
                                        <div className={clsx(
                                            "absolute bottom-full mb-3 opacity-0 group-hover/bar:opacity-100 transition-all duration-300 scale-95 group-hover/bar:scale-100 pointer-events-none z-50",
                                            item.tooltipPos
                                        )}>
                                            <div className={clsx(
                                                "bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_rgba(99,49,148,0.2)] border p-3 flex items-start gap-3 min-w-[200px]",
                                                item.border
                                            )}>
                                                <div className={clsx("h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0", item.iconBg, item.iconColor)}>
                                                    <item.icon className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <h4 className="text-[11px] font-black text-gray-800 tracking-tighter uppercase">{item.label}</h4>
                                                        <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-full">ACTIVE</span>
                                                    </div>
                                                    <div className="flex items-baseline gap-1 mb-2">
                                                        <span className={clsx("text-xl font-black", item.iconColor)}>{item.value}</span>
                                                        <span className="text-[9px] font-bold text-gray-400 capitalize">registered items</span>
                                                    </div>
                                                    <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                                                        <span className="text-[8px] font-bold text-gray-500 uppercase">Last Updated</span>
                                                        <span className="text-[9px] font-bold text-gray-800">{item.latest}</span>
                                                    </div>
                                                </div>
                                                {/* Arrow logic logic logic... but for simple tooltips just use a generic one or none */}
                                                <div className={clsx(
                                                    "absolute top-full -mt-1 border-[6px] border-transparent border-t-white/95",
                                                    item.label === 'Sports' ? 'left-4' : item.label === 'Societies' ? 'right-4' : 'left-1/2 -translate-x-1/2'
                                                )} />
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{item.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────

export default function DashBoardPage() {
    const { user } = useAuth();
    const { data: activities } = useQuery({
        queryKey: ['activities'],
        queryFn: activityService.getAll
    });

    const activityCounts = { 
        Sport: (activities ?? []).filter(a => a.type === 'Sport').length,
        Club: (activities ?? []).filter(a => a.type === 'Club').length,
        Society: (activities ?? []).filter(a => a.type === 'Society').length,
    };

    const totalActivities = activityCounts.Sport + activityCounts.Club + activityCounts.Society;

    return (
        <div className="space-y-4 max-h-screen overflow-hidden">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight">{user?.role} Portal</h1>
                    <p className="text-[12px] text-gray-500">Welcome, {user?.name}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { label: 'Students', val: '1,248', color: 'bg-[#E1F5FE]', txt: 'text-blue-600', icon: AcademicCapIcon },
                    { label: 'Employees', val: '132', color: 'bg-[#F4F0FF]', txt: 'text-purple-600', icon: BriefcaseIcon },
                    { label: 'Activities', val: totalActivities || 24, color: 'bg-[#FFF0E6]', txt: 'text-orange-600', icon: TrophyIcon }
                ].map((s, i) => (
                    <div key={i} className={clsx("p-4 rounded-2xl flex items-center justify-between", s.color)}>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">{s.label}</p>
                            <p className="text-2xl font-black text-gray-800 mt-0.5">{s.val}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-white/70 flex items-center justify-center">
                            <s.icon className={clsx("h-6 w-6", s.txt)} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InventoryAnalytics />
                    <ActivityCountGraph counts={activityCounts} activities={activities ?? []} />
                </div>

                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white rounded-[24px] border border-gray-100 p-5 hover:shadow-md transition-all">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-7 w-7 rounded-lg bg-[#FFF0E6] flex items-center justify-center text-orange-500">
                                <BellAlertIcon className="h-4 w-4" />
                            </div>
                            <h3 className="text-xs font-bold text-gray-800 uppercase">Alerts</h3>
                        </div>
                        <p className="text-[11px] text-gray-500">3 pending alerts requiring review.</p>
                    </div>

                    <div className="bg-white rounded-[24px] border border-gray-100 p-5 overflow-hidden">
                        <h3 className="text-xs font-bold text-gray-800 uppercase mb-3 px-1">Updates</h3>
                        <div className="space-y-2">
                            {[
                                { label: 'Basketball', desc: 'New group added', time: 'Just now', color: 'bg-[#E1F5FE]', txt: 'text-blue-500', icon: TrophyIcon },
                                { label: 'Swimming', desc: 'Sync complete', time: 'Today', color: 'bg-[#FFF0E6]', txt: 'text-orange-500', icon: DocumentTextIcon },
                                { label: 'System', desc: 'Notification sent', time: 'Yesterday', color: 'bg-[#F4F0FF]', txt: 'text-[#633194]', icon: BellAlertIcon },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className={clsx("h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0", item.color)}>
                                        <item.icon className={clsx("h-4 w-4", item.txt)} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-bold text-gray-800 truncate">{item.label}</p>
                                        <p className="text-[10px] text-gray-500 truncate">{item.desc}</p>
                                    </div>
                                    <span className="text-[9px] text-gray-400">{item.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
