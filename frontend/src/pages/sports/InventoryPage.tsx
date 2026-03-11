import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService, studentService } from '../../services/api';
import type { InventoryItem, InventoryReserved } from '../../services/api';
import { useAuth } from '../../utils/auth';
import clsx from 'clsx';
import PlusIcon from '@heroicons/react/24/solid/PlusIcon';
import PencilSquareIcon from '@heroicons/react/24/outline/PencilSquareIcon';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import BookmarkIcon from '@heroicons/react/24/outline/BookmarkIcon';
import ArrowPathRoundedSquareIcon from '@heroicons/react/24/outline/ArrowPathRoundedSquareIcon';
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon';
import MagnifyingGlassIcon from '@heroicons/react/24/outline/MagnifyingGlassIcon';
import DateTimePicker from '../../components/ui/DateTimePicker';
import CustomSelect from '../../components/ui/CustomSelect';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CONDITION_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
    New:    { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
    Good:   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    Fair:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
    Poor:   { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
    Broken: { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' },
};
const CONDITIONS = ['New', 'Good', 'Fair', 'Poor', 'Broken'] as const;
type Condition = typeof CONDITIONS[number];

const conditionOptions = CONDITIONS.map(c => ({ value: c, label: c }));

type StudentHit = { id: number; name: string; grade: string; classTeacherName?: string };

// ─── Student Autocomplete Field ────────────────────────────────────────────────
interface AutocompleteProps {
    value: string;
    onChange: (val: string) => void;
    onSelectStudent: (s: StudentHit) => void;
    placeholder?: string;
}
function StudentAutocomplete({ value, onChange, onSelectStudent, placeholder }: AutocompleteProps) {
    const [query,       setQuery]       = useState(value);
    const [results,     setResults]     = useState<StudentHit[]>([]);
    const [loading,     setLoading]     = useState(false);
    const [open,        setOpen]        = useState(false);
    const [didPick,     setDidPick]     = useState(false);
    const containerRef                  = useRef<HTMLDivElement>(null);
    const debounceRef                   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Sync external value changes (e.g. when modal resets)
    useEffect(() => { setQuery(value); setDidPick(false); setResults([]); setOpen(false); }, [value]);

    // Close on outside click
    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const search = useCallback(async (q: string) => {
        if (q.length < 2) { setResults([]); setOpen(false); return; }
        setLoading(true);
        try {
            const data = await studentService.search(q);
            setResults(data);
            setOpen(data.length > 0);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        setQuery(v);
        onChange(v);
        setDidPick(false);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => search(v), 280);
    };

    const handlePick = (s: StudentHit) => {
        setQuery(s.name);
        onChange(s.name);
        setDidPick(true);
        setOpen(false);
        setResults([]);
        onSelectStudent(s);
    };

    return (
        <div className="relative" ref={containerRef}>
            <div className={clsx(
                'flex items-center gap-2 w-full rounded-xl border text-sm transition-all px-3.5 py-2.5 bg-gray-50',
                open || (!didPick && query.length > 0) ? 'border-[#633194] ring-2 ring-[#633194]/15 bg-white' : 'border-gray-200 hover:border-[#633194]/40'
            )}>
                {loading
                    ? <div className="h-4 w-4 rounded-full border-2 border-[#633194]/20 border-t-[#633194] animate-spin flex-shrink-0" />
                    : <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                }
                <input
                    type="text"
                    value={query}
                    onChange={handleChange}
                    placeholder={placeholder ?? 'Search student name…'}
                    className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 min-w-0"
                    autoComplete="off"
                />
                {query && (
                    <button type="button" onClick={() => { setQuery(''); onChange(''); setResults([]); setOpen(false); setDidPick(false); }}
                        className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                        <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* Suggestions dropdown */}
            {open && results.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-[200]"
                     style={{ animation: 'selectDropDown 0.13s ease-out' }}>
                    <style>{`@keyframes selectDropDown{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>
                    <div className="py-1.5 max-h-52 overflow-y-auto">
                        {results.map(s => (
                            <div
                                key={s.id}
                                onClick={() => handlePick(s)}
                                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#F4F0FF] transition-colors group"
                            >
                                <div className="h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                                     style={{ background: 'linear-gradient(135deg,#633194,#9b59b6)' }}>
                                    {s.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 group-hover:text-[#633194] truncate">{s.name}</p>
                                    <p className="text-xs text-gray-400 truncate">Grade {s.grade}{s.classTeacherName ? ` · ${s.classTeacherName}` : ''}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function InventoryPage() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const [isModalOpen,        setIsModalOpen]        = useState(false);
    const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
    const [isReturnModalOpen,  setIsReturnModalOpen]  = useState(false);

    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [formData,    setFormData]    = useState<Partial<InventoryItem>>({ name: '', category: '', total_quantity: 1, condition: 'New' });

    const [reservingItem,   setReservingItem]   = useState<InventoryItem | null>(null);
    const [reserveFormData, setReserveFormData] = useState<Partial<InventoryReserved>>({
        reserve_student_name: '', class_teacher: '', class_grade: '', reserve_start_time: '', reserve_end_time: '',
    });

    const [returningItem,   setReturningItem]   = useState<InventoryReserved | null>(null);
    const [returnCondition, setReturnCondition] = useState<Condition>('Good');

    // ─── Queries ───────────────────────────────────────────────────────────────
    const { data: inventory,     isLoading          } = useQuery({ queryKey: ['inventory'],          queryFn: inventoryService.getAll });
    const { data: reservedItems, isLoading: isResLoading } = useQuery({ queryKey: ['inventory-reserved'], queryFn: inventoryService.getReservedItems });

    // ─── Mutations ─────────────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: (data: Omit<InventoryItem, 'id' | 'available_quantity'>) => inventoryService.create(data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }); closeModal(); },
        onError: (err: any) => alert(err.response?.data?.error || err.message),
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<InventoryItem> }) => inventoryService.update(id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }); closeModal(); },
        onError: (err: any) => alert(err.response?.data?.error || err.message),
    });
    const deleteMutation = useMutation({
        mutationFn: (id: number) => inventoryService.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
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
        mutationFn: ({ log_id, status, return_condition }: any) =>
            inventoryService.returnReservedItem(log_id, status, return_condition),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-reserved'] });
            closeReturnModal();
        },
        onError: (err: any) => alert(err.response?.data?.error || err.message),
    });

    // ─── Handlers ──────────────────────────────────────────────────────────────
    const openCreateModal = () => {
        setEditingItem(null);
        setFormData({ name: '', category: '', total_quantity: 1, condition: 'New' });
        setIsModalOpen(true);
    };
    const openEditModal = (item: InventoryItem) => {
        setEditingItem(item);
        setFormData({ name: item.name, category: item.category, total_quantity: item.total_quantity, condition: item.condition });
        setIsModalOpen(true);
    };
    const closeModal = () => { setIsModalOpen(false); setEditingItem(null); };

    const openReserveModal  = (item: InventoryItem) => {
        setReservingItem(item);
        setReserveFormData({ reserve_student_name: '', class_teacher: '', class_grade: '', reserve_start_time: '', reserve_end_time: '' });
        setIsReserveModalOpen(true);
    };
    const closeReserveModal = () => { setIsReserveModalOpen(false); setReservingItem(null); };

    const openReturnModal  = (log: InventoryReserved) => { setReturningItem(log); setReturnCondition('Good'); setIsReturnModalOpen(true); };
    const closeReturnModal = () => { setIsReturnModalOpen(false); setReturningItem(null); };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.condition || !formData.total_quantity) return;
        if (editingItem?.id) {
            if (editingItem.condition !== formData.condition) {
                createMutation.mutate(formData as Omit<InventoryItem, 'id' | 'available_quantity'>);
            } else {
                updateMutation.mutate({ id: editingItem.id, data: formData });
            }
        } else {
            createMutation.mutate(formData as Omit<InventoryItem, 'id' | 'available_quantity'>);
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this inventory item?')) deleteMutation.mutate(id);
    };

    const handleReserveSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reservingItem?.id) return;
        reserveMutation.mutate({ item_id: reservingItem.id, ...reserveFormData });
    };

    const handleReturnSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!returningItem?.id) return;
        returnReservedMutation.mutate({ log_id: returningItem.id, status: 'Returned', return_condition: returnCondition });
    };

    // Student selected from autocomplete → auto-fill grade & teacher
    const handleStudentPicked = (s: StudentHit) => {
        setReserveFormData(f => ({
            ...f,
            reserve_student_name: s.name,
            class_grade:    s.grade          ?? f.class_grade,
            class_teacher:  s.classTeacherName ?? f.class_teacher,
        }));
    };

    // ─── Stats ─────────────────────────────────────────────────────────────────
    const totalAvail = inventory?.reduce((s, i) => s + i.total_quantity, 0) || 0;
    const avail      = inventory?.reduce((s, i) => s + i.available_quantity, 0) || 0;
    const reserved   = inventory?.reduce((s, i) => s + (i.total_quantity - i.available_quantity), 0) || 0;
    const broken     = inventory?.filter(i => i.condition === 'Broken' || i.condition === 'Poor').reduce((s, i) => s + i.total_quantity, 0) || 0;
    const activeRes  = reservedItems?.filter(r => r.status === 'Reserved').length || 0;

    return (
        <div className="space-y-6">

            {/* ── Page Header ───────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage sports equipment, uniforms, and resources.</p>
                </div>
                {user?.role !== 'Student' && (
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                        style={{ background: 'linear-gradient(135deg,#633194,#9b59b6)' }}
                    >
                        <PlusIcon className="h-4 w-4" /> Add Equipment
                    </button>
                )}
            </div>

            {/* ── Quick Stats ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Equipment', value: totalAvail, bg: 'bg-[#F4F0FF]', text: 'text-[#633194]' },
                    { label: 'Available',        value: avail,     bg: 'bg-emerald-50',  text: 'text-emerald-700' },
                    { label: 'Reserved',         value: reserved,  bg: 'bg-amber-50',    text: 'text-amber-700' },
                    { label: 'Poor / Broken',    value: broken,    bg: 'bg-red-50',      text: 'text-red-600' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-2xl p-5 border border-white`}>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
                        <p className={`text-3xl font-extrabold ${s.text}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* ── Inventory Table ───────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Equipment List</h2>
                    <span className="text-xs font-bold bg-[#F4F0FF] text-[#633194] px-2.5 py-1 rounded-full">
                        {inventory?.length ?? 0} items
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Item Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Condition</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Available / Total</th>
                                {user?.role !== 'Student' && (
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-14 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 rounded-full border-4 border-[#633194]/20 border-t-[#633194] animate-spin" />
                                            <p className="text-sm text-gray-400">Loading inventory…</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : inventory?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-14 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-14 w-14 rounded-2xl bg-[#F4F0FF] flex items-center justify-center">
                                                <BookmarkIcon className="h-7 w-7 text-[#633194]" />
                                            </div>
                                            <p className="text-gray-500 font-semibold">No items yet</p>
                                            <p className="text-xs text-gray-400">Click "Add Equipment" to get started.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : inventory?.map(item => {
                                const cfg   = CONDITION_CONFIG[item.condition] ?? CONDITION_CONFIG['Good'];
                                const ratio = item.total_quantity > 0 ? item.available_quantity / item.total_quantity : 0;
                                return (
                                    <tr key={item.id} className="hover:bg-[#F4F0FF]/20 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="font-semibold text-gray-800 group-hover:text-[#633194] transition-colors">{item.name}</p>
                                            {item.last_updated && <p className="text-[10px] text-gray-400 mt-0.5">Updated {new Date(item.last_updated).toLocaleDateString()}</p>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {item.category || <span className="italic text-gray-300">None</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                                {item.condition}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex items-center gap-1 font-medium">
                                                    <span className={item.available_quantity > 0 ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                                                        {item.available_quantity}
                                                    </span>
                                                    <span className="text-gray-300">/</span>
                                                    <span className="text-gray-500">{item.total_quantity}</span>
                                                </div>
                                                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{ width: `${ratio * 100}%`, background: ratio > 0.5 ? '#10b981' : ratio > 0.2 ? '#f59e0b' : '#ef4444' }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        {user?.role !== 'Student' && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button onClick={() => openReserveModal(item)} disabled={item.available_quantity <= 0}
                                                        className="p-1.5 rounded-lg text-gray-300 hover:text-amber-600 hover:bg-amber-50 transition-all disabled:opacity-30 disabled:pointer-events-none"
                                                        title="Reserve Item">
                                                        <BookmarkIcon className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => openEditModal(item)}
                                                        className="p-1.5 rounded-lg text-gray-300 hover:text-[#633194] hover:bg-[#F4F0FF] transition-all"
                                                        title="Edit Item">
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => item.id && handleDelete(item.id)}
                                                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                                        title="Delete Item">
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Reserved Equipment Section ────────────────────────────────── */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Reserved Equipment</h2>
                    {activeRes > 0 && (
                        <span className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                            {activeRes} active
                        </span>
                    )}
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/60">
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Item</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Reserved By</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Period</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    {user?.role !== 'Student' && (
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isResLoading ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">Loading reservations…</td></tr>
                                ) : reservedItems?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-14 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                                                    <BookmarkIcon className="h-6 w-6 text-amber-500" />
                                                </div>
                                                <p className="text-sm text-gray-500 font-medium">No active reservations</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : reservedItems?.map(log => (
                                    <tr key={log.id} className={clsx(
                                        'transition-colors',
                                        log.status === 'Returned' ? 'opacity-50 bg-gray-50/40' : 'hover:bg-[#F4F0FF]/20'
                                    )}>
                                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-800">{log.item_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="font-medium text-gray-800">{log.reserve_student_name}</p>
                                            <p className="text-xs text-gray-400">Grade {log.class_grade} · {log.class_teacher}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                            <p>{new Date(log.reserve_start_time).toLocaleString()}</p>
                                            <p className="text-gray-400">→ {new Date(log.reserve_end_time).toLocaleString()}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={clsx(
                                                'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border',
                                                log.status === 'Reserved' && 'bg-amber-50 text-amber-700 border-amber-200',
                                                log.status === 'Returned' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                                log.status === 'Cancelled' && 'bg-gray-100 text-gray-600 border-gray-200',
                                            )}>
                                                {log.status}
                                            </span>
                                            {log.return_condition && (
                                                <p className="text-[10px] text-gray-400 mt-0.5">Returned: {log.return_condition}</p>
                                            )}
                                        </td>
                                        {user?.role !== 'Student' && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {log.status === 'Reserved' ? (
                                                    <button
                                                        onClick={() => openReturnModal(log)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                                                        style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
                                                    >
                                                        <ArrowPathRoundedSquareIcon className="h-3.5 w-3.5" /> Return Item
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-300 italic">Returned</span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/*═══════════════ MODALS ══════════════════════════════════════════*/}

            {/* ── Create / Edit Modal ───────────────────────────────────────── */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-visible border border-gray-100">
                        <div className="px-6 py-4 flex items-center justify-between rounded-t-2xl"
                             style={{ background: 'linear-gradient(135deg,#633194,#9b59b6)' }}>
                            <h3 className="text-base font-bold text-white">
                                {editingItem ? '✏️ Edit Equipment' : '➕ Add New Equipment'}
                            </h3>
                            <button onClick={closeModal} className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        {editingItem && editingItem.condition !== formData.condition && (
                            <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700 flex items-center gap-2">
                                <span className="text-base">⚠️</span>
                                Changing the condition will create this as a <strong>new separate entry</strong>.
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Item Name *</label>
                                <input
                                    type="text" required
                                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-[#633194] focus:ring-2 focus:ring-[#633194]/15 transition-all"
                                    placeholder="e.g. Basketball, Cones, Nets"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Category</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-[#633194] focus:ring-2 focus:ring-[#633194]/15 transition-all"
                                        placeholder="e.g. Balls, Apparel"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Quantity *</label>
                                    <input
                                        type="number" min="1" required
                                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-[#633194] focus:ring-2 focus:ring-[#633194]/15 transition-all"
                                        value={formData.total_quantity}
                                        onChange={e => setFormData({ ...formData, total_quantity: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            {/* Condition — CustomSelect (portal-based, never clipped) */}
                            <CustomSelect
                                label="Condition *"
                                required
                                value={formData.condition ?? 'New'}
                                onChange={v => setFormData({ ...formData, condition: v as Condition })}
                                options={conditionOptions}
                            />

                            <div className="flex gap-3 pt-2 border-t border-gray-100">
                                <button type="button" onClick={closeModal}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                                    Cancel
                                </button>
                                <button type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg,#633194,#9b59b6)' }}>
                                    {createMutation.isPending || updateMutation.isPending ? 'Saving…' : 'Save Equipment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Reserve Modal ─────────────────────────────────────────────── */}
            {isReserveModalOpen && reservingItem && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100"
                         style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="px-6 py-4 flex items-center justify-between sticky top-0 rounded-t-2xl z-10"
                             style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <BookmarkIcon className="h-5 w-5" /> Reserve Equipment
                                </h3>
                                <p className="text-white/75 text-xs mt-0.5">{reservingItem.name} · {reservingItem.available_quantity} available</p>
                            </div>
                            <button onClick={closeReserveModal} className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleReserveSubmit} className="p-6 space-y-4">
                            {/* ── Student Name with Real-time Autocomplete ── */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                    Reserve For (Student Name) *
                                </label>
                                <StudentAutocomplete
                                    value={reserveFormData.reserve_student_name ?? ''}
                                    onChange={v => setReserveFormData(f => ({ ...f, reserve_student_name: v }))}
                                    onSelectStudent={handleStudentPicked}
                                    placeholder="Type student name to search…"
                                />
                                <p className="text-[10px] text-gray-400 mt-1 pl-1">
                                    Start typing a name — class & teacher will auto-fill if the student is found.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Class / Grade *</label>
                                    <input
                                        type="text" required
                                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-[#633194] focus:ring-2 focus:ring-[#633194]/15 transition-all"
                                        placeholder="e.g. 10A"
                                        value={reserveFormData.class_grade}
                                        onChange={e => setReserveFormData({ ...reserveFormData, class_grade: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Class Teacher *</label>
                                    <input
                                        type="text" required
                                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-[#633194] focus:ring-2 focus:ring-[#633194]/15 transition-all"
                                        placeholder="e.g. Mr. Smith"
                                        value={reserveFormData.class_teacher}
                                        onChange={e => setReserveFormData({ ...reserveFormData, class_teacher: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Date pickers — portal-based, never clipped by modal */}
                            <DateTimePicker
                                label="Reservation Start *"
                                mode="datetime"
                                value={reserveFormData.reserve_start_time ?? ''}
                                onChange={v => setReserveFormData(f => ({ ...f, reserve_start_time: v }))}
                                placeholder="Pick start date & time"
                                required
                            />
                            <DateTimePicker
                                label="Reservation End *"
                                mode="datetime"
                                value={reserveFormData.reserve_end_time ?? ''}
                                onChange={v => setReserveFormData(f => ({ ...f, reserve_end_time: v }))}
                                placeholder="Pick end date & time"
                                required
                            />

                            <div className="flex gap-3 pt-2 border-t border-gray-100">
                                <button type="button" onClick={closeReserveModal}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                                    Cancel
                                </button>
                                <button type="submit"
                                    disabled={reserveMutation.isPending || !reserveFormData.reserve_start_time || !reserveFormData.reserve_end_time || !reserveFormData.reserve_student_name}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                                    {reserveMutation.isPending ? 'Reserving…' : 'Confirm Reservation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Return Modal ──────────────────────────────────────────────── */}
            {isReturnModalOpen && returningItem && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100">
                        <div className="px-6 py-4 flex items-center justify-between"
                             style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <ArrowPathRoundedSquareIcon className="h-5 w-5" /> Return Equipment
                                </h3>
                                <p className="text-white/75 text-xs mt-0.5">{returningItem.item_name}</p>
                            </div>
                            <button onClick={closeReturnModal} className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleReturnSubmit} className="p-6 space-y-5">
                            <div className="bg-[#F4F0FF] border border-purple-200 rounded-xl p-4 text-xs space-y-1">
                                <p className="text-gray-600"><span className="font-bold text-[#633194]">Borrower:</span> {returningItem.reserve_student_name}</p>
                                <p className="text-gray-600"><span className="font-bold text-[#633194]">Class:</span> Grade {returningItem.class_grade} · {returningItem.class_teacher}</p>
                                <p className="text-gray-600"><span className="font-bold text-[#633194]">Reserved:</span> {new Date(returningItem.reserve_start_time).toLocaleString()}</p>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Return Condition *</p>
                                <div className="grid grid-cols-5 gap-2">
                                    {CONDITIONS.map(c => {
                                        const cfg = CONDITION_CONFIG[c];
                                        return (
                                            <button
                                                key={c} type="button"
                                                onClick={() => setReturnCondition(c)}
                                                className={clsx(
                                                    'py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center',
                                                    returnCondition === c
                                                        ? `${cfg.bg} ${cfg.text} ${cfg.border} shadow-sm scale-105`
                                                        : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300'
                                                )}
                                            >
                                                {c}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    ℹ️ The inventory condition will be updated to match the return condition.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2 border-t border-gray-100">
                                <button type="button" onClick={closeReturnModal}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                                    Cancel
                                </button>
                                <button type="submit"
                                    disabled={returnReservedMutation.isPending}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                                    {returnReservedMutation.isPending ? 'Processing…' : 'Confirm Return'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
