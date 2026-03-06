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

const statusBadge = (status: string) => {
    if (status === 'Pending') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status === 'Approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-red-50 text-[#e11d48] border-red-200';
};

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[#1a3b70]">Daily Attendance Report</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Generate and submit today's attendance report to the Principal.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Card */}
                <div className="bg-white rounded-lg border border-gray-100 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] p-6">
                    <h2 className="text-base font-bold text-[#1a3b70] mb-4 flex items-center gap-2">
                        <DocumentTextIcon className="h-5 w-5" /> Generate Report
                    </h2>

                    <form onSubmit={handleGenerate} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                                Activity / Sport
                            </label>
                            <select
                                required
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1a3b70] transition-colors"
                                value={selectedActivityId}
                                onChange={e => {
                                    setSelectedActivityId(e.target.value ? parseInt(e.target.value) : '');
                                    setSubmitted(false);
                                }}
                            >
                                <option value="">-- Select Activity --</option>
                                {activities?.map(a => (
                                    <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                                Report Date
                            </label>
                            <input
                                type="date"
                                required
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1a3b70] transition-colors"
                                value={reportDate}
                                onChange={e => { setReportDate(e.target.value); setSubmitted(false); }}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                                Coach Notes <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <textarea
                                rows={3}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1a3b70] transition-colors resize-none"
                                placeholder="e.g. Heavy rain affected session, 3 students had medical excuse..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={generateMutation.isPending || !selectedActivityId}
                            className={clsx(
                                'w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all shadow-sm',
                                submitted
                                    ? 'bg-[#10b981] text-white'
                                    : 'bg-[#1a3b70] text-white hover:bg-[#11274a] disabled:opacity-50'
                            )}
                        >
                            {generateMutation.isPending ? (
                                <>Submitting…</>
                            ) : submitted ? (
                                <><CheckCircleIcon className="h-5 w-5" /> Report Submitted!</>
                            ) : (
                                <><PaperAirplaneIcon className="h-5 w-5" /> Generate & Submit to Principal</>
                            )}
                        </button>
                        <p className="text-xs text-gray-400 text-center">
                            Attendance stats are pulled automatically from today's marked sessions.
                        </p>
                    </form>
                </div>

                {/* History Card */}
                <div className="bg-white rounded-lg border border-gray-100 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] p-6">
                    <h2 className="text-base font-bold text-[#1a3b70] mb-4 flex items-center gap-2">
                        <ClockIcon className="h-5 w-5" /> My Submitted Reports
                    </h2>

                    {myReports && myReports.length > 0 ? (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                            {myReports.map(report => (
                                <div
                                    key={report.id}
                                    onClick={() => setSelectedReport(report as any)}
                                    className="rounded-lg border border-gray-100 p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer bg-white"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {(report as any).activity_name || `Activity #${report.activity_id}`}
                                            </p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <CalendarDaysIcon className="h-3.5 w-3.5" />
                                                {new Date(report.report_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <span className={clsx('text-xs font-bold px-2.5 py-1 rounded-full border', statusBadge(report.status))}>
                                            {report.status}
                                        </span>
                                    </div>
                                    <div className="text-xs text-blue-600 font-medium mt-2 flex items-center gap-1">
                                        View Details &rarr;
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
                            <DocumentTextIcon className="h-12 w-12 text-gray-200" />
                            <p className="text-gray-400 text-sm">No reports submitted yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Report Details Modal */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 bg-[#f8fafc] flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-[#1a3b70]">
                                    {selectedReport.activity_name || `Activity #${selectedReport.activity_id}`}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {new Date(selectedReport.report_date).toLocaleDateString()}
                                </p>
                            </div>
                            <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
                                &times;
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-4 gap-4 text-center mb-6">
                                <div className="bg-emerald-50 rounded-lg p-3">
                                    <p className="text-2xl font-bold text-[#10b981]">{selectedReport.present_count}</p>
                                    <p className="text-xs font-medium text-gray-600 uppercase">Present</p>
                                </div>
                                <div className="bg-red-50 rounded-lg p-3">
                                    <p className="text-2xl font-bold text-[#e11d48]">{selectedReport.absent_count}</p>
                                    <p className="text-xs font-medium text-gray-600 uppercase">Absent</p>
                                </div>
                                <div className="bg-amber-50 rounded-lg p-3">
                                    <p className="text-2xl font-bold text-amber-600">{selectedReport.late_count}</p>
                                    <p className="text-xs font-medium text-gray-600 uppercase">Late</p>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-3">
                                    <p className="text-2xl font-bold text-[#7e22ce]">{selectedReport.excused_count}</p>
                                    <p className="text-xs font-medium text-gray-600 uppercase">Excused</p>
                                </div>
                            </div>

                            {selectedReport.notes && (
                                <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-100">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-1">Coach Notes</h3>
                                    <p className="text-sm text-gray-800">{selectedReport.notes}</p>
                                </div>
                            )}

                            <div>
                                <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2">Student Attendance Details</h3>
                                {selectedReport.report_details ? (
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-500">
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
