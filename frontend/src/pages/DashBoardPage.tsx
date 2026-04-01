import { useAuth } from "../utils/auth";
import { useQuery } from "@tanstack/react-query";
import { inventoryService, activityService } from "../services/api";
import { 
    AcademicCapIcon, 
    BriefcaseIcon, 
    TrophyIcon, 
    BellAlertIcon,
    DocumentTextIcon
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import clsx from "clsx";
import { useState } from 'react';

// ─── Inventory Analytics Component ──────────────────────────────────────────

function InventoryAnalytics() {
    const [hoveredItem, setHoveredItem] = useState<'available' | 'reserved' | null>(null);
    const { data: inventory } = useQuery({
        queryKey: ['inventory'],
        queryFn: inventoryService.getAll
    });

    const stats = (inventory ?? []).reduce((acc, item) => {
        acc.total += item.total_quantity;
        acc.available += item.available_quantity;
        return acc;
    }, { total: 0, available: 0 });

    const resCount = stats.total - stats.available;
    const availPercent = stats.total > 0 ? (stats.available / stats.total) * 100 : 0;
    const resPercent   = stats.total > 0 ? (resCount / stats.total) * 100 : 0;

    const size = 180;
    const center = size / 2;
    const rOuter = 70;
    const rInner = 52;
    const stroke = 12;
    const cOuter = 2 * Math.PI * rOuter;
    const cInner = 2 * Math.PI * rInner;

    const offOuter = cOuter - (availPercent / 100) * cOuter;
    const offInner = cInner - (resPercent / 100) * cInner;

    const getLatestDate = () => {
        if (!inventory || inventory.length === 0) return 'Never';
        const latest = inventory.reduce((max, item: any) => {
            const dStr = item.last_updated || item.updated_at || item.created_at;
            if (!dStr) return max;
            const d = new Date(dStr);
            return d > max ? d : max;
        }, new Date(0));
        return latest.getTime() === 0 ? 'Never' : latest.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const latestInv = getLatestDate();

    return (
        <div className="bg-white rounded-[24px] border border-gray-100 p-4 shadow-sm flex flex-col items-center relative h-full overflow-visible z-[5]">
            {/* Stable Legend Tooltips (High Stacking Layer) */}
            <div className="absolute top-0 inset-x-0 z-[130] pointer-events-none px-4 h-0 overflow-visible">
                {/* Available Hover Popup (Right-Aligned & Safe) */}
                <div className={clsx(
                    "transition-all duration-300 absolute right-4 top-2",
                    hoveredItem === 'available' ? 'opacity-100 scale-100 -translate-y-full' : 'opacity-0 scale-95 translate-y-0'
                )}>
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_40px_80px_rgba(37,117,252,0.3)] border border-blue-100 p-3 flex items-start gap-3 min-w-[210px] pointer-events-auto">
                        <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">
                            <DocumentTextIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 text-left">
                            <h4 className="text-[11px] font-black text-gray-800 tracking-tighter uppercase leading-tight">Available Items</h4>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-xl font-black text-blue-600 leading-none">{stats.available}</span>
                                <span className="text-[9px] font-bold text-gray-400 capitalize">in stock ({availPercent.toFixed(0)}%)</span>
                            </div>
                            <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                                <span className="text-[8px] font-bold text-gray-500 uppercase">Sync Status</span>
                                <span className="text-[9px] font-bold text-gray-800">{latestInv}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reserved Hover Popup (Left-Aligned & Safe) */}
                <div className={clsx(
                    "transition-all duration-300 absolute left-4 top-2",
                    hoveredItem === 'reserved' ? 'opacity-100 scale-100 -translate-y-full' : 'opacity-0 scale-95 translate-y-0'
                )}>
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_40px_80px_rgba(249,115,22,0.25)] border border-orange-100 p-3 flex items-start gap-3 min-w-[210px] pointer-events-auto">
                        <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 flex-shrink-0">
                            <TrophyIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 text-left">
                            <h4 className="text-[11px] font-black text-gray-800 tracking-tighter uppercase leading-tight">Reserved Items</h4>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-xl font-black text-orange-600 leading-none">{resCount}</span>
                                <span className="text-[9px] font-bold text-gray-400 capitalize">currently out ({resPercent.toFixed(0)}%)</span>
                            </div>
                            <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                                <span className="text-[8px] font-bold text-gray-500 uppercase">Last Reservation</span>
                                <span className="text-[9px] font-bold text-gray-800">{latestInv}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full flex justify-start items-center mb-2 px-1">
                <h3 className="text-sm font-bold text-gray-800 tracking-tight">Inventory Status</h3>
            </div>

            <div className="relative mb-4 drop-shadow-xl h-[180px]">
                <svg width={size} height={size} className="overflow-visible">
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
                    
                    {/* Background Tracks */}
                    <circle cx={center} cy={center} r={rOuter} stroke="#E2E8F0" strokeWidth={stroke} strokeOpacity="0.4" fill="transparent" />
                    <circle cx={center} cy={center} r={rInner} stroke="#E2E8F0" strokeWidth={stroke} strokeOpacity="0.4" fill="transparent" />
                    
                    {/* Active Loops (Rotated -90) */}
                    <g transform={`rotate(-90 ${center} ${center})`}>
                        <circle
                            cx={center} cy={center} r={rOuter}
                            stroke="url(#gradAvailable)" strokeWidth={stroke} fill="transparent"
                            strokeDasharray={cOuter}
                            strokeDashoffset={offOuter}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out cursor-pointer pointer-events-auto"
                            onMouseEnter={() => setHoveredItem('available')}
                            onMouseLeave={() => setHoveredItem(null)}
                        />
                        <circle
                            cx={center} cy={center} r={rInner}
                            stroke="url(#gradReserved)" strokeWidth={stroke} fill="transparent"
                            strokeDasharray={cInner}
                            strokeDashoffset={offInner}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out cursor-pointer pointer-events-auto"
                            onMouseEnter={() => setHoveredItem('reserved')}
                            onMouseLeave={() => setHoveredItem(null)}
                        />
                    </g>
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total</p>
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
        <div className="space-y-4 pb-10">
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
                            <div className="h-8 w-8 rounded-lg bg-[#FFF0E6] flex items-center justify-center text-orange-500">
                                <BellAlertIcon className="h-5 w-5" />
                            </div>
                            <h3 className="text-[14px] font-black text-gray-800 uppercase tracking-tight">Alerts</h3>
                        </div>
                        <p className="text-[13px] font-medium text-gray-500 leading-relaxed px-1">
                            3 pending alerts requiring review.
                        </p>
                    </div>

                    <div className="bg-white rounded-[24px] border border-gray-100 p-5 overflow-hidden">
                        <h3 className="text-[14px] font-black text-gray-800 uppercase mb-4 px-1 tracking-tight">Updates</h3>
                        <div className="space-y-1.5">
                            {[
                                { label: 'Basketball', desc: 'New group added', time: 'Just now', color: 'bg-[#E1F5FE]', txt: 'text-blue-500', icon: TrophyIcon },
                                { label: 'Swimming', desc: 'Sync complete', time: 'Today', color: 'bg-[#FFF0E6]', txt: 'text-orange-500', icon: DocumentTextIcon },
                                { label: 'System', desc: 'Notification sent', time: 'Yesterday', color: 'bg-[#F4F0FF]', txt: 'text-[#633194]', icon: BellAlertIcon },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className={clsx("h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0", item.color)}>
                                        <item.icon className={clsx("h-4 w-4", item.txt)} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-bold text-gray-800 truncate leading-tight mb-0.5">{item.label}</p>
                                        <p className="text-[11.5px] font-medium text-gray-500 truncate leading-tight">{item.desc}</p>
                                    </div>
                                    <span className="text-[10.5px] font-bold text-gray-400 whitespace-nowrap">{item.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
