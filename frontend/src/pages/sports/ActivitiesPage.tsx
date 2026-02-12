import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityService } from '../../services/api';
import { useAuth } from '../../utils/auth';
import { useState } from 'react';
import {
    PlusIcon,
    TrashIcon,
    AcademicCapIcon,
    TrophyIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';

export default function ActivitiesPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Sport',
        description: '',
        in_charge_staff_id: user?.id || 1 // defaulting to current user or 1
    });

    const { data: activities, isLoading, error } = useQuery({
        queryKey: ['activities'],
        queryFn: activityService.getAll,
    });

    const createMutation = useMutation({
        mutationFn: activityService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activities'] });
            setIsModalOpen(false);
            setFormData({ name: '', type: 'Sport', description: '', in_charge_staff_id: user?.id || 1 });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: activityService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activities'] });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData as any);
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this activity?')) {
            deleteMutation.mutate(id);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Sport': return <TrophyIcon className="h-6 w-6 text-orange-500" />;
            case 'Club': return <UserGroupIcon className="h-6 w-6 text-blue-500" />;
            case 'Society': return <AcademicCapIcon className="h-6 w-6 text-green-500" />;
            default: return <UserGroupIcon className="h-6 w-6 text-gray-500" />;
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading activities...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error loading activities</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Activities & Clubs</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage all sports teams, clubs, and societies.
                    </p>
                </div>
                {(user?.role === 'Admin' || user?.role === 'Coach') && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Add New Activity
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activities?.map((activity) => (
                    <div
                        key={activity.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition duration-200 overflow-hidden group"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-gray-50 rounded-lg">
                                    {getTypeIcon(activity.type)}
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border
                                    ${activity.type === 'Sport' ? 'bg-orange-50 text-orange-700 border-orange-100' : ''}
                                    ${activity.type === 'Club' ? 'bg-blue-50 text-blue-700 border-blue-100' : ''}
                                    ${activity.type === 'Society' ? 'bg-green-50 text-green-700 border-green-100' : ''}
                                `}>
                                    {activity.type}
                                </span>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{activity.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2 h-10">
                                {activity.description || 'No description provided.'}
                            </p>

                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                                <span className="text-gray-400 text-xs">ID: {activity.id}</span>
                                {(user?.role === 'Admin') && (
                                    <button
                                        onClick={() => handleDelete(activity.id)}
                                        className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Simple Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900">Create New Activity</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Football Team"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="Sport">Sport</option>
                                    <option value="Club">Club</option>
                                    <option value="Society">Society</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    placeholder="Brief description..."
                                />
                            </div>

                            <div className="pt-4 flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {createMutation.isPending ? 'Creating...' : 'Create Activity'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
