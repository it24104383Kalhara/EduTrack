import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportService } from '../../services/api';
import clsx from 'clsx';
import BellIcon from '@heroicons/react/24/solid/BellIcon';
import CheckCircleIcon from '@heroicons/react/24/solid/CheckCircleIcon';
import InboxIcon from '@heroicons/react/24/outline/InboxIcon';
import CalendarDaysIcon from '@heroicons/react/24/outline/CalendarDaysIcon';

export default function TeacherNotificationsPage() {
    const queryClient = useQueryClient();

    const { data: notifications, isLoading } = useQuery({
        queryKey: ['myNotifications'],
        queryFn: reportService.getMyNotifications,
        refetchInterval: 30_000, // Poll every 30s for new notifications
    });

    const actionMutation = useMutation({
        mutationFn: (id: number) => reportService.actionNotification(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myNotifications'] }),
    });

    const unread = notifications?.filter(n => n.status !== 'Actioned').length ?? 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="relative">
                    <BellIcon className="h-8 w-8 text-[#1a3b70]" />
                    {unread > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#e11d48] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {unread}
                        </span>
                    )}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-[#1a3b70]">Attendance Notifications</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Notifications from the Principal to update student class attendance.
                    </p>
                </div>
            </div>

            {isLoading && <div className="text-center text-gray-400 py-12">Loading notifications…</div>}

            {notifications && notifications.length > 0 ? (
                <div className="space-y-4">
                    {notifications.map(notif => {
                        const isActioned = notif.status === 'Actioned';
                        return (
                            <div
                                key={notif.id}
                                className={clsx(
                                    'rounded-lg border p-5 transition-all',
                                    isActioned
                                        ? 'bg-gray-50 border-gray-100 opacity-60'
                                        : 'bg-white border-[#1a3b70]/20 shadow-[0_4px_6px_-1px_rgba(26,59,112,0.08)]'
                                )}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    {/* Left */}
                                    <div className="flex-1">
                                        {/* Status dot */}
                                        <div className="flex items-center gap-2 mb-2">
                                            {isActioned ? (
                                                <CheckCircleIcon className="h-4 w-4 text-[#10b981]" />
                                            ) : (
                                                <span className="h-2.5 w-2.5 rounded-full bg-[#e11d48] animate-pulse" />
                                            )}
                                            <span className={clsx('text-xs font-bold uppercase tracking-wider', isActioned ? 'text-gray-400' : 'text-[#e11d48]')}>
                                                {isActioned ? 'Actioned' : 'Requires Action'}
                                            </span>
                                        </div>

                                        {/* Activity + Date */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm font-bold text-[#1a3b70]">{notif.activity_name || `Report #${notif.report_id}`}</span>
                                            {notif.report_date && (
                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                    <CalendarDaysIcon className="h-3.5 w-3.5" />
                                                    {new Date(notif.report_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </span>
                                            )}
                                        </div>

                                        {/* Message */}
                                        <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-md p-3 border border-gray-100">
                                            {notif.message}
                                        </p>

                                        {/* Quick stats from the report */}
                                        {notif.total_students && (
                                            <div className="flex gap-3 mt-3 text-xs">
                                                <span className="text-[#10b981] font-semibold">{notif.present_count} present</span>
                                                <span className="text-gray-300">·</span>
                                                <span className="text-[#e11d48] font-semibold">{notif.absent_count} absent</span>
                                                <span className="text-gray-300">·</span>
                                                <span className="text-gray-500">{notif.total_students} total students</span>
                                            </div>
                                        )}

                                        <p className="text-xs text-gray-400 mt-2">
                                            Sent by Principal · {new Date(notif.sent_at).toLocaleString()}
                                        </p>
                                    </div>

                                    {/* Action button */}
                                    {!isActioned && (
                                        <button
                                            onClick={() => actionMutation.mutate(notif.id)}
                                            disabled={actionMutation.isPending}
                                            className="shrink-0 flex items-center gap-1.5 bg-[#10b981] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-sm"
                                        >
                                            <CheckCircleIcon className="h-4 w-4" />
                                            Mark as Actioned
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : !isLoading ? (
                <div className="bg-white rounded-lg border border-gray-100 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] p-16 flex flex-col items-center gap-3 text-center">
                    <InboxIcon className="h-16 w-16 text-gray-200" />
                    <p className="text-gray-400 font-medium">No notifications yet.</p>
                    <p className="text-xs text-gray-400">The Principal will notify you here after approving attendance reports.</p>
                </div>
            ) : null}
        </div>
    );
}
