import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityService, reportService } from '../../services/api';
import { useAuth } from '../../utils/auth';
import clsx from 'clsx';
import DocumentTextIcon from '@heroicons/react/24/outline/DocumentTextIcon';
import PaperAirplaneIcon from '@heroicons/react/24/outline/PaperAirplaneIcon';
import CalendarDaysIcon from '@heroicons/react/24/outline/CalendarDaysIcon';
import CheckCircleIcon from '@heroicons/react/24/solid/CheckCircleIcon';
import ClockIcon from '@heroicons/react/24/solid/ClockIcon';
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon';
import ChevronDownIcon from '@heroicons/react/24/outline/ChevronDownIcon';
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon';

const statusBadge = (status: string) => {
    if (status === 'Pending') return { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' };
    if (status === 'Approved') return { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' };
    return { cls: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-400' };
};

const inputCls = "w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#633194] focus:ring-2 focus:ring-[#633194]/15 transition-all bg-gray-50 focus:bg-white";

export default function AttendanceReportPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const today = new Date().toISOString().split('T')[0];

    const [selectedActivityId, setSelectedActivityId] = useState<number | ''>('');
    const [reportDate, setReportDate] = useState(today);
    const [notes, setNotes] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [selectedReport, setSelectedReport] = useState<any | null>(null);

    const { data: activities } = useQuery({
        queryKey: ['activities'],
        queryFn: activityService.getAll,
    });

    const { data: myReports } = useQuery({
        queryKey: ['myReports', user?.id],
        queryFn: () => reportService.getAll({ coach_id: user?.id }),
    });

    const generateMutation = useMutation({
        mutationFn: () => reportService.generate({
            activity_id: selectedActivityId as number,
            report_date: reportDate,
            notes: notes || undefined,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myReports'] });
            setSubmitted(true);
            setNotes('');
        },
        onError: (err: any) => {
            alert('Failed to submit report: ' + (err.response?.data?.error || err.message));
        },
    });

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedActivityId) { alert('Please select an activity'); return; }
        generateMutation.mutate();
    };

    const pendingCount = myReports?.filter(r => r.status === 'Pending').length ?? 0;
    const approvedCount = myReports?.filter(r => r.status === 'Approved').length ?? 0;
    const rejectedCount = myReports?.filter(r => r.status === 'Rejected').length ?? 0;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Daily Attendance Report</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Generate and submit today's attendance report to the Principal.</p>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-2">
                    {[
                        { label: 'Pending', count: pendingCount, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
                        { label: 'Approved', count: approvedCount, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                        { label: 'Rejected', count: rejectedCount, cls: 'bg-red-50 text-red-600 border-red-200' },
                    ].map(s => (
                        <div key={s.label} className={clsx('px-3 py-1.5 rounded-xl border text-xs font-semibold', s.cls)}>
                            {s.count} {s.label}
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* === Generate Report Form === */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Card header stripe */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #633194 0%, #9b59b6 100%)' }}>
                        <DocumentTextIcon className="h-5 w-5 text-white" />
                        <h2 className="text-base font-bold text-white">Generate Report</h2>
                    </div>

                    <form onSubmit={handleGenerate} className="p-6 space-y-5">
                        {/* Activity Select */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                Activity / Sport
                            </label>
                            <div className="relative">
                                <select
                                    required
                                    className={inputCls + ' appearance-none'}
                                    value={selectedActivityId}
                                    onChange={e => {
                                        setSelectedActivityId(e.target.value ? parseInt(e.target.value) : '');
                                        setSubmitted(false);
                                    }}
                                >
                                    <option value="">— Select Activity —</option>
                                    {activities?.map(a => (
                                        <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                                    ))}
                                </select>
                                <ChevronDownIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Report Date */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                Report Date
                            </label>
                            <div className="relative">
                                <CalendarDaysIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                <input
                                    type="date"
                                    required
                                    className={inputCls + ' pl-10'}
                                    value={reportDate}
                                    onChange={e => { setReportDate(e.target.value); setSubmitted(false); }}
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                Coach Notes <span className="text-gray-400 font-normal normal-case">(optional)</span>
                            </label>
                            <textarea
                                rows={3}
                                className={inputCls + ' resize-none'}
                                placeholder="e.g. Heavy rain affected session, 3 students had medical excuse…"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>

                        {/* Info note */}
                        <div className="flex items-start gap-2 bg-[#F4F0FF] border border-purple-200 rounded-xl p-3">
                            <svg className="h-4 w-4 text-[#633194] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <p className="text-xs text-[#633194]">
                                Attendance stats are pulled automatically from today's marked sessions.
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={generateMutation.isPending || !selectedActivityId}
                            className={clsx(
                                'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-50',
                                submitted
                                    ? 'bg-emerald-500 text-white'
                                    : 'text-white hover:shadow-lg hover:-translate-y-0.5'
                            )}
                            style={submitted ? {} : { background: 'linear-gradient(135deg, #633194 0%, #9b59b6 100%)' }}
                        >
                            {generateMutation.isPending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Submitting…
                                </>
                            ) : submitted ? (
                                <><CheckCircleIcon className="h-5 w-5" /> Report Submitted!</>
                            ) : (
                                <><PaperAirplaneIcon className="h-5 w-5" /> Generate &amp; Submit to Principal</>
                            )}
                        </button>
                    </form>
                </div>

                {/* === My Reports History === */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Card header stripe */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
                        <ClockIcon className="h-5 w-5 text-[#633194]" />
                        <h2 className="text-base font-bold text-gray-800">My Submitted Reports</h2>
                        {myReports && myReports.length > 0 && (
                            <span className="ml-auto text-xs font-bold bg-[#F4F0FF] text-[#633194] px-2.5 py-1 rounded-full">
                                {myReports.length}
                            </span>
                        )}
                    </div>

                    <div className="p-4">
                        {myReports && myReports.length > 0 ? (
                            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                                {myReports.map(report => {
                                    const badge = statusBadge(report.status);
                                    return (
                                        <div
                                            key={report.id}
                                            onClick={() => setSelectedReport(report as any)}
                                            className="rounded-xl border border-gray-100 p-4 hover:border-[#633194]/30 hover:shadow-sm hover:bg-[#F4F0FF]/30 transition-all cursor-pointer group"
                                        >
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-800 truncate">
                                                        {(report as any).activity_name || `Activity #${report.activity_id}`}
                                                    </p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <CalendarDaysIcon className="h-3.5 w-3.5" />
                                                        {new Date(report.report_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </p>
                                                </div>
                                                <div className={clsx('flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold flex-shrink-0', badge.cls)}>
                                                    <span className={clsx('h-1.5 w-1.5 rounded-full', badge.dot)} />
                                                    {report.status}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs font-semibold text-[#633194] mt-3 group-hover:gap-2 transition-all">
                                                View Details <ArrowRightIcon className="h-3 w-3" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-52 gap-3 text-center">
                                <div className="h-16 w-16 rounded-2xl bg-[#F4F0FF] flex items-center justify-center">
                                    <DocumentTextIcon className="h-8 w-8 text-[#633194]" />
                                </div>
                                <p className="text-gray-600 font-semibold">No reports submitted yet.</p>
                                <p className="text-xs text-gray-400">Use the form on the left to submit your first report.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* === Report Details Modal === */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
                        {/* Modal header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4" style={{ background: 'linear-gradient(135deg, #633194 0%, #9b59b6 100%)' }}>
                            <div>
                                <h2 className="text-base font-bold text-white">
                                    {selectedReport.activity_name || `Activity #${selectedReport.activity_id}`}
                                </h2>
                                <p className="text-sm text-white/70 mt-0.5 flex items-center gap-1">
                                    <CalendarDaysIcon className="h-3.5 w-3.5" />
                                    {new Date(selectedReport.report_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <span className={clsx('px-2.5 py-1 rounded-full text-xs font-bold border', statusBadge(selectedReport.status).cls)}>
                                    {selectedReport.status}
                                </span>
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { label: 'Present', value: selectedReport.present_count, bg: 'bg-emerald-50', color: 'text-emerald-600' },
                                    { label: 'Absent', value: selectedReport.absent_count, bg: 'bg-red-50', color: 'text-red-500' },
                                    { label: 'Late', value: selectedReport.late_count, bg: 'bg-amber-50', color: 'text-amber-600' },
                                    { label: 'Excused', value: selectedReport.excused_count, bg: 'bg-[#F4F0FF]', color: 'text-[#633194]' },
                                ].map(s => (
                                    <div key={s.label} className={clsx('rounded-2xl p-4 text-center', s.bg)}>
                                        <p className={clsx('text-3xl font-bold', s.color)}>{s.value}</p>
                                        <p className="text-xs font-semibold text-gray-500 uppercase mt-1">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Attendance Rate Bar */}
                            {selectedReport.total_students > 0 && (
                                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-semibold text-gray-700">Attendance Rate</span>
                                        <span className="text-sm font-bold text-[#633194]">
                                            {Math.round(((selectedReport.present_count + selectedReport.late_count) / selectedReport.total_students) * 100)}%
                                        </span>
                                    </div>
                                    <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${Math.round(((selectedReport.present_count + selectedReport.late_count) / selectedReport.total_students) * 100)}%`,
                                                background: 'linear-gradient(90deg, #633194, #9b59b6)',
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Coach Notes */}
                            {selectedReport.notes && (
                                <div className="p-4 rounded-2xl bg-[#F4F0FF] border border-purple-200">
                                    <h3 className="text-xs font-bold text-[#633194] uppercase tracking-wider mb-1.5">Coach Notes</h3>
                                    <p className="text-sm text-gray-700 italic">"{selectedReport.notes}"</p>
                                </div>
                            )}

                            {/* Student Details Table */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">Student Attendance Details</h3>
                                {selectedReport.report_details ? (
                                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-gray-50 text-gray-500">
                                                <tr>
                                                    <th className="py-2.5 px-4 text-left text-xs font-bold uppercase tracking-wider">Student</th>
                                                    <th className="py-2.5 px-4 text-left text-xs font-bold uppercase tracking-wider">Grade &amp; Teacher</th>
                                                    <th className="py-2.5 px-4 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {JSON.parse(selectedReport.report_details).map((detail: any, i: number) => (
                                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                        <td className="py-2.5 px-4 font-medium text-gray-800">
                                                            {detail.student_name || `ID: ${detail.student_id}`}
                                                        </td>
                                                        <td className="py-2.5 px-4 text-gray-500">
                                                            {detail.grade || '—'}<br />
                                                            <span className="text-xs">{detail.class_teacher_name || '—'}</span>
                                                        </td>
                                                        <td className="py-2.5 px-4">
                                                            <span className={clsx(
                                                                'px-2.5 py-1 rounded-full text-xs font-bold border',
                                                                detail.status === 'Present' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                                                detail.status === 'Absent' && 'bg-red-50 text-red-600 border-red-200',
                                                                detail.status === 'Late' && 'bg-amber-50 text-amber-700 border-amber-200',
                                                                detail.status === 'Excused' && 'bg-[#F4F0FF] text-[#633194] border-purple-200'
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
                                    <p className="text-sm text-gray-500 italic">No detailed records available for this report.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
