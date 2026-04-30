import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityService, membershipService, achievementService } from '../../services/api';
import type { Match, LeaderboardEntry, TimeSeriesPoint } from '../../services/api';
import { useAuth } from '../../utils/auth';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import TrophyIcon from '@heroicons/react/24/outline/TrophyIcon';
import PlusIcon from '@heroicons/react/24/outline/PlusIcon';
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import DocumentArrowDownIcon from '@heroicons/react/24/outline/DocumentArrowDownIcon';
import ChartBarIcon from '@heroicons/react/24/outline/ChartBarIcon';
import StarIcon from '@heroicons/react/24/solid/StarIcon';
import CheckCircleIcon from '@heroicons/react/24/solid/CheckCircleIcon';
import DateTimePicker from '../../components/ui/DateTimePicker';
import CustomSelect from '../../components/ui/CustomSelect';

// ── Helpers ───────────────────────────────────────────────────────────────────

const RESULT_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    Won:           { label: 'Won',           color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
    Lost:          { label: 'Lost',          color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200'     },
    Draw:          { label: 'Draw',          color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200'   },
    Participation: { label: 'Participation', color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200'    },
};

const LEVEL_CONFIG: Record<string, { label: string; color: string }> = {
    National:   { label: 'National',   color: 'text-red-600'     },
    Provincial: { label: 'Provincial', color: 'text-purple-600'  },
    District:   { label: 'District',   color: 'text-blue-600'    },
    Zonal:      { label: 'Zonal',      color: 'text-amber-600'   },
    School:     { label: 'School',     color: 'text-gray-600'    },
};

const POINTS_MATRIX: Record<string, Record<string, number>> = {
    National:   { Won: 75, Lost: 10, Draw: 10, Participation: 15 },
    Provincial: { Won: 50, Lost: 8,  Draw: 8,  Participation: 12 },
    District:   { Won: 30, Lost: 6,  Draw: 6,  Participation: 10 },
    Zonal:      { Won: 20, Lost: 5,  Draw: 5,  Participation: 10 },
    School:     { Won: 10, Lost: 3,  Draw: 3,  Participation:  5 },
};

const MEDAL_COLORS = ['text-yellow-400', 'text-gray-400', 'text-amber-600'];

// ── Line Chart ────────────────────────────────────────────────────────────────

function LineChart({ data, period }: { data: TimeSeriesPoint[]; period: string }) {
    const [hover, setHover] = useState<number | null>(null);
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-56 gap-2 text-gray-300">
                <ChartBarIcon className="h-12 w-12" />
                <p className="text-sm font-medium text-gray-400">No data yet — add match results to see analytics</p>
            </div>
        );
    }

    const values = data.map(d => Number(d.total_points));
    const maxVal = Math.max(...values, 1);
    const minVal = 0;
    const W = 680, H = 200, PAD = { top: 20, right: 20, bottom: 36, left: 44 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;

    const pts = data.map((d, i) => ({
        x: PAD.left + (i / Math.max(data.length - 1, 1)) * chartW,
        y: PAD.top + chartH - ((Number(d.total_points) - minVal) / (maxVal - minVal)) * chartH,
        d,
    }));

    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${pts[pts.length - 1].x} ${PAD.top + chartH} L ${pts[0].x} ${PAD.top + chartH} Z`;

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ val: Math.round(maxVal * f), y: PAD.top + chartH - f * chartH }));

    const labelFmt = (lbl: string) => {
        if (period === 'monthly' && lbl.includes('-')) {
            const [y, m] = lbl.split('-');
            return new Date(Number(y), Number(m) - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
        }
        return lbl;
    };

    return (
        <div className="relative w-full overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 320 }}>
                <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#633194" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#633194" stopOpacity="0.02" />
                    </linearGradient>
                </defs>

                {/* Grid lines */}
                {yTicks.map((t, i) => (
                    <g key={i}>
                        <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 3" />
                        <text x={PAD.left - 6} y={t.y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{t.val}</text>
                    </g>
                ))}

                {/* Area fill */}
                <path d={areaD} fill="url(#chartGrad)" />

                {/* Line */}
                <path d={pathD} fill="none" stroke="#633194" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* X labels */}
                {pts.map((p, i) => (
                    <text key={i} x={p.x} y={H - 6} textAnchor="middle" fontSize="10" fill="#9ca3af">
                        {labelFmt(p.d.period_label)}
                    </text>
                ))}

                {/* Hover dots + tooltip */}
                {pts.map((p, i) => (
                    <g key={`dot-${i}`} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }}>
                        <circle cx={p.x} cy={p.y} r={hover === i ? 6 : 4} fill={hover === i ? '#633194' : '#9b59b6'} stroke="white" strokeWidth="2"
                            style={{ transition: 'r 0.15s ease' }} />
                    </g>
                ))}
            </svg>
        </div>
    );
}

// ── PDF Generator ─────────────────────────────────────────────────────────────

async function generateCVPdf(studentId: number, studentName: string, activityId?: number) {
    try {
        const cv = await achievementService.getStudentCV(studentId, activityId);
        const { jsPDF } = await import('jspdf');

        const doc = new jsPDF();
        const purple = [99, 49, 148] as [number, number, number];
        const gray = [107, 114, 128] as [number, number, number];

        // Header
        doc.setFillColor(...purple);
        doc.rect(0, 0, 210, 38, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20); doc.setFont('helvetica', 'bold');
        doc.text('Sports CV', 14, 16);
        doc.setFontSize(12); doc.setFont('helvetica', 'normal');
        doc.text(studentName || `Student #${studentId}`, 14, 26);
        doc.setFontSize(9);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 34);

        let y = 50;

        // Score summary boxes
        const boxes = [
            { label: 'Total Score', value: cv.totals?.total?.toFixed(1) ?? '0' },
            { label: 'Attendance Pts', value: cv.totals?.attendance?.toFixed(1) ?? '0' },
            { label: 'Match Pts', value: cv.totals?.match?.toFixed(1) ?? '0' },
            { label: 'Role Bonus', value: cv.totals?.role?.toFixed(1) ?? '0' },
        ];
        boxes.forEach((b, i) => {
            const bx = 14 + i * 48;
            doc.setFillColor(244, 240, 255);
            doc.roundedRect(bx, y, 44, 22, 3, 3, 'F');
            doc.setTextColor(...purple);
            doc.setFontSize(14); doc.setFont('helvetica', 'bold');
            doc.text(String(b.value), bx + 22, y + 13, { align: 'center' });
            doc.setFontSize(7); doc.setFont('helvetica', 'normal');
            doc.setTextColor(...gray);
            doc.text(b.label, bx + 22, y + 20, { align: 'center' });
        });

        y += 32;

        // Formula note
        doc.setFontSize(8); doc.setTextColor(...gray);
        doc.text('Formula: (Attendance% × 0.2) + Match Points + Role Bonus = Total Score', 14, y);
        y += 10;

        // Activities
        if (cv.current_activities?.length) {
            doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...purple);
            doc.text('Activities & Roles', 14, y); y += 7;
            cv.current_activities.forEach((a: any) => {
                doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(55, 65, 81);
                doc.text(`• ${a.activity_name}  —  ${a.role.replace('_', ' ')}`, 18, y); y += 6;
            });
            y += 4;
        }

        // Achievements table
        if (cv.achievements?.length) {
            doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...purple);
            doc.text('Achievement History', 14, y); y += 8;

            // Header row
            doc.setFillColor(...purple);
            doc.rect(14, y - 5, 182, 7, 'F');
            doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
            doc.text('Date', 16, y); doc.text('Title', 50, y); doc.text('Type', 120, y); doc.text('Points', 175, y);
            y += 5;

            cv.achievements.slice(0, 25).forEach((a: any, i: number) => {
                if (i % 2 === 0) { doc.setFillColor(248, 246, 255); doc.rect(14, y - 4, 182, 6, 'F'); }
                doc.setTextColor(55, 65, 81); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
                doc.text(new Date(a.date).toLocaleDateString(), 16, y);
                doc.text((a.title || '').slice(0, 35), 50, y);
                doc.text((a.type || '').replace('_', ' '), 120, y);
                doc.setTextColor(...purple); doc.setFont('helvetica', 'bold');
                doc.text(String(Number(a.merit_points).toFixed(1)), 175, y);
                doc.setTextColor(55, 65, 81); doc.setFont('helvetica', 'normal');
                y += 6;
                if (y > 270) { doc.addPage(); y = 20; }
            });
        }

        doc.save(`Sports_CV_${studentName.replace(/\s+/g, '_') || studentId}.pdf`);
    } catch (err: any) {
        alert('PDF generation failed: ' + err.message);
    }
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AchievementsPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isCoach = user?.role === 'Admin' || user?.role === 'Coach';

    // Filters
    const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
    const [chartPeriod, setChartPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
    const [chartActivityId, setChartActivityId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'matches' | 'leaderboard' | 'analytics'>('matches');

    // Match form
    const [showMatchForm, setShowMatchForm] = useState(false);
    const [matchForm, setMatchForm] = useState({
        opponent: '', result: 'Won' as Match['result'],
        level: 'School' as Match['level'], date: new Date().toISOString().split('T')[0],
        score_team: '', score_opponent: '', location: '', notes: '',
    });
    const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);

    // Delete modal
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; matchId: number | null }>({ isOpen: false, matchId: null });

    // Data queries
    const { data: activities } = useQuery({ queryKey: ['activities'], queryFn: activityService.getAll });
    const { data: members } = useQuery({
        queryKey: ['members', selectedActivityId],
        queryFn: () => membershipService.getMembers(selectedActivityId!),
        enabled: !!selectedActivityId,
    });
    const { data: matches, isLoading: matchesLoading } = useQuery({
        queryKey: ['matches', selectedActivityId],
        queryFn: () => achievementService.getMatches(selectedActivityId ?? undefined),
    });
    const { data: leaderboard } = useQuery({
        queryKey: ['leaderboard', selectedActivityId],
        queryFn: () => achievementService.getLeaderboard(selectedActivityId ?? undefined),
    });
    const { data: timeSeries } = useQuery({
        queryKey: ['timeseries', chartActivityId, chartPeriod],
        queryFn: () => achievementService.getTimeSeries(chartActivityId ?? undefined, chartPeriod),
    });

    // Mutations
    const createMatchMutation = useMutation({
        mutationFn: achievementService.createMatch,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['matches'] });
            queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
            queryClient.invalidateQueries({ queryKey: ['timeseries'] });
            setShowMatchForm(false);
            resetMatchForm();
        },
        onError: (err: any) => alert('Failed to save match: ' + (err.response?.data?.error || err.message)),
    });

    const deleteMatchMutation = useMutation({
        mutationFn: achievementService.deleteMatch,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['matches'] });
            queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
            queryClient.invalidateQueries({ queryKey: ['timeseries'] });
            setDeleteModal({ isOpen: false, matchId: null });
        },
        onError: (err: any) => alert('Failed to delete match: ' + (err.response?.data?.error || err.message)),
    });

    const resetMatchForm = () => {
        setMatchForm({ opponent: '', result: 'Won', level: 'School', date: new Date().toISOString().split('T')[0], score_team: '', score_opponent: '', location: '', notes: '' });
        setSelectedParticipants([]);
    };

    const handleCreateMatch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedActivityId) return alert('Please select an activity first.');

        // Validation for positive scores
        const teamScore = matchForm.score_team ? parseInt(matchForm.score_team) : 0;
        const opponentScore = matchForm.score_opponent ? parseInt(matchForm.score_opponent) : 0;
        if (teamScore < 0 || opponentScore < 0) {
            alert('Scores must be non-negative values.');
            return;
        }

        createMatchMutation.mutate({
            activity_id: selectedActivityId,
            opponent: matchForm.opponent,
            result: matchForm.result,
            level: matchForm.level,
            date: matchForm.date,
            score_team: matchForm.score_team ? parseInt(matchForm.score_team) : undefined,
            score_opponent: matchForm.score_opponent ? parseInt(matchForm.score_opponent) : undefined,
            location: matchForm.location || undefined,
            notes: matchForm.notes || undefined,
            participants: selectedParticipants,
        });
    };

    const toggleParticipant = (studentId: number) => {
        setSelectedParticipants(prev =>
            prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
        );
    };

    const previewPoints = useMemo(() =>
        POINTS_MATRIX[matchForm.level]?.[matchForm.result] ?? 5,
        [matchForm.level, matchForm.result]
    );

    const activity = activities?.find(a => a.id === selectedActivityId);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <TrophyIcon className="h-7 w-7 text-[#633194]" /> Achievements & Analytics
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Track match results, merit points, and Sports CV generation.</p>
                </div>
                {isCoach && selectedActivityId && (
                    <button
                        onClick={() => setShowMatchForm(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                        style={{ background: 'linear-gradient(135deg, #633194 0%, #9b59b6 100%)' }}
                    >
                        <PlusIcon className="h-4 w-4" /> Add Match Result
                    </button>
                )}
            </div>

            {/* Activity Selector */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Select Sport</label>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedActivityId(null)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${!selectedActivityId ? 'bg-[#633194] text-white border-[#633194] shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-[#633194]/40'}`}
                    >All Activities</button>
                    {activities?.filter(a => a.type === 'Sport')
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(a => (
                        <button key={a.id}
                            onClick={() => setSelectedActivityId(a.id!)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selectedActivityId === a.id ? 'bg-[#633194] text-white border-[#633194] shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-[#633194]/40'}`}
                        >{a.name}</button>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                {(['matches', 'leaderboard', 'analytics'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${activeTab === tab ? 'bg-white text-[#633194] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >{tab}</button>
                ))}
            </div>

            {/* ── MATCHES TAB ── */}
            {activeTab === 'matches' && (
                <div className="space-y-3">
                    {matchesLoading ? (
                        <div className="flex justify-center h-32 items-center">
                            <div className="w-8 h-8 rounded-full border-4 border-[#633194]/20 border-t-[#633194] animate-spin" />
                        </div>
                    ) : (matches ?? []).length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 p-16 flex flex-col items-center gap-3 text-center">
                            <div className="h-16 w-16 rounded-2xl bg-[#F4F0FF] flex items-center justify-center">
                                <TrophyIcon className="h-8 w-8 text-[#633194]" />
                            </div>
                            <p className="text-gray-600 font-semibold">No matches recorded yet.</p>
                            {isCoach && <p className="text-xs text-gray-400">Click <strong className="text-[#633194]">Add Match Result</strong> to log a match.</p>}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {(matches ?? []).map((match: any) => {
                                const rcfg = RESULT_CONFIG[match.result] ?? RESULT_CONFIG['Participation'];
                                const lcfg = LEVEL_CONFIG[match.level ?? 'School'];
                                const pts = POINTS_MATRIX[match.level ?? 'School']?.[match.result] ?? 5;
                                return (
                                    <div key={match.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className={`text-xs font-bold uppercase tracking-wider ${lcfg?.color ?? 'text-gray-500'}`}>{match.level ?? 'School'}</p>
                                                <p className="text-base font-bold text-gray-800 mt-0.5">vs {match.opponent}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${rcfg.bg} ${rcfg.color} ${rcfg.border}`}>
                                                    {rcfg.label}
                                                </span>
                                                {isCoach && (
                                                    <button onClick={() => setDeleteModal({ isOpen: true, matchId: match.id! })}
                                                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all">
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {(match.score_team != null || match.score_opponent != null) && (
                                            <div className="flex items-center gap-2 text-center">
                                                <div className="flex-1 bg-[#F4F0FF] rounded-xl py-2">
                                                    <p className="text-xl font-bold text-[#633194]">{match.score_team ?? '—'}</p>
                                                    <p className="text-xs text-gray-500">Our Score</p>
                                                </div>
                                                <span className="text-gray-300 font-bold text-lg">:</span>
                                                <div className="flex-1 bg-gray-50 rounded-xl py-2">
                                                    <p className="text-xl font-bold text-gray-600">{match.score_opponent ?? '—'}</p>
                                                    <p className="text-xs text-gray-500">Opponent</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-50">
                                            <span>{new Date(match.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                            <span className="font-bold text-[#633194]">+{pts} pts / player</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── LEADERBOARD TAB ── */}
            {activeTab === 'leaderboard' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Merit Points Leaderboard</h2>
                        <span className="text-xs text-gray-400 font-medium">Formula: (Att% × 0.2) + Match Pts + Role Bonus</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-12">Rank</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Activity</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Score</th>
                                    {isCoach && <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Sports CV</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {(leaderboard ?? []).length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400 text-sm">No leaderboard data yet.</td></tr>
                                ) : (leaderboard ?? []).map((entry: LeaderboardEntry, idx: number) => (
                                    <tr key={`${entry.student_id}-${entry.activity_name}`} className="hover:bg-[#F4F0FF]/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {idx < 3 ? <StarIcon className={`h-5 w-5 ${MEDAL_COLORS[idx]}`} /> : <span className="text-sm text-gray-400 font-bold">#{idx + 1}</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#633194] to-[#9b59b6] flex items-center justify-center text-white text-xs font-bold">
                                                    {(entry.student_name || 'S').charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800 group-hover:text-[#633194] transition-colors">{entry.student_name || `Student #${entry.student_id}`}</p>
                                                    <p className="text-xs text-gray-400">ID #{entry.student_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{entry.activity_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-xs font-semibold bg-[#F4F0FF] text-[#633194] px-2 py-0.5 rounded-full">
                                                {(entry.member_role || 'Member').replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className="text-lg font-bold text-[#633194]">{Number(entry.total_points).toFixed(1)}</span>
                                            <span className="text-xs text-gray-400 ml-1">pts</span>
                                        </td>
                                        {isCoach && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={() => generateCVPdf(entry.student_id, entry.student_name, selectedActivityId ?? undefined)}
                                                    className="flex items-center gap-1 ml-auto text-xs font-semibold text-[#633194] bg-[#F4F0FF] px-3 py-1.5 rounded-lg hover:bg-[#633194] hover:text-white transition-all"
                                                    title="Download Sports CV"
                                                >
                                                    <DocumentArrowDownIcon className="h-3.5 w-3.5" /> CV
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── ANALYTICS TAB ── */}
            {activeTab === 'analytics' && (
                <div className="space-y-4">
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Matches', value: (matches ?? []).length, color: 'text-[#633194]', bg: 'bg-[#F4F0FF]' },
                            { label: 'Wins', value: (matches ?? []).filter((m: any) => m.result === 'Won').length, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                            { label: 'Total Students', value: (leaderboard ?? []).length, color: 'text-blue-700', bg: 'bg-blue-50' },
                            { label: 'Top Score', value: Number((leaderboard ?? [])[0]?.total_points ?? 0).toFixed(1), color: 'text-amber-700', bg: 'bg-amber-50' },
                        ].map((s, i) => (
                            <div key={i} className={`${s.bg} rounded-2xl p-4 flex flex-col gap-1`}>
                                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Chart card */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-base font-bold text-gray-800">Merit Points Over Time</h3>
                                <p className="text-xs text-gray-400 mt-1">Cumulative points awarded across all students</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                {/* Activity Selection for Graph */}
                                <div className="w-full sm:w-48">
                                    <CustomSelect
                                        value={chartActivityId ?? ''}
                                        onChange={(v) => setChartActivityId(v ? parseInt(v as string) : null)}
                                        placeholder="All Activities"
                                        options={(activities ?? []).filter(a => a.type === 'Sport')
                                            .sort((a, b) => a.name.localeCompare(b.name))
                                            .map(a => ({ value: a.id!, label: a.name }))}
                                    />
                                </div>
                                {/* Period Selection for Graph */}
                                <div className="w-full sm:w-36">
                                    <CustomSelect
                                        value={chartPeriod}
                                        onChange={(v) => setChartPeriod(v as 'weekly' | 'monthly' | 'yearly')}
                                        options={[
                                            { value: 'weekly', label: 'Weekly' },
                                            { value: 'monthly', label: 'Monthly' },
                                            { value: 'yearly', label: 'Yearly' },
                                        ]}
                                    />
                                </div>
                            </div>
                        </div>
                        <LineChart data={timeSeries ?? []} period={chartPeriod} />
                    </div>

                    {/* Points formula reference */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="text-sm font-bold text-gray-700 mb-3">Points Matrix</h3>
                        <div className="overflow-x-auto">
                            <table className="text-xs w-full">
                                <thead>
                                    <tr className="text-gray-500 border-b border-gray-100">
                                        <th className="py-2 text-left font-bold pr-4">Level</th>
                                        {['Won', 'Lost', 'Draw', 'Participation'].map(r => (
                                            <th key={r} className="py-2 text-center font-bold px-3">{r}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {['National', 'Provincial', 'District', 'Zonal', 'School'].map(lvl => (
                                        <tr key={lvl} className="border-b border-gray-50 hover:bg-[#F4F0FF]/30">
                                            <td className={`py-2 font-bold pr-4 ${LEVEL_CONFIG[lvl].color}`}>{lvl}</td>
                                            {['Won', 'Lost', 'Draw', 'Participation'].map(r => (
                                                <td key={r} className="py-2 text-center text-gray-700 px-3 font-medium">
                                                    {POINTS_MATRIX[lvl]?.[r] ?? '—'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-gray-400 mt-3">Plus: Attendance (Att% × 0.2, max 20 pts) · Captain Bonus (+20 pts via Special Recognition)</p>
                    </div>
                </div>
            )}

            {/* ── ADD MATCH MODAL ── */}
            {showMatchForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="px-6 py-4 flex items-center justify-between sticky top-0 z-10"
                            style={{ background: 'linear-gradient(135deg, #633194 0%, #9b59b6 100%)' }}>
                            <div className="flex items-center gap-2">
                                <TrophyIcon className="h-5 w-5 text-white" />
                                <h2 className="text-base font-bold text-white">Add Match Result</h2>
                            </div>
                            <button onClick={() => { setShowMatchForm(false); resetMatchForm(); }}
                                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateMatch} className="p-6 space-y-4">
                            {/* Activity info */}
                            {activity && (
                                <div className="bg-[#F4F0FF] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#633194]">
                                    📍 {activity.name}
                                </div>
                            )}

                            {/* Opponent + Date */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Opponent *</label>
                                    <input required type="text" placeholder="e.g. Royal College"
                                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#633194] focus:ring-2 focus:ring-[#633194]/15 transition-all bg-gray-50 focus:bg-white"
                                        value={matchForm.opponent} onChange={e => setMatchForm(f => ({ ...f, opponent: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Date *</label>
                                    <DateTimePicker 
                                        mode="date"
                                        value={matchForm.date} 
                                        onChange={val => setMatchForm(f => ({ ...f, date: val }))} 
                                    />
                                </div>
                            </div>

                            {/* Level */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Level *</label>
                                <div className="flex flex-wrap gap-2">
                                    {(['School', 'Zonal', 'District', 'Provincial', 'National'] as const).map(lvl => (
                                        <button key={lvl} type="button"
                                            onClick={() => setMatchForm(f => ({ ...f, level: lvl }))}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${matchForm.level === lvl
                                                ? 'bg-[#633194] text-white border-[#633194] shadow-sm'
                                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                        >{lvl}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Result */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Result *</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(['Won', 'Lost', 'Draw', 'Participation'] as const).map(r => {
                                        const rcfg = RESULT_CONFIG[r];
                                        const selected = matchForm.result === r;
                                        return (
                                            <button key={r} type="button"
                                                onClick={() => setMatchForm(f => ({ ...f, result: r }))}
                                                className={`py-2 text-xs font-semibold rounded-lg border transition-all ${selected ? `${rcfg.bg} ${rcfg.color} ${rcfg.border} shadow-sm` : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                                            >{r}</button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Points preview */}
                            <div className="bg-gradient-to-r from-[#F4F0FF] to-[#f9f7ff] rounded-xl px-4 py-3 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-[#633194] font-bold uppercase tracking-wider">Auto-Awarded Points</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Per selected participant</p>
                                </div>
                                <span className="text-2xl font-bold text-[#633194]">+{previewPoints}</span>
                            </div>

                            {/* Scores */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Our Score</label>
                                    <input type="number" min="0" placeholder="0"
                                        onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#633194] focus:ring-2 focus:ring-[#633194]/15 bg-gray-50 focus:bg-white"
                                        value={matchForm.score_team} onChange={e => setMatchForm(f => ({ ...f, score_team: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Opponent Score</label>
                                    <input type="number" min="0" placeholder="0"
                                        onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#633194] focus:ring-2 focus:ring-[#633194]/15 bg-gray-50 focus:bg-white"
                                        value={matchForm.score_opponent} onChange={e => setMatchForm(f => ({ ...f, score_opponent: e.target.value }))} />
                                </div>
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Location</label>
                                <input type="text" placeholder="e.g. Racecourse Grounds"
                                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#633194] focus:ring-2 focus:ring-[#633194]/15 bg-gray-50 focus:bg-white"
                                    value={matchForm.location} onChange={e => setMatchForm(f => ({ ...f, location: e.target.value }))} />
                            </div>

                            {/* Participants */}
                            {members && members.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Participating Students</label>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => setSelectedParticipants(members.map((m: any) => m.student_id))}
                                                className="text-xs text-[#633194] font-semibold hover:underline">All</button>
                                            <button type="button" onClick={() => setSelectedParticipants([])}
                                                className="text-xs text-gray-400 font-semibold hover:underline">None</button>
                                        </div>
                                    </div>
                                    <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                                        {members.map((m: any) => {
                                            const checked = selectedParticipants.includes(m.student_id);
                                            return (
                                                <button key={m.id} type="button"
                                                    onClick={() => toggleParticipant(m.student_id)}
                                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-all text-left ${checked ? 'bg-[#F4F0FF] border-purple-200 text-[#633194]' : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-200'}`}
                                                >
                                                    {checked
                                                        ? <CheckCircleIcon className="h-4 w-4 text-[#633194] flex-shrink-0" />
                                                        : <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                                    }
                                                    <span className="text-sm font-medium">{m.student_name || `Student #${m.student_id}`}</span>
                                                    <span className="ml-auto text-xs opacity-60">{m.role?.replace('_', ' ')}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">{selectedParticipants.length} selected · Points awarded automatically on save</p>
                                </div>
                            )}

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Notes</label>
                                <textarea rows={2} placeholder="Any additional notes…"
                                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#633194] focus:ring-2 focus:ring-[#633194]/15 bg-gray-50 focus:bg-white resize-none"
                                    value={matchForm.notes} onChange={e => setMatchForm(f => ({ ...f, notes: e.target.value }))} />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => { setShowMatchForm(false); resetMatchForm(); }}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                                    Cancel
                                </button>
                                <button type="submit" disabled={createMatchMutation.isPending}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg, #633194 0%, #9b59b6 100%)' }}>
                                    {createMatchMutation.isPending ? 'Saving…' : 'Save & Award Points'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                title="Delete Match"
                message="Are you sure you want to delete this match? All associated achievement points will also be removed."
                confirmText="Delete Match"
                onConfirm={() => deleteMatchMutation.mutate(deleteModal.matchId!)}
                onCancel={() => setDeleteModal({ isOpen: false, matchId: null })}
                isLoading={deleteMatchMutation.isPending}
            />
        </div>
    );
}
