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
import DateTimePicker from '../../components/ui/DateTimePicker';
import CustomSelect from '../../components/ui/CustomSelect';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: React.ElementType; color: string; bg: string; border: string; ring: string }> = {
    Present: { label: 'Present', icon: CheckCircleIcon, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-400' },
    Absent: { label: 'Absent', icon: XCircleIcon, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', ring: 'ring-red-400' },
    Late: { label: 'Late', icon: ClockIcon, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-400' },
    Excused: { label: 'Excused', icon: MinusCircleIcon, color: 'text-[#633194]', bg: 'bg-[#F4F0FF]', border: 'border-purple-200', ring: 'ring-purple-400' },
};
const STATUS_ORDER: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Excused'];

import { motion, AnimatePresence } from 'framer-motion';



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
    const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, sessionId: number | null, dateStr: string}>({ isOpen: false, sessionId: null, dateStr: '' });
    const [saved, setSaved] = useState(false);
    const [activePopover, setActivePopover] = useState<number | null>(null);
    const [saveModal, setSaveModal] = useState(false);

    // -- Data Fetching --
    const { data: activities } = useQuery({ queryKey: ['activities'], queryFn: activityService.getAll });

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
            const defaults: Record<number, AttendanceStatus> = {};
            members?.forEach((m) => { defaults[m.student_id] = 'Absent'; });
            setLocalStatus(defaults);
        },
    });

    const bulkMarkMutation = useMutation({
        mutationFn: () =>
            attendanceService.bulkMark(
                selectedSessionId!,
                Object.entries(localStatus).map(([sid, status]) => ({ student_id: parseInt(sid), status }))
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
        onError: (err: any) => {
            alert('Failed to delete session: ' + (err.response?.data?.error || err.message));
        }
    });

    const handleConfirmSave = () => {
        bulkMarkMutation.mutate(undefined, {
            onSuccess: () => setSaveModal(false)
        });
    };

    // -- Handlers --


    const setIndividualStatus = (studentId: number, status: AttendanceStatus) => {
        setLocalStatus((prev) => ({ ...prev, [studentId]: status }));
        setSaved(false);
        setActivePopover(null);
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

    const confirmDeleteSession = () => {
        if (deleteModal.sessionId) {
            deleteSessionMutation.mutate(deleteModal.sessionId, {
                onSuccess: () => setDeleteModal({ ...deleteModal, isOpen: false })
            });
        }
    };

    const presentCount = Object.values(localStatus).filter(v => v === 'Present').length;
    const absentCount = Object.values(localStatus).filter(v => v === 'Absent').length;
    const attendanceRate = members?.length ? Math.round((presentCount / members.length) * 100) : 0;

    return (
        <div className="space-y-5">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Attendance Check-In</h1>
                <p className="text-sm text-gray-500 mt-0.5">Select an activity and session to mark attendance.</p>
            </div>

            {/* Step Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Step 1 – Activity */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="h-6 w-6 rounded-full bg-[#633194] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                        <label className="text-sm font-bold text-gray-700">Select Activity</label>
                    </div>
                    <CustomSelect
                        value={selectedActivityId ?? ''}
                        onChange={(v) => {
                            setSelectedActivityId(v ? parseInt(v as string) : null);
                            setSelectedSessionId(null);
                            setLocalStatus({});
                        }}
                        placeholder="— Choose Activity —"
                        options={(activities ?? []).map(a => ({ value: a.id, label: `${a.name} (${a.type})` }))}
                    />
                </div>

                {/* Step 2 – Session */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="h-6 w-6 rounded-full bg-[#633194] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                            <label className="text-sm font-bold text-gray-700">Select Session</label>
                        </div>
                        {selectedActivityId && isCoach && (
                            <button
                                onClick={() => setShowNewSession(!showNewSession)}
                                className="flex items-center gap-1 text-xs font-semibold text-[#633194] bg-[#F4F0FF] px-2.5 py-1 rounded-lg hover:bg-[#633194] hover:text-white transition-all"
                            >
                                <PlusIcon className="h-3.5 w-3.5" /> New
                            </button>
                        )}
                    </div>

                    {/* New Session Form */}
                    {showNewSession && (
                        <div className="bg-[#F4F0FF] border border-purple-200 rounded-xl p-4 mb-3 space-y-3">
                            <p className="text-xs font-bold text-[#633194]">Create New Session</p>
                            <form onSubmit={handleCreateSession} className="space-y-3">
                                <DateTimePicker
                                    label="Start"
                                    mode="datetime"
                                    value={newSession.start_time}
                                    onChange={(v) => setNewSession(s => ({ ...s, start_time: v }))}
                                    placeholder="Pick start date & time"
                                    required
                                />
                                <DateTimePicker
                                    label="End"
                                    mode="datetime"
                                    value={newSession.end_time}
                                    onChange={(v) => setNewSession(s => ({ ...s, end_time: v }))}
                                    placeholder="Pick end date & time"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={createSessionMutation.isPending || !newSession.start_time || !newSession.end_time}
                                    className="w-full py-2 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg, #633194 0%, #9b59b6 100%)' }}
                                >
                                    {createSessionMutation.isPending ? 'Creating…' : 'Create & Start Check-In'}
                                </button>
                            </form>
                        </div>
                    )}

                    <CustomSelect
                        value={selectedSessionId ?? ''}
                        onChange={(v) => {
                            setSelectedSessionId(v ? parseInt(v as string) : null);
                            setLocalStatus({});
                        }}
                        placeholder="— Choose Session —"
                        disabled={!selectedActivityId}
                        options={(sessions ?? []).map(s => ({
                            value: s.id,
                            label: `${new Date(s.start_time).toLocaleString()} → ${new Date(s.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                        }))}
                    />

                    {selectedSessionId && isCoach && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const session = (sessions ?? []).find(s => s.id === selectedSessionId);
                                const dateStr = session ? `${new Date(session.start_time).toLocaleString()} to ${new Date(session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '';
                                setDeleteModal({ isOpen: true, sessionId: selectedSessionId, dateStr });
                            }}
                            className="mt-2 flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors font-medium z-10 relative"
                        >
                            <TrashIcon className="h-3.5 w-3.5" /> Delete session
                        </button>
                    )}
                </div>
            </div>

            {/* Step 3 – Mark Attendance */}
            {selectedSessionId && members && members.length > 0 && (
                <>
                    {/* Live Stats */}
                    <div className="grid grid-cols-4 gap-3">
                        {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((s) => {
                            const cfg = STATUS_CONFIG[s];
                            const count = Object.values(localStatus).filter((v) => v === s).length;
                            return (
                                <div
                                    key={s}
                                    className={clsx(
                                        'rounded-2xl border p-4 text-center transition-all bg-white relative overflow-hidden group',
                                        cfg.border
                                    )}
                                >
                                    <div className={clsx('absolute top-0 right-0 h-16 w-16 -mr-8 -mt-8 opacity-5 rounded-full', cfg.bg.replace('bg-', 'bg-'))} style={{backgroundColor: 'currentColor'}} />
                                    <p className={clsx('text-3xl font-black tracking-tight', cfg.color)}>{count}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{cfg.label}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Progress Bar + Rate */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-gray-700">Attendance Progress</span>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="text-emerald-600 font-bold">{presentCount} present</span>
                                <span className="text-red-400 font-bold">{absentCount} absent</span>
                                <span className="text-[#633194] font-bold text-sm">{attendanceRate}%</span>
                            </div>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${attendanceRate}%`,
                                    background: 'linear-gradient(90deg, #633194, #9b59b6)',
                                }}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-right">Progress is calculated based on current session markings</p>
                    </div>

                    {/* Quick-mark all buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500 font-semibold">Quick mark all:</span>
                        {STATUS_ORDER.map((s) => {
                            const cfg = STATUS_CONFIG[s];
                            return (
                                <button
                                    key={s}
                                    onClick={() => setAllStatus(s)}
                                    className={clsx(
                                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:shadow-sm',
                                        cfg.bg, cfg.color, cfg.border
                                    )}
                                >
                                    <cfg.icon className="h-3.5 w-3.5" /> {cfg.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Students List */}
                    <div className="space-y-3">
                        {members.map((member, idx) => {
                            const status: AttendanceStatus = localStatus[member.student_id] || 'Absent';
                            const cfg = STATUS_CONFIG[status];
                            const Ico = cfg.icon;

                            // Avatar letter fallback from index
                            const letter = String.fromCharCode(65 + (idx % 26));
                            const isPopoverOpen = activePopover === member.student_id;

                            return (
                                <div
                                    key={member.id}
                                    className={clsx(
                                        'relative flex items-center justify-between px-5 py-4 rounded-2xl border transition-all duration-300',
                                        isPopoverOpen ? 'bg-white border-[#633194] shadow-lg ring-4 ring-[#633194]/5' : 'bg-white border-gray-100 hover:border-gray-300'
                                    )}
                                >
                                    {/* Left: student info */}
                                    <div className="flex items-center gap-3">
                                        <div className={clsx(
                                            'h-11 w-11 rounded-full flex items-center justify-center font-bold text-sm border-2 shadow-sm transition-colors',
                                            isPopoverOpen ? 'bg-[#633194] text-white border-[#633194]' : `${cfg.bg} ${cfg.color} ${cfg.border}`
                                        )}>
                                            {letter}
                                        </div>
                                        <div>
                                            <p className="text-[15px] font-bold text-gray-800">Student #{member.student_id}</p>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{member.role.replace('-', ' ')}</p>
                                        </div>
                                    </div>

                                    {/* Right: status and popover */}
                                    <div className="relative">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActivePopover(isPopoverOpen ? null : member.student_id);
                                            }}
                                            className={clsx(
                                                'flex items-center gap-2 px-4 py-2 rounded-xl border text-[13px] font-bold transition-all shadow-sm active:scale-95',
                                                cfg.color, cfg.bg, cfg.border,
                                                'hover:shadow-md hover:-translate-y-0.5'
                                            )}
                                        >
                                            <Ico className="h-4 w-4" />
                                            {cfg.label}
                                        </button>

                                        <AnimatePresence>
                                            {isPopoverOpen && (
                                                <>
                                                    {/* Backdrop for closing */}
                                                    <div className="fixed inset-0 z-40" onClick={() => setActivePopover(null)} />
                                                    
                                                    {/* Popover Menu */}
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                        className="absolute right-0 bottom-full mb-3 p-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 flex gap-2 min-w-[280px]"
                                                    >
                                                        {STATUS_ORDER.map((s) => {
                                                            const scfg = STATUS_CONFIG[s];
                                                            const SIco = scfg.icon;
                                                            return (
                                                                <button
                                                                    key={s}
                                                                    onClick={() => setIndividualStatus(member.student_id, s)}
                                                                    className={clsx(
                                                                        'flex-1 flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all border-2',
                                                                        scfg.bg, scfg.color,
                                                                        status === s 
                                                                            ? `${scfg.border} shadow-sm scale-110 z-10` 
                                                                            : 'border-transparent opacity-40 hover:opacity-100 hover:scale-105'
                                                                    )}
                                                                >
                                                                    <SIco className="h-6 w-6" />
                                                                    <span className="text-[9px] font-black uppercase tracking-tight">{scfg.label}</span>
                                                                </button>
                                                            );
                                                        })}
                                                        {/* Arrow */}
                                                        <div className="absolute top-full right-6 -mt-1 w-3 h-3 bg-white border-b border-r border-gray-100 rotate-45" />
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Sticky Save Button */}
                    <div className="sticky bottom-4">
                        <button
                            onClick={() => setSaveModal(true)}
                            disabled={bulkMarkMutation.isPending || Object.keys(localStatus).length === 0 || saved}
                            className={clsx(
                                'w-full py-4 rounded-2xl font-bold text-sm shadow-lg transition-all',
                                saved
                                    ? 'bg-emerald-500 text-white cursor-default'
                                    : 'text-white hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed'
                            )}
                            style={saved ? {} : { background: 'linear-gradient(135deg, #633194 0%, #9b59b6 100%)' }}
                        >
                            {bulkMarkMutation.isPending
                                ? 'Saving…'
                                : saved
                                    ? '✓ Attendance Saved!'
                                    : `Save Attendance (${members?.length || 0} students)`}
                        </button>
                    </div>
                </>
            )}

            {/* Empty state — session selected but no members */}
            {selectedSessionId && members && members.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 flex flex-col items-center gap-3 text-center">
                    <UserGroupIcon className="h-14 w-14 text-gray-200" />
                    <p className="text-gray-600 font-semibold">No members registered for this activity.</p>
                    <p className="text-xs text-gray-400">Register students first from the Activities page.</p>
                </div>
            )}

            {/* Empty state — no selection yet */}
            {!selectedSessionId && !showNewSession && (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 flex flex-col items-center gap-3 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-[#F4F0FF] flex items-center justify-center">
                        <CalendarDaysIcon className="h-8 w-8 text-[#633194]" />
                    </div>
                    <p className="text-gray-700 font-semibold">Select an activity and session to begin.</p>
                    {isCoach && <p className="text-xs text-gray-400">Or create a new session using the <strong className="text-[#633194]">+ New</strong> button.</p>}
                </div>
            )}
            
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                title="Delete Session"
                message={`Are you sure you want to delete the session${deleteModal.dateStr ? ` from ${deleteModal.dateStr}` : ''}? All attendance records for this session will be permanently removed.`}
                confirmText="Delete Session"
                onConfirm={confirmDeleteSession}
                onCancel={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                isLoading={deleteSessionMutation.isPending}
            />

            <ConfirmationModal
                isOpen={saveModal}
                title="Save Attendance Changes?"
                message={`Are you sure you want to save the attendance markings for ${members?.length || 0} students? This will update the official session records.`}
                confirmText="Yes, Save Records"
                onConfirm={handleConfirmSave}
                onCancel={() => setSaveModal(false)}
                isLoading={bulkMarkMutation.isPending}
            />
        </div>
    );
}
