import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportService } from '../../services/api';
import clsx from 'clsx';
import BellIcon from '@heroicons/react/24/solid/BellIcon';
import CheckCircleIcon from '@heroicons/react/24/solid/CheckCircleIcon';
import InboxIcon from '@heroicons/react/24/outline/InboxIcon';
import CalendarDaysIcon from '@heroicons/react/24/outline/CalendarDaysIcon';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

export default function TeacherNotificationsPage() {
    const queryClient = useQueryClient();
    const [actionModal, setActionModal] = useState<{ isOpen: boolean; notifId: number | null }>({ isOpen: false, notifId: null });

    const { data: notifications, isLoading } = useQuery({
        queryKey: ['myNotifications'],
        queryFn: reportService.getMyNotifications,
        refetchInterval: 30_000,
    });

    const actionMutation = useMutation({
        mutationFn: (id: number) => reportService.actionNotification(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myNotifications'] }),
    });

    const unread = notifications?.filter(n => n.status !== 'Actioned').length ?? 0;
    const actioned = notifications?.filter(n => n.status === 'Actioned').length ?? 0;
    const total = notifications?.length ?? 0;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    {/* Bell with badge */}
                    <div className="relative h-12 w-12 rounded-2xl bg-[#F4F0FF] flex items-center justify-center flex-shrink-0">
                        <BellIcon className="h-6 w-6 text-[#633194]" />
                        {unread > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                                {unread}
                            </span>
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Teacher Alerts</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Notifications from the Principal to update student class attendance.
                        </p>
                    </div>
                </div>

                {/* Summary Chips */}
                {total > 0 && (
                    <div className="flex gap-2 flex-shrink-0">
                        <div className="px-3 py-1.5 rounded-xl border bg-red-50 text-red-600 border-red-200 text-xs font-semibold">
                            {unread} Pending
                        </div>
                        <div className="px-3 py-1.5 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
                            {actioned} Actioned
                        </div>
                    </div>
                )}
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <div className="w-10 h-10 rounded-full border-4 border-[#633194]/20 border-t-[#633194] animate-spin" />
                    <p className="text-sm text-gray-400">Loading notifications…</p>
                </div>
            )}

            {/* Notifications List */}
            {notifications && notifications.length > 0 ? (
                <div className="space-y-3">
                    {notifications.map(notif => {
                        const isActioned = notif.status === 'Actioned';
                        return (
                            <div
                                key={notif.id}
                                className={clsx(
                                    'rounded-2xl border transition-all overflow-hidden',
                                    isActioned
                                        ? 'bg-gray-50 border-gray-100 opacity-70'
                                        : 'bg-white border-[#633194]/20 shadow-sm hover:shadow-md'
                                )}
                            >
                                {/* Top bar: status indicator */}
                                <div className={clsx(
                                    'h-1.5 w-full',
                                    isActioned ? 'bg-gray-200' : 'bg-gradient-to-r from-[#633194] to-[#9b59b6]'
                                )} />

                                <div className="p-5">
                                    {/* Top Row: Badges & Action Button */}
                                    <div className="flex items-center justify-between gap-4 mb-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {isActioned ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <CheckCircleIcon className="h-3.5 w-3.5" /> Actioned
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-500 border border-red-200 shadow-sm">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                                                    Requires Action
                                                </span>
                                            )}

                                            <span className="text-[15px] font-bold text-gray-900 ml-1">
                                                {notif.activity_name || `Report #${notif.report_id}`}
                                            </span>

                                            {notif.report_date && (
                                                <span className="flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 ml-2">
                                                    <CalendarDaysIcon className="h-3.5 w-3.5" />
                                                    {new Date(notif.report_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </span>
                                            )}
                                        </div>

                                        {!isActioned && (
                                            <button
                                                onClick={() => setActionModal({ isOpen: true, notifId: notif.id })}
                                                disabled={actionMutation.isPending}
                                                className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-[20px] text-xs font-bold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50"
                                                style={{ backgroundColor: '#2e9c61' }}
                                            >
                                                <CheckCircleIcon className="h-4 w-4" />
                                                Mark Actioned
                                            </button>
                                        )}
                                    </div>

                                    {/* Message Box */}
                                    <div className={clsx(
                                        'text-sm text-gray-700 leading-relaxed rounded-xl p-4 border whitespace-pre-wrap',
                                        isActioned
                                            ? 'bg-gray-50 border-gray-100'
                                            : 'bg-[#F9F7FC] border-[#EAE2F8] text-[#3c2a5c]'
                                    )}>
                                        {notif.message}
                                    </div>

                                    {/* Footer Details */}
                                    <div className="mt-4 flex flex-col gap-2">
                                        {notif.total_students && (
                                            <div className="flex items-center gap-3 text-xs">
                                                <span className="flex items-center gap-1.5 font-bold text-[#2e9c61]">
                                                    <span className="h-2 w-2 rounded-full bg-[#2e9c61]" />
                                                    {notif.present_count} present
                                                </span>
                                                <span className="flex items-center gap-1.5 font-bold text-red-500">
                                                    <span className="h-2 w-2 rounded-full bg-red-500" />
                                                    {notif.absent_count} absent
                                                </span>
                                                <span className="text-gray-400 font-medium ml-1">{notif.total_students} total</span>
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-400 font-medium">
                                            Sent by Principal · {new Date(notif.sent_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : !isLoading ? (
                /* Empty State */
                <div className="bg-white rounded-2xl border border-gray-100 p-16 flex flex-col items-center gap-4 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-[#F4F0FF] flex items-center justify-center">
                        <InboxIcon className="h-8 w-8 text-[#633194]" />
                    </div>
                    <div>
                        <p className="text-gray-700 font-semibold">All clear — no notifications yet.</p>
                        <p className="text-xs text-gray-400 mt-1">
                            The Principal will notify you here after approving attendance reports.
                        </p>
                    </div>
                </div>
            ) : null}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={actionModal.isOpen}
                title="Mark as Actioned"
                message={<>Are you sure you want to mark this alert as actioned?<br /><br />By confirming, you acknowledge that you have reviewed the principal's notification and successfully updated the corresponding student class attendance records in the system.</>}
                confirmText="Yes, Mark Actioned"
                onConfirm={() => {
                    actionMutation.mutate(actionModal.notifId!);
                    setActionModal({ isOpen: false, notifId: null });
                }}
                onCancel={() => setActionModal({ isOpen: false, notifId: null })}
                isLoading={actionMutation.isPending}
            />
        </div>
    );
}
