import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityService, attendanceService, membershipService } from '../../services/api';
import type { AttendanceStatus, AttendanceRecord } from '../../services/api';
import { useAuth } from '../../utils/auth';
import clsx from 'clsx';
import CheckCircleIcon from '@heroicons/react/24/solid/CheckCircleIcon';
import XCircleIcon from '@heroicons/react/24/solid/XCircleIcon';
import ClockIcon from '@heroicons/react/24/solid/ClockIcon';
import MinusCircleIcon from '@heroicons/react/24/solid/MinusCircleIcon';
import CalendarDaysIcon from '@heroicons/react/24/outline/CalendarDaysIcon';
import PlusIcon from '@heroicons/react/24/outline/PlusIcon';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import UserGroupIcon from '@heroicons/react/24/outline/UserGroupIcon';

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
    Present: { label: 'Present', icon: CheckCircleIcon, color: 'text-[#10b981]', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    Absent: { label: 'Absent', icon: XCircleIcon, color: 'text-[#e11d48]', bg: 'bg-red-50', border: 'border-red-200' },
    Late: { label: 'Late', icon: ClockIcon, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
    Excused: { label: 'Excused', icon: MinusCircleIcon, color: 'text-[#7e22ce]', bg: 'bg-purple-50', border: 'border-purple-200' },
};
const STATUS_ORDER: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Excused'];

export default function AttendancePage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isCoach = user?.role === 'Admin' || user?.role === 'Coach';

    // -- State --
    const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
    const [localStatus, setLocalStatus] = useState<Record<number, AttendanceStatus>>({});
    const [showNewSession, setShowNewSession] = useState(false);
    const [newSession, setNewSession] = useState({ start_time: '', end_time: '' });
    const [saved, setSaved] = useState(false);

    // -- Data Fetching --
    const { data: activities } = useQuery({
        queryKey: ['activities'],
        queryFn: activityService.getAll,
    });

    const { data: sessions } = useQuery({
        queryKey: ['sessions', selectedActivityId],
        queryFn: () => attendanceService.getSessions(selectedActivityId!),
        enabled: !!selectedActivityId,
    });

    const { data: members } = useQuery({
        queryKey: ['members', selectedActivityId],
        queryFn: () => membershipService.getMembers(selectedActivityId!),
        enabled: !!selectedActivityId,
    });

    const { data: existingAttendance } = useQuery({
        queryKey: ['sessionAttendance', selectedSessionId],
        queryFn: () => attendanceService.getSessionAttendance(selectedSessionId!),
        enabled: !!selectedSessionId,
    });

    // Pre-populate localStatus when existing attendance is loaded
    useEffect(() => {
        if (existingAttendance) {
            const map: Record<number, AttendanceStatus> = {};
            (existingAttendance as AttendanceRecord[]).forEach((rec) => { map[rec.student_id] = rec.status; });
            setLocalStatus(map);
            setSaved(false);
        }
    }, [existingAttendance]);

    // -- Mutations --
    const createSessionMutation = useMutation({
        mutationFn: (data: { activity_id: number; coach_id: number; start_time: string; end_time: string }) =>
            attendanceService.createSession(data),
        onSuccess: (session) => {
            queryClient.invalidateQueries({ queryKey: ['sessions', selectedActivityId] });
            setSelectedSessionId(session.id);
            setShowNewSession(false);
            setNewSession({ start_time: '', end_time: '' });
            // Default all members to Absent
            const defaults: Record<number, AttendanceStatus> = {};
            members?.forEach((m) => { defaults[m.student_id] = 'Absent'; });
            setLocalStatus(defaults);
        },
    });

    const bulkMarkMutation = useMutation({
        mutationFn: () =>
            attendanceService.bulkMark(
                selectedSessionId!,
                Object.entries(localStatus).map(([sid, status]) => ({
                    student_id: parseInt(sid),
                    status,
                }))
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessionAttendance', selectedSessionId] });
            setSaved(true);
        },
        onError: (err: any) => {
            alert('Failed to save attendance: ' + (err.response?.data?.error || err.message));
        },
    });

    const deleteSessionMutation = useMutation({
        mutationFn: (id: number) => attendanceService.deleteSession(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions', selectedActivityId] });
            setSelectedSessionId(null);
            setLocalStatus({});
        },
    });

    // -- Handlers --
    const cycleStatus = (studentId: number) => {
        const current = localStatus[studentId] || 'Absent';
        const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length];
        setLocalStatus((prev) => ({ ...prev, [studentId]: next }));
        setSaved(false);
    };

    const setAllStatus = (status: AttendanceStatus) => {
        const all: Record<number, AttendanceStatus> = {};
        members?.forEach((m) => { all[m.student_id] = status; });
        setLocalStatus(all);
        setSaved(false);
    };

    const handleCreateSession = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedActivityId) return;
        createSessionMutation.mutate({
            activity_id: selectedActivityId,
            coach_id: user?.id || 1,
            start_time: newSession.start_time,
            end_time: newSession.end_time,
        });
    };


    return (
        <div className="space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[#1a3b70]">Attendance Check-In</h1>
                <p className="text-sm text-gray-500 mt-1">Select an activity and session to mark attendance.</p>
            </div>

            {/* Step 1 — Select Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg border border-gray-100 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] p-4">
                    <label className="block text-xs font-bold text-[#1a3b70] uppercase tracking-wider mb-2">
                        1 · Select Activity
                    </label>
                    <select
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1a3b70] transition-colors"
                        value={selectedActivityId ?? ''}
                        onChange={(e) => {
                            setSelectedActivityId(e.target.value ? parseInt(e.target.value) : null);
                            setSelectedSessionId(null);
                            setLocalStatus({});
                        }}
                    >
                        <option value="">-- Choose Activity --</option>
                        {activities?.map((a) => (
                            <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                        ))}
                    </select>
                </div>

                {/* Step 2 — Select or Create Session */}
                <div className="bg-white rounded-lg border border-gray-100 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] p-4">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-[#1a3b70] uppercase tracking-wider">
                            2 · Select Session
                        </label>
                        {selectedActivityId && isCoach && (
                            <button
                                onClick={() => setShowNewSession(!showNewSession)}
                                className="flex items-center gap-1 text-xs font-medium text-[#1a3b70] hover:text-indigo-900 transition-colors"
                            >
                                <PlusIcon className="h-4 w-4" /> New
                            </button>
                        )}
                    </div>

                    {showNewSession && (
                        <form onSubmit={handleCreateSession} className="bg-blue-50 border border-blue-100 rounded-md p-3 mb-3 space-y-2">
                            <p className="text-xs font-semibold text-[#1a3b70]">Create New Session</p>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-gray-500">Start</label>
                                    <input type="datetime-local" required
                                        className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-[#1a3b70]"
                                        value={newSession.start_time}
                                        onChange={(e) => setNewSession({ ...newSession, start_time: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">End</label>
                                    <input type="datetime-local" required
                                        className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-[#1a3b70]"
                                        value={newSession.end_time}
                                        onChange={(e) => setNewSession({ ...newSession, end_time: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button type="submit"
                                disabled={createSessionMutation.isPending}
                                className="w-full bg-[#1a3b70] text-white text-xs font-medium py-1.5 rounded hover:bg-[#11274a] transition-colors disabled:opacity-50"
                            >
                                {createSessionMutation.isPending ? 'Creating…' : 'Create & Start Check-In'}
                            </button>
                        </form>
                    )}

                    <select
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1a3b70] transition-colors"
                        value={selectedSessionId ?? ''}
                        onChange={(e) => {
                            setSelectedSessionId(e.target.value ? parseInt(e.target.value) : null);
                            setLocalStatus({});
                        }}
                        disabled={!selectedActivityId}
                    >
                        <option value="">-- Choose Session --</option>
                        {sessions?.map((s) => (
                            <option key={s.id} value={s.id}>
                                {new Date(s.start_time).toLocaleString()} → {new Date(s.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </option>
                        ))}
                    </select>
                    {selectedSessionId && isCoach && (
                        <button
                            onClick={() => { if (window.confirm('Delete this session?')) deleteSessionMutation.mutate(selectedSessionId); }}
                            className="mt-2 flex items-center gap-1 text-xs text-[#e11d48] hover:text-red-700 transition-colors font-medium"
                        >
                            <TrashIcon className="h-3.5 w-3.5" /> Delete session
                        </button>
                    )}
                </div>
            </div>

            {/* Step 3 — Mark Attendance */}
            {selectedSessionId && members && members.length > 0 && (
                <>
                    {/* Stats Summary Row */}
                    <div className="grid grid-cols-4 gap-3">
                        {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((s) => {
                            const cfg = STATUS_CONFIG[s];
                            const count = Object.values(localStatus).filter((v) => v === s).length;
                            return (
                                <div key={s} className={clsx('rounded-lg border p-3 text-center cursor-pointer hover:opacity-80 transition-opacity', cfg.bg, cfg.border)} onClick={() => setAllStatus(s)}>
                                    <p className={clsx('text-2xl font-bold', cfg.color)}>{count}</p>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">{cfg.label}</p>
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-xs text-gray-400 -mt-2 text-right">Tap a stat to mark all students</p>

                    {/* Quick-mark all */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500 font-medium">Quick mark all:</span>
                        {STATUS_ORDER.map((s) => {
                            const cfg = STATUS_CONFIG[s];
                            return (
                                <button key={s} onClick={() => setAllStatus(s)}
                                    className={clsx('flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:opacity-80', cfg.bg, cfg.color, cfg.border)}
                                >
                                    <cfg.icon className="h-3.5 w-3.5" /> {cfg.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Students list — one large tap-friendly card per student */}
                    <div className="space-y-2">
                        {members.map((member) => {
                            const status: AttendanceStatus = localStatus[member.student_id] || 'Absent';
                            const cfg = STATUS_CONFIG[status];
                            const Ico = cfg.icon;
                            return (
                                <div key={member.id}
                                    onClick={() => cycleStatus(member.student_id)}
                                    className={clsx(
                                        'flex items-center justify-between px-5 py-4 rounded-lg border cursor-pointer select-none transition-all',
                                        cfg.bg, cfg.border
                                    )}
                                >
                                    {/* Left: student info */}
                                    <div className="flex items-center gap-3">
                                        <div className={clsx('h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm', cfg.bg, cfg.color, 'border', cfg.border)}>
                                            {member.student_id}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">Student #{member.student_id}</p>
                                            <p className="text-xs text-gray-500">{member.role.replace('_', ' ')}</p>
                                        </div>
                                    </div>

                                    {/* Right: status badge */}
                                    <div className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-semibold text-xs', cfg.color, cfg.bg, cfg.border)}>
                                        <Ico className="h-4 w-4" />
                                        {cfg.label}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Save Button */}
                    <div className="sticky bottom-4">
                        <button
                            onClick={() => bulkMarkMutation.mutate()}
                            disabled={bulkMarkMutation.isPending || Object.keys(localStatus).length === 0}
                            className={clsx(
                                'w-full py-4 rounded-xl font-bold text-sm shadow-lg transition-all',
                                saved
                                    ? 'bg-[#10b981] text-white'
                                    : 'bg-[#1a3b70] text-white hover:bg-[#11274a] disabled:opacity-50'
                            )}
                        >
                            {bulkMarkMutation.isPending
                                ? 'Saving…'
                                : saved
                                    ? '✓ Attendance Saved!'
                                    : `Save Attendance (${members.length} students)`}
                        </button>
                    </div>
                </>
            )}

            {/* Empty state — session selected but no members */}
            {selectedSessionId && members && members.length === 0 && (
                <div className="bg-white rounded-lg border border-gray-100 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] p-10 flex flex-col items-center gap-3 text-center">
                    <UserGroupIcon className="h-12 w-12 text-gray-300" />
                    <p className="text-gray-500 font-medium">No members registered for this activity.</p>
                    <p className="text-xs text-gray-400">Register students first from the Activities page.</p>
                </div>
            )}

            {/* Empty state — no selection */}
            {!selectedSessionId && !showNewSession && (
                <div className="bg-white rounded-lg border border-gray-100 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] p-10 flex flex-col items-center gap-3 text-center">
                    <CalendarDaysIcon className="h-12 w-12 text-gray-300" />
                    <p className="text-gray-500 font-medium">Select an activity and session to begin.</p>
                    {isCoach && <p className="text-xs text-gray-400">Or create a new session using the <strong>+ New</strong> button.</p>}
                </div>
            )}
        </div>
    );
}
