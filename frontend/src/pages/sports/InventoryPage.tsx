import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../../services/api';
import type { InventoryItem } from '../../services/api';
import { useAuth } from '../../utils/auth';
import clsx from 'clsx';
import PlusIcon from '@heroicons/react/24/solid/PlusIcon';
import PencilSquareIcon from '@heroicons/react/24/outline/PencilSquareIcon';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import BookmarkIcon from '@heroicons/react/24/outline/BookmarkIcon';
import ArrowPathRoundedSquareIcon from '@heroicons/react/24/outline/ArrowPathRoundedSquareIcon';
import type { InventoryReserved } from '../../services/api';

export default function InventoryPage() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

    // Create/Edit Item State
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [formData, setFormData] = useState<Partial<InventoryItem>>({
        name: '', category: '', total_quantity: 1, condition: 'New'
    });

    // Reserve Item State
    const [reservingItem, setReservingItem] = useState<InventoryItem | null>(null);
    const [reserveFormData, setReserveFormData] = useState<Partial<InventoryReserved>>({
        reserve_student_name: '', class_teacher: '', class_grade: '', reserve_start_time: '', reserve_end_time: ''
    });

    // Return Item State
    const [returningItem, setReturningItem] = useState<InventoryReserved | null>(null);
    const [returnCondition, setReturnCondition] = useState<'New' | 'Good' | 'Fair' | 'Poor' | 'Broken'>('Good');

    // Fetch Inventory
    const { data: inventory, isLoading } = useQuery({
        queryKey: ['inventory'],
        queryFn: inventoryService.getAll,
    });

    // Fetch Reserved Items
    const { data: reservedItems, isLoading: isReservedLoading } = useQuery({
        queryKey: ['inventory-reserved'],
        queryFn: inventoryService.getReservedItems,
    });

    const createMutation = useMutation({
        mutationFn: (data: Omit<InventoryItem, 'id' | 'available_quantity'>) => inventoryService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            closeModal();
        },
        onError: (err: any) => alert(err.response?.data?.error || err.message),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: Partial<InventoryItem> }) => inventoryService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            closeModal();
        },
        onError: (err: any) => alert(err.response?.data?.error || err.message),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => inventoryService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
        onError: (err: any) => alert(err.response?.data?.error || err.message),
    });

    const reserveMutation = useMutation({
        mutationFn: (data: any) => inventoryService.reserveItem(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-reserved'] });
            closeReserveModal();
        },
        onError: (err: any) => alert(err.response?.data?.error || err.message),
    });

    const returnReservedMutation = useMutation({
        mutationFn: ({ log_id, status, return_condition }: any) => inventoryService.returnReservedItem(log_id, status, return_condition),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-reserved'] });
            closeReturnModal();
        },
        onError: (err: any) => alert(err.response?.data?.error || err.message),
    });

    const openCreateModal = () => {
        setEditingItem(null);
        setFormData({ name: '', category: '', total_quantity: 1, condition: 'New' });
        setIsModalOpen(true);
    };

    const openEditModal = (item: InventoryItem) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            category: item.category,
            total_quantity: item.total_quantity,
            condition: item.condition
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const openReserveModal = (item: InventoryItem) => {
        setReservingItem(item);
        setReserveFormData({
            reserve_student_name: '', class_teacher: '', class_grade: '', reserve_start_time: '', reserve_end_time: ''
        });
        setIsReserveModalOpen(true);
    };

    const closeReserveModal = () => {
        setIsReserveModalOpen(false);
        setReservingItem(null);
    };

    const openReturnModal = (logItem: InventoryReserved) => {
        setReturningItem(logItem);
        // Default to returning in the condition it currently seems to be or Good
        setReturnCondition('Good');
        setIsReturnModalOpen(true);
    };

    const closeReturnModal = () => {
        setIsReturnModalOpen(false);
        setReturningItem(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.condition || !formData.total_quantity) return;

        if (editingItem && editingItem.id) {
            // Check if condition changed
            if (editingItem.condition !== formData.condition) {
                // Determine how many items are being moved to the new condition
                // Let's assume all available items (or a specific amount, but UI only supports full update for now)
                // If it's a full condition change, it might mean creating a new entry and deleting/reducing the old one.
                // For simplicity as requested "When changed the status for already add inventory item, it should appear as an new item."
                // Since this isn't tracking partials strictly in UI right now, let's treat changing condition of an existing item
                // as creating a new item with that quantity, and reducing the old one to 0 (or simply creating a new separate entry).
                // Let's just create a new one to satisfy the "appear as an new item" requirement
                createMutation.mutate(formData as Omit<InventoryItem, 'id' | 'available_quantity'>);
            } else {
                updateMutation.mutate({
                    id: editingItem.id,
                    data: formData
                });
            }
        } else {
            createMutation.mutate(formData as Omit<InventoryItem, 'id' | 'available_quantity'>);
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this item?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleReserveSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reservingItem || !reservingItem.id) return;

        reserveMutation.mutate({
            item_id: reservingItem.id,
            ...reserveFormData
        });
    };

    const handleReturnSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!returningItem || !returningItem.id) return;

        returnReservedMutation.mutate({
            log_id: returningItem.id,
            status: 'Returned',
            return_condition: returnCondition
        });
    };

    // Calculate overall stats
    const totalItems = inventory?.reduce((sum, item) => sum + item.total_quantity, 0) || 0;
    const availableItems = inventory?.reduce((sum, item) => sum + item.available_quantity, 0) || 0;
    const brokenItems = inventory?.filter(i => i.condition === 'Broken').reduce((sum, item) => sum + item.total_quantity, 0) || 0;

    return (
        <div className="space-y-6">
            {/* Header & Stats */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1a3b70]">Inventory Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage sports equipment, uniforms, and resources.</p>
                </div>
                {user?.role !== 'Student' && (
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 bg-[#1a3b70] text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#11274a] transition-colors"
                    >
                        <PlusIcon className="h-5 w-5" /> Add Equipment
                    </button>
                )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                    <p className="text-sm font-semibold text-gray-500 mb-1">Total Equipment</p>
                    <p className="text-3xl font-bold text-[#1a3b70]">{totalItems}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                    <p className="text-sm font-semibold text-gray-500 mb-1">Available for Use</p>
                    <p className="text-3xl font-bold text-[#10b981]">{availableItems}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                    <p className="text-sm font-semibold text-gray-500 mb-1">Broken / Poor Condition</p>
                    <p className="text-3xl font-bold text-[#e11d48]">{brokenItems}</p>
                </div>
            </div>

            {/* Inventory List */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-[#f8fafc]">
                            <tr>
                                <th className="px-6 py-4 text-left font-bold text-gray-600 uppercase tracking-wider text-xs">Item Name</th>
                                <th className="px-6 py-4 text-left font-bold text-gray-600 uppercase tracking-wider text-xs">Category</th>
                                <th className="px-6 py-4 text-left font-bold text-gray-600 uppercase tracking-wider text-xs">Condition</th>
                                <th className="px-6 py-4 text-center font-bold text-gray-600 uppercase tracking-wider text-xs">Total / Available</th>
                                {user?.role !== 'Student' && (
                                    <th className="px-6 py-4 text-right font-bold text-gray-600 uppercase tracking-wider text-xs">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading inventory...</td>
                                </tr>
                            ) : inventory?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">No inventory items found. Add some equipment!</td>
                                </tr>
                            ) : (
                                inventory?.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-bold text-gray-900">{item.name}</div>
                                            {item.last_updated && <div className="text-[10px] text-gray-400">Updated: {new Date(item.last_updated).toLocaleDateString()}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                            {item.category || <span className="text-gray-300 italic">None</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={clsx(
                                                'px-2.5 py-1 text-xs font-bold rounded-full',
                                                item.condition === 'New' && 'bg-blue-100 text-blue-700',
                                                item.condition === 'Good' && 'bg-emerald-100 text-emerald-700',
                                                item.condition === 'Fair' && 'bg-amber-100 text-amber-700',
                                                (item.condition === 'Poor' || item.condition === 'Broken') && 'bg-red-100 text-red-700'
                                            )}>
                                                {item.condition}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-1.5 font-medium">
                                                <span className={clsx(
                                                    'text-lg',
                                                    item.available_quantity > 0 ? 'text-[#10b981]' : 'text-red-500 font-bold'
                                                )}>{item.available_quantity}</span>
                                                <span className="text-gray-300">/</span>
                                                <span className="text-gray-500">{item.total_quantity}</span>
                                            </div>
                                        </td>
                                        {user?.role !== 'Student' && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openReserveModal(item)}
                                                        disabled={item.available_quantity <= 0}
                                                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                                                        title="Reserve Item"
                                                    >
                                                        <BookmarkIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="p-1.5 text-gray-400 hover:text-[#1a3b70] hover:bg-blue-50 rounded transition-colors"
                                                        title="Edit Item"
                                                    >
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                    </button>
                                                    {user?.role !== 'Student' && (
                                                        <button
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                if (item.id) handleDelete(item.id);
                                                            }}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Delete Item"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Reserved Items List */}
            <div className="mt-8">
                <h2 className="text-xl font-bold text-[#1a3b70] mb-4">Reserved Equipment</h2>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-[#f8fafc]">
                                <tr>
                                    <th className="px-6 py-4 text-left font-bold text-gray-600 uppercase tracking-wider text-xs">Item Name</th>
                                    <th className="px-6 py-4 text-left font-bold text-gray-600 uppercase tracking-wider text-xs">Reserved By</th>
                                    <th className="px-6 py-4 text-left font-bold text-gray-600 uppercase tracking-wider text-xs">Time Period</th>
                                    <th className="px-6 py-4 text-left font-bold text-gray-600 uppercase tracking-wider text-xs">Status</th>
                                    {user?.role !== 'Student' && (
                                        <th className="px-6 py-4 text-right font-bold text-gray-600 uppercase tracking-wider text-xs">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isReservedLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading reserved items...</td>
                                    </tr>
                                ) : reservedItems?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">No active reservations found.</td>
                                    </tr>
                                ) : (
                                    reservedItems?.map(log => (
                                        <tr key={log.id} className={clsx(
                                            "hover:bg-gray-50/50 transition-colors",
                                            log.status === 'Returned' && "opacity-60 bg-gray-50/80"
                                        )}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-bold text-gray-900">{log.item_name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">{log.reserve_student_name}</div>
                                                <div className="text-xs text-gray-500">Class: {log.class_grade} | Tr: {log.class_teacher}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {new Date(log.reserve_start_time).toLocaleString()} - <br />
                                                {new Date(log.reserve_end_time).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={clsx(
                                                    'px-2.5 py-1 text-xs font-bold rounded-full',
                                                    log.status === 'Reserved' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                                                )}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            {user?.role !== 'Student' && (
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    {log.status === 'Reserved' ? (
                                                        <button
                                                            onClick={() => openReturnModal(log)}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#1a3b70] bg-blue-50 rounded hover:bg-[#1a3b70] hover:text-white transition-colors border border-blue-100"
                                                            title="Return Item"
                                                        >
                                                            <ArrowPathRoundedSquareIcon className="h-4 w-4" /> Return
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">Returned</span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-[#f8fafc]">
                            <h3 className="text-lg font-bold text-[#1a3b70]">
                                {editingItem ? 'Edit Equipment' : 'Add New Equipment'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Item Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1a3b70] transition-colors"
                                    placeholder="e.g. Basketball, Cones, Nets"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1a3b70] transition-colors"
                                        placeholder="e.g. Balls, Apparel"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Total Quantity *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1a3b70] transition-colors"
                                        value={formData.total_quantity}
                                        onChange={e => setFormData({ ...formData, total_quantity: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Condition *</label>
                                <select
                                    required
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1a3b70] transition-colors"
                                    value={formData.condition}
                                    onChange={e => setFormData({ ...formData, condition: e.target.value as any })}
                                >
                                    <option value="New">New</option>
                                    <option value="Good">Good</option>
                                    <option value="Fair">Fair</option>
                                    <option value="Poor">Poor</option>
                                    <option value="Broken">Broken</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="flex-1 py-2.5 rounded-lg bg-[#1a3b70] text-white text-sm font-bold hover:bg-[#11274a] transition-colors disabled:opacity-50"
                                >
                                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Equipment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reserve Item Modal */}
            {isReserveModalOpen && reservingItem && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-[#f8fafc]">
                            <h3 className="text-lg font-bold text-[#1a3b70]">
                                Reserve Equipment: {reservingItem.name}
                            </h3>
                        </div>
                        <form onSubmit={handleReserveSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Reserve For (Student Name) *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1a3b70] transition-colors"
                                    placeholder="e.g. John Doe (Monitor)"
                                    value={reserveFormData.reserve_student_name}
                                    onChange={e => setReserveFormData({ ...reserveFormData, reserve_student_name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Class/Grade *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1a3b70] transition-colors"
                                        placeholder="e.g. 10A"
                                        value={reserveFormData.class_grade}
                                        onChange={e => setReserveFormData({ ...reserveFormData, class_grade: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Class Teacher *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1a3b70] transition-colors"
                                        placeholder="e.g. Mr. Smith"
                                        value={reserveFormData.class_teacher}
                                        onChange={e => setReserveFormData({ ...reserveFormData, class_teacher: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Start Time *</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1a3b70] transition-colors"
                                        value={reserveFormData.reserve_start_time}
                                        onChange={e => setReserveFormData({ ...reserveFormData, reserve_start_time: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">End Time *</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1a3b70] transition-colors"
                                        value={reserveFormData.reserve_end_time}
                                        onChange={e => setReserveFormData({ ...reserveFormData, reserve_end_time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={closeReserveModal}
                                    className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={reserveMutation.isPending}
                                    className="flex-1 py-2.5 rounded-lg bg-[#1a3b70] text-white text-sm font-bold hover:bg-[#11274a] transition-colors disabled:opacity-50"
                                >
                                    {reserveMutation.isPending ? 'Reserving...' : 'Confirm Reservation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Return Item Modal */}
            {isReturnModalOpen && returningItem && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-[#f8fafc]">
                            <h3 className="text-lg font-bold text-[#1a3b70]">
                                Return Equipment: {returningItem.item_name}
                            </h3>
                        </div>
                        <form onSubmit={handleReturnSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Return Condition *</label>
                                <select
                                    required
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1a3b70] transition-colors"
                                    value={returnCondition}
                                    onChange={e => setReturnCondition(e.target.value as any)}
                                >
                                    <option value="New">New</option>
                                    <option value="Good">Good</option>
                                    <option value="Fair">Fair</option>
                                    <option value="Poor">Poor</option>
                                    <option value="Broken">Broken</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={closeReturnModal}
                                    className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={returnReservedMutation.isPending}
                                    className="flex-1 py-2.5 rounded-lg bg-[#10b981] text-white text-sm font-bold hover:bg-[#059669] transition-colors disabled:opacity-50"
                                >
                                    {returnReservedMutation.isPending ? 'Processing...' : 'Return Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
