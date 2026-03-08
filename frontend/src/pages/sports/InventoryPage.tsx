import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../../services/api';
import type { InventoryItem } from '../../services/api';
import { useAuth } from '../../utils/auth';
import clsx from 'clsx';
import PlusIcon from '@heroicons/react/24/solid/PlusIcon';
import PencilSquareIcon from '@heroicons/react/24/outline/PencilSquareIcon';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';

export default function InventoryPage() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [formData, setFormData] = useState<Partial<InventoryItem>>({
        name: '', category: '', total_quantity: 1, condition: 'New'
    });

    // Fetch Inventory
    const { data: inventory, isLoading } = useQuery({
        queryKey: ['inventory'],
        queryFn: inventoryService.getAll,
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.condition || !formData.total_quantity) return;

        if (editingItem && editingItem.id) {
            updateMutation.mutate({ 
                id: editingItem.id, 
                data: formData
            });
        } else {
            createMutation.mutate(formData as Omit<InventoryItem, 'id' | 'available_quantity'>);
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this item?')) {
            deleteMutation.mutate(id);
        }
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
                                                        onClick={() => openEditModal(item)}
                                                        className="p-1.5 text-gray-400 hover:text-[#1a3b70] hover:bg-blue-50 rounded transition-colors"
                                                        title="Edit Item"
                                                    >
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                    </button>
                                                    {user?.role === 'Admin' && (
                                                        <button
                                                            onClick={() => item.id && handleDelete(item.id)}
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
        </div>
    );
}
