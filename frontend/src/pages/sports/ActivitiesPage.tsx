import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityService } from '../../services/api';
import { useAuth } from '../../utils/auth';
import { useState } from 'react';
import PlusIcon from '@heroicons/react/24/outline/PlusIcon';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import AcademicCapIcon from '@heroicons/react/24/outline/AcademicCapIcon';
import TrophyIcon from '@heroicons/react/24/outline/TrophyIcon';
import UserGroupIcon from '@heroicons/react/24/outline/UserGroupIcon';
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon';
import MagnifyingGlassIcon from '@heroicons/react/24/outline/MagnifyingGlassIcon';
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';
import CheckCircleIcon from '@heroicons/react/24/solid/CheckCircleIcon';

const TYPE_CONFIG: Record<string, { color: string; bg: string; border: string; badgeBg: string; badgeText: string; accent: string }> = {
    Sport: { color: 'text-orange-500', bg: 'bg-[#FFF0E6]', border: 'border-orange-100', badgeBg: 'bg-orange-50', badgeText: 'text-orange-700', accent: 'bg-orange-400' },
    Club: { color: 'text-blue-500', bg: 'bg-[#E1F5FE]', border: 'border-blue-100', badgeBg: 'bg-blue-50', badgeText: 'text-blue-700', accent: 'bg-blue-400' },
    Society: { color: 'text-green-600', bg: 'bg-[#E8F5E9]', border: 'border-green-100', badgeBg: 'bg-green-50', badgeText: 'text-green-700', accent: 'bg-green-400' },
};

const getTypeIcon = (type: string) => {
    const cls = `h-6 w-6 ${TYPE_CONFIG[type]?.color ?? 'text-gray-500'}`;
    switch (type) {
        case 'Sport': return <TrophyIcon className={cls} />;
        case 'Club': return <UserGroupIcon className={cls} />;
        case 'Society': return <AcademicCapIcon className={cls} />;
        default: return <UserGroupIcon className={cls} />;
    }
};

export default function ActivitiesPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: number | null, name: string}>({ isOpen: false, id: null, name: '' });
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('All');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Sport',
        description: '',
        in_charge_staff_id: user?.id || 1,
    });

    const { data: activities, isLoading, error } = useQuery({
        queryKey: ['activities'],
        queryFn: activityService.getAll,
    });

    const createMutation = useMutation({
        mutationFn: activityService.create,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['activities'] });
            setIsModalOpen(false);
            setSuccessMessage((data as any).name);
            setFormData({ name: '', type: 'Sport', description: '', in_charge_staff_id: user?.id || 1 });
            setTimeout(() => setSuccessMessage(null), 3000);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: activityService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activities'] });
        },
        onError: (err: any) => {
            alert('Failed to delete activity: ' + (err.response?.data?.error || err.message));
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData as any);
    };

    const confirmDelete = () => {
        if (deleteModal.id) {
            deleteMutation.mutate(deleteModal.id, {
                onSuccess: () => setDeleteModal({ isOpen: false, id: null, name: '' }),
            });
        }
    };

    const filtered = (activities ?? []).filter(a => {
        const matchType = typeFilter === 'All' || a.type === typeFilter;
        const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
            (a.description ?? '').toLowerCase().includes(search.toLowerCase());
        return matchType && matchSearch;
    });

    const counts = { Sport: 0, Club: 0, Society: 0, All: activities?.length ?? 0 };
    activities?.forEach(a => { if (a.type in counts) (counts as any)[a.type]++; });

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-[#633194]/20 border-t-[#633194] animate-spin" />
            <p className="text-sm text-gray-500">Loading activities…</p>
        </div>
    );
    if (error) return (
        <div className="flex items-center justify-center h-48">
            <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg border border-red-200">Error loading activities</p>
        </div>
    );

    return (
        <div className="space-y-6 relative">
            <AnimatePresence>
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className="fixed top-6 left-1/2 z-[100] flex items-center gap-3 px-6 py-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_rgba(99,49,148,0.15)] border border-purple-100 whitespace-nowrap"
                    >
                        <div className="h-8 w-8 rounded-full bg-[#F4F0FF] flex items-center justify-center text-[#633194]">
                            <CheckCircleIcon className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col pr-2">
                            <span className="text-[13px] font-bold text-gray-800 tracking-tight">
                                Success! Activity Created
                            </span>
                            <span className="text-[11px] font-semibold text-[#633194] opacity-80">
                                "{successMessage}" is now live.
                            </span>
                        </div>
                        <button 
                            onClick={() => setSuccessMessage(null)} 
                            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-all"
                        >
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Activities &amp; Clubs</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage all sports teams, clubs, and societies.</p>
                </div>
                {(user?.role === 'Admin' || user?.role === 'Coach') && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                        style={{ background: 'linear-gradient(135deg, #633194 0%, #9b59b6 100%)' }}
                    >
                        <PlusIcon className="h-4 w-4" />
                        Add New Activity
                    </button>
                )}
            </div>

            {/* Stats Pills + Filter */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                {/* Type Filter Pills */}
                <div className="flex gap-2 flex-wrap">
                    {(['All', 'Sport', 'Club', 'Society'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTypeFilter(t)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${typeFilter === t
                                    ? 'bg-[#633194] text-white border-[#633194] shadow-sm'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-[#633194]/40 hover:text-[#633194]'
                                }`}
                        >
                            {t} <span className="opacity-70">({counts[t]})</span>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search activities…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#633194] focus:ring-2 focus:ring-[#633194]/10 transition-all"
                    />
                </div>
            </div>

            {/* Activity Cards Grid */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 p-16 gap-3 text-center">
                    <UserGroupIcon className="h-14 w-14 text-gray-200" />
                    <p className="text-gray-500 font-medium">No activities found.</p>
                    <p className="text-xs text-gray-400">Try adjusting the filter or search term.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((activity) => {
                        const cfg = TYPE_CONFIG[activity.type] ?? TYPE_CONFIG['Club'];
                        return (
                            <div
                                key={activity.id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
                            >
                                {/* Top accent bar */}
                                <div className={`h-1 w-full ${cfg.accent}`} />

                                <div className="p-5">
                                    {/* Icon + Badge Row */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                                            {getTypeIcon(activity.type)}
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.border}`}>
                                            {activity.type}
                                        </span>
                                    </div>

                                    <h3 className="text-base font-bold text-gray-800 mb-1 group-hover:text-[#633194] transition-colors">
                                        {activity.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]">
                                        {activity.description || 'No description provided.'}
                                    </p>

                                    {/* Footer */}
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-xs text-gray-400 font-medium">ID #{activity.id}</span>
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={`/sports/activities/${activity.id}/members`}
                                                className="flex items-center gap-1 text-xs font-semibold text-[#633194] bg-[#F4F0FF] px-3 py-1.5 rounded-lg hover:bg-[#633194] hover:text-white transition-all"
                                            >
                                                Members <ArrowRightIcon className="h-3 w-3" />
                                            </a>
                                            {user?.role === 'Admin' && (
                                                <button
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteModal({ isOpen: true, id: activity.id, name: activity.name }); }}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all z-10 relative"
                                                    title="Delete activity"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Activity Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
                        {/* Modal Header */}
                        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #633194 0%, #9b59b6 100%)' }}>
                            <div className="flex items-center gap-2">
                                <PlusIcon className="h-5 w-5 text-white" />
                                <h2 className="text-base font-bold text-white">Create New Activity</h2>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                    Activity Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#633194] focus:ring-2 focus:ring-[#633194]/15 transition-all bg-gray-50 focus:bg-white"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Football Team"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                    Type
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['Sport', 'Club', 'Society'] as const).map(t => {
                                        const tc = TYPE_CONFIG[t];
                                        return (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: t })}
                                                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all ${formData.type === t
                                                        ? `${tc.badgeBg} ${tc.badgeText} ${tc.border} shadow-sm`
                                                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                {getTypeIcon(t)}
                                                {t}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                    Description <span className="text-gray-400 font-normal normal-case">(optional)</span>
                                </label>
                                <textarea
                                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#633194] focus:ring-2 focus:ring-[#633194]/15 transition-all resize-none bg-gray-50 focus:bg-white"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    placeholder="Brief description of this activity…"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg, #633194 0%, #9b59b6 100%)' }}
                                >
                                    {createMutation.isPending ? 'Creating…' : 'Create Activity'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                title="Delete Activity"
                message={`Are you sure you want to permanently delete the activity "${deleteModal.name}"? All associated data will be removed.`}
                confirmText="Delete Activity"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
