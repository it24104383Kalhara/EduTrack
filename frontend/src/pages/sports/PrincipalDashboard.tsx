import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '../../services/api';
import type { AttendanceReport } from '../../services/api';
import { useAuth } from '../../utils/auth';
import clsx from 'clsx';
import CheckCircleIcon from '@heroicons/react/24/solid/CheckCircleIcon';
import XCircleIcon from '@heroicons/react/24/solid/XCircleIcon';
import BellAlertIcon from '@heroicons/react/24/outline/BellAlertIcon';
import ClipboardDocumentListIcon from '@heroicons/react/24/outline/ClipboardDocumentListIcon';
import CalendarDaysIcon from '@heroicons/react/24/outline/CalendarDaysIcon';
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CFG = {
    Pending:  { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-400'   },
    Approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    Rejected: { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200',     dot: 'bg-red-500'     },
};

export default function PrincipalDashboard() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const detailRef = useRef<HTMLDivElement>(null);

    const [statusFilter,      setStatusFilter]      = useState('');
    const [selectedReport,    setSelectedReport]    = useState<AttendanceReport | null>(null);
    const [approveModal,      setApproveModal]      = useState(false);
    const [teachersToNotify,  setTeachersToNotify]  = useState<{ id: string; grade: string; teacher: string }[]>([]);

    const { data: reports, isLoading } = useQuery({
        queryKey: ['allReports', statusFilter],
        queryFn: () => reportService.getAll(statusFilter ? { status: statusFilter } : undefined),
    });

    const reviewMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: 'Approved' | 'Rejected' }) =>
            reportService.review(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allReports'] });
            if (selectedReport) {
                setSelectedReport(prev => prev ? { ...prev, status: 'Approved' } : null);
            }
        },
        onError: (err: any) => alert(err.response?.data?.error || err.message),
    });

    const handleSelectReport = (r: AttendanceReport) => {
        setSelectedReport(r);
        // scroll the detail panel to top
        setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    };

    const handleOpenApproveModal = () => {
        let extracted: { id: string; grade: string; teacher: string; students: any[] }[] = [];
        if (selectedReport?.report_details) {
            try {
                const details = JSON.parse(selectedReport.report_details);
                const map = new Map<string, { id: string; grade: string; teacher: string; students: any[] }>();
                details.forEach((d: any) => {
                    const key = `${d.grade || 'Unknown'}-${d.class_teacher_name || 'Unknown'}`;
                    if (!map.has(key)) map.set(key, { id: Math.random().toString(), grade: d.grade || 'Unknown', teacher: d.class_teacher_name || 'Unknown', students: [] });
                    map.get(key)!.students.push(d);
                });
                extracted = Array.from(map.values());
            } catch { /* ignore parse error */ }
        }
        if (extracted.length === 0) extracted = [{ id: Math.random().toString(), grade: 'All', teacher: 'Unknown Teacher', students: [] }];
        setTeachersToNotify(extracted);
        setApproveModal(true);
    };

    const handleConfirmApprove = async () => {
        if (!selectedReport) return;
        try {
            await reviewMutation.mutateAsync({ id: selectedReport.id, status: 'Approved' });
            const dateStr = new Date(selectedReport.report_date).toLocaleDateString('en-US');
            for (const t of teachersToNotify as any[]) {
                const present = t.students?.filter((s: any) => s.status === 'Present') || [];
                const list = present.length > 0
                    ? present.map((s: any) => `• ${s.student_name || `ID: ${s.student_id}`}`).join('\n')
                    : 'No attendance records';
                const msg = `Please update class attendance for Grade ${t.grade} (${t.teacher}).\nActivity: ${selectedReport.activity_name}\nDate: ${dateStr}\n\nPresent Students:\n${list}`;
                await reportService.notifyTeacher(selectedReport.id, 1, msg);
            }
            alert('Report approved and teacher notifications sent!');
        } catch (e: any) {
            console.error(e);
            alert('An error occurred during the approval process.');
        } finally {
            setApproveModal(false);
        }
    };

    const attendanceRate = (r: AttendanceReport) =>
        r.total_students > 0 ? Math.round(((r.present_count + r.late_count) / r.total_students) * 100) : 0;

    // Summary counts
    const pending  = reports?.filter(r => r.status === 'Pending').length  ?? 0;
    const approved = reports?.filter(r => r.status === 'Approved').length ?? 0;
    const rejected = reports?.filter(r => r.status === 'Rejected').length ?? 0;

    return (
        <div className="space-y-6">
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Principal Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Review coach attendance reports and notify class teachers.</p>
                </div>

                {/* Summary pills */}
                <div className="flex gap-2 flex-shrink-0">
                    <span className="px-3 py-1.5 rounded-xl border bg-amber-50 text-amber-700 border-amber-200 text-xs font-bold">{pending} Pending</span>
                    <span className="px-3 py-1.5 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold">{approved} Approved</span>
                    <span className="px-3 py-1.5 rounded-xl border bg-red-50 text-red-600 border-red-200 text-xs font-bold">{rejected} Rejected</span>
                </div>
            </div>

            {/* ── Filter Tabs ───────────────────────────────────────────────── */}
            <div className="flex gap-2 flex-wrap">
                {(['', 'Pending', 'Approved', 'Rejected'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={clsx(
                            'px-4 py-1.5 rounded-full text-xs font-bold border transition-all',
                            statusFilter === f
                                ? 'text-white border-transparent shadow-md'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-[#633194] hover:text-[#633194]'
                        )}
                        style={statusFilter === f ? { background: 'linear-gradient(135deg,#633194,#9b59b6)' } : {}}
                    >
                        {f || 'All Reports'}
                    </button>
                ))}
            </div>

            {isLoading && (
                <div className="flex items-center justify-center h-40 gap-3">
                    <div className="w-8 h-8 rounded-full border-4 border-[#633194]/20 border-t-[#633194] animate-spin" />
                    <p className="text-sm text-gray-400">Loading reports…</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Reports List ──────────────────────────────────────────── */}
                <div className="lg:col-span-1 space-y-3">
                    {reports && reports.length > 0 ? reports.map(r => {
                        const cfg  = STATUS_CFG[r.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.Pending;
                        const rate = attendanceRate(r);
                        const isSelected = selectedReport?.id === r.id;
                        return (
                            <div
                                key={r.id}
                                onClick={() => handleSelectReport(r)}
                                className={clsx(
                                    'rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md relative overflow-hidden',
                                    isSelected
                                        ? 'border-[#633194]/40 shadow-md bg-[#F4F0FF]'
                                        : 'border-gray-100 bg-white hover:border-[#633194]/20'
                                )}
                            >
                                {/* Left accent bar */}
                                <div className={clsx('absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl', cfg.dot.replace('bg-', 'bg-'))} />

                                <div className="pl-2">
                                    <div className="flex items-start justify-between mb-2 gap-2">
                                        <p className="text-sm font-bold text-gray-800 leading-tight">
                                            {r.activity_name || `Activity #${r.activity_id}`}
                                        </p>
                                        <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0', cfg.bg, cfg.text, cfg.border)}>
                                            {r.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 flex items-center gap-1 mb-2">
                                        <CalendarDaysIcon className="h-3.5 w-3.5" />
                                        {new Date(r.report_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                            <div className="h-full rounded-full bg-gradient-to-r from-[#633194] to-[#9b59b6] transition-all" style={{ width: `${rate}%` }} />
                                        </div>
                                        <span className="text-[11px] font-bold text-gray-600">{rate}%</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        {r.present_count} present · {r.absent_count} absent · {r.total_students} total
                                    </p>
                                </div>
                            </div>
                        );
                    }) : !isLoading && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-10 flex flex-col items-center gap-3 text-center">
                            <div className="h-14 w-14 rounded-2xl bg-[#F4F0FF] flex items-center justify-center">
                                <ClipboardDocumentListIcon className="h-7 w-7 text-[#633194]" />
                            </div>
                            <p className="text-sm text-gray-500 font-medium">No reports found.</p>
                        </div>
                    )}
                </div>

                {/* ── Detail Panel ──────────────────────────────────────────── */}
                <div className="lg:col-span-2" ref={detailRef}>
                    {selectedReport ? (() => {
                        const cfg  = STATUS_CFG[selectedReport.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.Pending;
                        const rate = attendanceRate(selectedReport);
                        let details: any[] = [];
                        try { if (selectedReport.report_details) details = JSON.parse(selectedReport.report_details); } catch { /* empty */ }
                        return (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                {/* Gradient header */}
                                <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg,#633194,#9b59b6)' }}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h2 className="text-lg font-bold text-white">{selectedReport.activity_name}</h2>
                                            <p className="text-white/70 text-sm mt-0.5">
                                                {new Date(selectedReport.report_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <span className={clsx('text-xs font-bold px-3 py-1.5 rounded-full border flex-shrink-0', cfg.bg, cfg.text, cfg.border)}>
                                            {selectedReport.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 space-y-5">
                                    {/* Stats grid */}
                                    <div className="grid grid-cols-4 gap-3">
                                        {[
                                            { label: 'Present', val: selectedReport.present_count, bg: 'bg-emerald-50', text: 'text-emerald-600' },
                                            { label: 'Absent',  val: selectedReport.absent_count,  bg: 'bg-red-50',     text: 'text-red-500'   },
                                            { label: 'Late',    val: selectedReport.late_count,    bg: 'bg-amber-50',   text: 'text-amber-600' },
                                            { label: 'Excused', val: selectedReport.excused_count, bg: 'bg-[#F4F0FF]',  text: 'text-[#633194]' },
                                        ].map(s => (
                                            <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
                                                <p className={`text-2xl font-extrabold ${s.text}`}>{s.val}</p>
                                                <p className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Attendance rate bar */}
                                    <div>
                                        <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1.5">
                                            <span>Attendance Rate</span>
                                            <span className="font-bold text-[#633194]">{rate}%</span>
                                        </div>
                                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all" style={{ width: `${rate}%`, background: 'linear-gradient(90deg,#633194,#9b59b6)' }} />
                                        </div>
                                    </div>

                                    {/* Coach Notes */}
                                    {selectedReport.notes && (
                                        <div className="bg-[#F4F0FF] border border-purple-200 rounded-xl p-4">
                                            <p className="text-xs font-bold text-[#633194] uppercase tracking-wider mb-1">Coach Notes</p>
                                            <p className="text-sm text-gray-700 italic">"{selectedReport.notes}"</p>
                                        </div>
                                    )}

                                    {/* Submission info */}
                                    <p className="text-xs text-gray-400">
                                        Submitted {new Date(selectedReport.submitted_at).toLocaleString()} · Coach ID #{selectedReport.coach_id}
                                    </p>

                                    {/* Approve / Reject actions */}
                                    {selectedReport.status === 'Pending' && user?.role === 'Admin' && (
                                        <div className="flex gap-3 pt-4 border-t border-gray-100">
                                            <button
                                                onClick={handleOpenApproveModal}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
                                                style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
                                            >
                                                <CheckCircleIcon className="h-4 w-4" /> Approve & Notify Teachers
                                            </button>
                                            <button
                                                onClick={() => reviewMutation.mutate({ id: selectedReport.id, status: 'Rejected' })}
                                                disabled={reviewMutation.isPending}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                                                style={{ background: 'linear-gradient(135deg,#e11d48,#be123c)' }}
                                            >
                                                <XCircleIcon className="h-4 w-4" /> Reject Report
                                            </button>
                                        </div>
                                    )}

                                    {/* Student Attendance Table */}
                                    {details.length > 0 && (
                                        <div className="pt-4 border-t border-gray-100">
                                            <h3 className="text-sm font-bold text-gray-800 mb-3">Student Attendance Details</h3>
                                            <div className="max-h-[320px] overflow-y-auto rounded-xl border border-gray-100">
                                                <table className="min-w-full text-sm">
                                                    <thead className="bg-[#F4F0FF] sticky top-0">
                                                        <tr>
                                                            <th className="py-2.5 px-4 text-left text-xs font-bold text-[#633194] uppercase tracking-wider">Student</th>
                                                            <th className="py-2.5 px-4 text-left text-xs font-bold text-[#633194] uppercase tracking-wider">Grade & Teacher</th>
                                                            <th className="py-2.5 px-4 text-left text-xs font-bold text-[#633194] uppercase tracking-wider">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {details.map((d: any, i: number) => (
                                                            <tr key={i} className="hover:bg-[#F4F0FF]/30 transition-colors">
                                                                <td className="py-2.5 px-4 font-medium text-gray-800">
                                                                    {d.student_name || `ID: ${d.student_id}`}
                                                                </td>
                                                                <td className="py-2.5 px-4">
                                                                    <p className="text-gray-700">{d.grade || '—'}</p>
                                                                    <p className="text-xs text-gray-400">{d.class_teacher_name || '—'}</p>
                                                                </td>
                                                                <td className="py-2.5 px-4">
                                                                    <span className={clsx(
                                                                        'px-2.5 py-1 rounded-full text-xs font-bold border',
                                                                        d.status === 'Present' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                                                        d.status === 'Absent'  && 'bg-red-50 text-red-600 border-red-200',
                                                                        d.status === 'Late'    && 'bg-amber-50 text-amber-700 border-amber-200',
                                                                        d.status === 'Excused' && 'bg-[#F4F0FF] text-[#633194] border-purple-200',
                                                                    )}>
                                                                        {d.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })() : (
                        <div className="bg-white rounded-2xl border border-gray-100 p-16 flex flex-col items-center gap-4 text-center">
                            <div className="h-16 w-16 rounded-2xl bg-[#F4F0FF] flex items-center justify-center">
                                <ClipboardDocumentListIcon className="h-8 w-8 text-[#633194]" />
                            </div>
                            <div>
                                <p className="text-gray-700 font-semibold">Select a report to review</p>
                                <p className="text-xs text-gray-400 mt-1">Click any report card on the left to view details.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Approve & Notify Modal ────────────────────────────────────── */}
            {approveModal && selectedReport && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
                        {/* Header */}
                        <div className="px-6 py-4 flex items-center justify-between"
                             style={{ background: 'linear-gradient(135deg,#633194,#9b59b6)' }}>
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <CheckCircleIcon className="h-5 w-5" /> Confirm Approval & Notify
                            </h3>
                            <button onClick={() => setApproveModal(false)} className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600">
                                The following teachers will be automatically notified based on the grades of students in this report:
                            </p>

                            {/* Teacher table */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-[#F4F0FF] text-[#633194] sticky top-0">
                                        <tr>
                                            <th className="py-2.5 px-4 text-left text-xs font-bold uppercase tracking-wider">Grade</th>
                                            <th className="py-2.5 px-4 text-left text-xs font-bold uppercase tracking-wider">Teacher Name</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {teachersToNotify.map(t => (
                                            <tr key={t.id} className="hover:bg-gray-50">
                                                <td className="py-2.5 px-4 font-semibold text-gray-700">{t.grade}</td>
                                                <td className="py-2.5 px-4">
                                                    <input
                                                        type="text"
                                                        value={t.teacher}
                                                        onChange={e => setTeachersToNotify(prev =>
                                                            prev.map(x => x.id === t.id ? { ...x, teacher: e.target.value } : x)
                                                        )}
                                                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#633194] focus:ring-2 focus:ring-[#633194]/15 transition-all bg-transparent hover:bg-white focus:bg-white"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Message preview */}
                            <div className="bg-[#F4F0FF] border border-purple-200 rounded-xl p-4 text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                                <p className="font-bold text-[#633194] mb-1">Message Preview:</p>
                                Please update class attendance for Grade [Grade] ([Teacher]).{'\n'}
                                Activity: {selectedReport.activity_name}{'\n'}
                                Date: {new Date(selectedReport.report_date).toLocaleDateString()}{'\n\n'}
                                Present Students:{'\n'}• [Student Name]…
                            </div>

                            <div className="flex gap-3 pt-2 border-t border-gray-100">
                                <button onClick={() => setApproveModal(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmApprove}
                                    disabled={reviewMutation.isPending}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    style={{ background: 'linear-gradient(135deg,#633194,#9b59b6)' }}
                                >
                                    <BellAlertIcon className="h-4 w-4" />
                                    {reviewMutation.isPending ? 'Processing…' : 'Approve & Notify'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
