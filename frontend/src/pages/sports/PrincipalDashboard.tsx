import { useState } from 'react';
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

const statusBadge = (status: string) => {
    if (status === 'Pending') return { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending' };
    if (status === 'Approved') return { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Approved' };
    return { cls: 'bg-red-50 text-[#e11d48] border-red-200', label: 'Rejected' };
};

// Mock teacher list — in production this comes from the shared users table
const MOCK_TEACHERS = [
    { id: 10, name: 'Mr. Perera (Grade 10)' },
    { id: 11, name: 'Ms. Silva (Grade 11)' },
    { id: 12, name: 'Mr. Fernando (Grade 9)' },
];

export default function PrincipalDashboard() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const [statusFilter, setStatusFilter] = useState<string>('');
    const [selectedReport, setSelectedReport] = useState<AttendanceReport | null>(null);
    const [approveModal, setApproveModal] = useState(false);
    const [teachersToNotify, setTeachersToNotify] = useState<{ id: string, grade: string, teacher: string }[]>([]);

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
                const next = { ...selectedReport, status: (selectedReport.status === 'Pending' ? 'Approved' : selectedReport.status) as 'Pending' | 'Approved' | 'Rejected' };
                setSelectedReport(next);
            }
        },
        onError: (err: any) => alert(err.response?.data?.error || err.message),
    });

    const handleOpenApproveModal = () => {
        let extractedTeachers: { id: string; grade: string; teacher: string; students: any[] }[] = [];
        if (selectedReport?.report_details) {
            try {
                const details = JSON.parse(selectedReport.report_details);
                const combos = new Map();
                details.forEach((d: any) => {
                    const grade = d.grade || 'Unknown';
                    const teacher = d.class_teacher_name || 'Unknown';
                    const key = `${grade}-${teacher}`;
                    if (!combos.has(key)) {
                        combos.set(key, { id: Math.random().toString(), grade, teacher, students: [] });
                    }
                    combos.get(key).students.push(d);
                });
                extractedTeachers = Array.from(combos.values());
            } catch (e) {
                console.error("Failed parsing report details", e);
            }
        }
        if (extractedTeachers.length === 0) {
            extractedTeachers = [{ id: Math.random().toString(), grade: 'All', teacher: 'Unknown Teacher', students: [] }];
        }
        setTeachersToNotify(extractedTeachers as any);
        setApproveModal(true);
    };

    const handleConfirmApprove = async () => {
        if (!selectedReport) return;
        try {
            await reviewMutation.mutateAsync({ id: selectedReport.id, status: 'Approved' });

            const dateStr = new Date(selectedReport.report_date).toLocaleDateString('en-US');
            for (const t of teachersToNotify as any[]) {
                const presentStudents = t.students?.filter((s: any) => s.status === 'Present') || [];
                const studentListStr = presentStudents.length > 0
                    ? presentStudents.map((s: any) => `• ${s.student_name || `ID: ${s.student_id}`}`).join('\n')
                    : 'No attendance records';

                const message = `Please update class attendance for Grade ${t.grade} (${t.teacher}).\nActivity: ${selectedReport.activity_name}\nDate: ${dateStr}\n\nPresent Students:\n${studentListStr}`;
                await reportService.notifyTeacher(selectedReport.id, 1, message); // arbitrary teacher_id
            }

            alert('Report approved and automatic notifications generated!');
        } catch (e: any) {
            console.error(e);
            alert('An error occurred during approval process.');
        } finally {
            setApproveModal(false);
        }
    };

    const handleTeacherChange = (id: string, newTeacherName: string) => {
        setTeachersToNotify(prev => prev.map(t => t.id === id ? { ...t, teacher: newTeacherName } : t));
    };

    const attendanceRate = (r: AttendanceReport) =>
        r.total_students > 0 ? Math.round(((r.present_count + r.late_count) / r.total_students) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#1a3b70]">Principal Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Review coach attendance reports and notify teachers.</p>
                </div>
                <div className="flex items-center gap-2">
                    {(['', 'Pending', 'Approved', 'Rejected'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setStatusFilter(f)}
                            className={clsx(
                                'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                                statusFilter === f
                                    ? 'bg-[#1a3b70] text-white border-[#1a3b70]'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#1a3b70] hover:text-[#1a3b70]'
                            )}
                        >
                            {f || 'All'}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading && (
                <div className="text-center py-12 text-gray-400">Loading reports…</div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Reports List */}
                <div className="lg:col-span-1 space-y-3">
                    {reports && reports.length > 0 ? reports.map(r => {
                        const badge = statusBadge(r.status);
                        const rate = attendanceRate(r);
                        return (
                            <div
                                key={r.id}
                                onClick={() => setSelectedReport(r)}
                                className={clsx(
                                    'rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md',
                                    selectedReport?.id === r.id
                                        ? 'border-[#1a3b70] shadow-md bg-blue-50'
                                        : 'border-gray-100 bg-white hover:border-gray-200'
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-sm font-semibold text-gray-900 leading-tight">{r.activity_name || `Activity #${r.activity_id}`}</p>
                                    <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full border ml-2 shrink-0', badge.cls)}>{badge.label}</span>
                                </div>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <CalendarDaysIcon className="h-3.5 w-3.5" />
                                    {new Date(r.report_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                        <div
                                            className="h-1.5 rounded-full bg-[#10b981] transition-all"
                                            style={{ width: `${rate}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-gray-600">{rate}%</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    {r.present_count} present · {r.absent_count} absent · {r.total_students} total
                                </p>
                            </div>
                        );
                    }) : (
                        <div className="bg-white rounded-lg border border-gray-100 p-10 text-center">
                            <ClipboardDocumentListIcon className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 text-sm">No reports found.</p>
                        </div>
                    )}
                </div>

                {/* Detail Panel */}
                <div className="lg:col-span-2">
                    {selectedReport ? (
                        <div className="bg-white rounded-lg border border-gray-100 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] p-6 space-y-5">
                            {/* Title row */}
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-[#1a3b70]">{selectedReport.activity_name}</h2>
                                    <p className="text-sm text-gray-500">
                                        Report for {new Date(selectedReport.report_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                                <span className={clsx('text-sm font-bold px-3 py-1 rounded-full border', statusBadge(selectedReport.status).cls)}>
                                    {selectedReport.status}
                                </span>
                            </div>

                            {/* Stats grid */}
                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { label: 'Present', val: selectedReport.present_count, color: 'text-[#10b981]', bg: 'bg-emerald-50' },
                                    { label: 'Absent', val: selectedReport.absent_count, color: 'text-[#e11d48]', bg: 'bg-red-50' },
                                    { label: 'Late', val: selectedReport.late_count, color: 'text-amber-600', bg: 'bg-amber-50' },
                                    { label: 'Excused', val: selectedReport.excused_count, color: 'text-[#7e22ce]', bg: 'bg-purple-50' },
                                ].map(s => (
                                    <div key={s.label} className={clsx('rounded-lg p-4 text-center', s.bg)}>
                                        <p className={clsx('text-3xl font-bold', s.color)}>{s.val}</p>
                                        <p className="text-xs text-gray-500 font-medium mt-1">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Attendance rate */}
                            <div>
                                <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                                    <span>Attendance Rate</span>
                                    <span className="font-bold text-[#10b981]">{attendanceRate(selectedReport)}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full bg-[#10b981] transition-all"
                                        style={{ width: `${attendanceRate(selectedReport)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedReport.notes && (
                                <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Coach Notes</p>
                                    <p className="text-sm text-gray-700 italic">"{selectedReport.notes}"</p>
                                </div>
                            )}

                            {/* Submission info */}
                            <p className="text-xs text-gray-400">
                                Submitted {new Date(selectedReport.submitted_at).toLocaleString()} · Coach ID #{selectedReport.coach_id}
                            </p>

                            {/* Action Buttons */}
                            {selectedReport.status === 'Pending' && user?.role === 'Admin' && (
                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={handleOpenApproveModal}
                                        className="flex-1 flex items-center justify-center gap-2 bg-[#10b981] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-emerald-600 transition-colors"
                                    >
                                        <CheckCircleIcon className="h-4 w-4" /> Approve & Notify Teachers
                                    </button>
                                    <button
                                        onClick={() => reviewMutation.mutate({ id: selectedReport.id, status: 'Rejected' })}
                                        disabled={reviewMutation.isPending}
                                        className="flex-1 flex items-center justify-center gap-2 bg-[#e11d48] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                                    >
                                        <XCircleIcon className="h-4 w-4" /> Reject Report
                                    </button>
                                </div>
                            )}

                            {/* Detailed Table */}
                            <div className="pt-4 border-t border-gray-100">
                                <h3 className="text-sm font-bold text-gray-800 mb-3">Student Attendance Details</h3>
                                {selectedReport.report_details ? (
                                    <div className="max-h-[300px] overflow-y-auto">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-gray-50 text-gray-500 sticky top-0">
                                                <tr>
                                                    <th className="py-2 px-3 text-left font-medium">Student Name</th>
                                                    <th className="py-2 px-3 text-left font-medium">Grade & Teacher</th>
                                                    <th className="py-2 px-3 text-left font-medium">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {JSON.parse(selectedReport.report_details).map((detail: any, i: number) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        <td className="py-2 px-3 font-medium text-gray-900">
                                                            {detail.student_name || `ID: ${detail.student_id}`}
                                                        </td>
                                                        <td className="py-2 px-3 text-gray-500">
                                                            {detail.grade || '-'} <br />
                                                            <span className="text-xs">{detail.class_teacher_name || '-'}</span>
                                                        </td>
                                                        <td className="py-2 px-3">
                                                            <span className={clsx(
                                                                'px-2 py-1 rounded text-xs font-bold',
                                                                detail.status === 'Present' && 'bg-emerald-100 text-emerald-800',
                                                                detail.status === 'Absent' && 'bg-red-100 text-red-800',
                                                                detail.status === 'Late' && 'bg-amber-100 text-amber-800',
                                                                detail.status === 'Excused' && 'bg-purple-100 text-purple-800'
                                                            )}>
                                                                {detail.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No detailed records available.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg border border-gray-100 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] p-16 flex flex-col items-center gap-3 text-center">
                            <ClipboardDocumentListIcon className="h-16 w-16 text-gray-200" />
                            <p className="text-gray-400 font-medium">Select a report to review it.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Approve Confirmation Modal */}
            {approveModal && selectedReport && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-[#f8fafc] flex justify-between items-center">
                            <h3 className="text-lg font-bold text-[#1a3b70] flex items-center gap-2">
                                <CheckCircleIcon className="h-5 w-5" /> Confirm Approval & Notify
                            </h3>
                            <button onClick={() => setApproveModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
                                &times;
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600">
                                The following teachers will be automatically notified about this attendance report based on the grades of attendees:
                            </p>

                            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase text-left">
                                        <tr>
                                            <th className="py-2 px-3 font-semibold">Grade</th>
                                            <th className="py-2 px-3 font-semibold">Teacher Name</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {teachersToNotify.map((t) => (
                                            <tr key={t.id} className="bg-white hover:bg-gray-50">
                                                <td className="py-2 px-3 font-medium text-gray-800">{t.grade}</td>
                                                <td className="py-2 px-3">
                                                    <input
                                                        type="text"
                                                        value={t.teacher}
                                                        onChange={(e) => handleTeacherChange(t.id, e.target.value)}
                                                        className="w-full border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#1a3b70] text-sm bg-transparent border hover:bg-white focus:bg-white transition-colors"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-gray-50 text-xs text-gray-500 p-3 rounded-md whitespace-pre-line">
                                <strong>Message to be sent:</strong> <br />
                                Please update class attendance for Grade [Grade] ([Teacher]).
                                Activity: {selectedReport.activity_name}
                                Date: {new Date(selectedReport.report_date).toLocaleDateString()}

                                Present Students:
                                • [Student Name]
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setApproveModal(false)}
                                    className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmApprove}
                                    disabled={reviewMutation.isPending}
                                    className="flex-1 py-2.5 rounded-lg bg-[#1a3b70] text-white text-sm font-bold hover:bg-[#11274a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
