import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { activityService, membershipService, studentService } from '../../services/api';
import { useAuth } from '../../utils/auth';
import { useState } from 'react';
import ArrowLeftIcon from '@heroicons/react/24/outline/ArrowLeftIcon';
import UserPlusIcon from '@heroicons/react/24/outline/UserPlusIcon';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import UserIcon from '@heroicons/react/24/outline/UserIcon';
import MagnifyingGlassIcon from '@heroicons/react/24/outline/MagnifyingGlassIcon';
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon';
import CheckCircleIcon from '@heroicons/react/24/solid/CheckCircleIcon';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

const ROLE_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
    Captain: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    'Vice-Captain': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    Secretary: { bg: 'bg-[#F4F0FF]', text: 'text-[#633194]', border: 'border-purple-200' },
    Member: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
};

export default function ActivityMembersPage() {
    const { id } = useParams<{ id: string }>();
    const activityId = parseInt(id || '0');
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, membershipId: number | null, studentName: string}>({ isOpen: false, membershipId: null, studentName: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<{ id: number, name: string, grade: string, classTeacherName?: string } | null>(null);
    const [formData, setFormData] = useState({ student_id: '', role: 'Member' });

    const { data: searchResults, isLoading: isSearchLoading } = useQuery({
        queryKey: ['studentsSearch', searchQuery],
        queryFn: () => studentService.search(searchQuery),
        enabled: searchQuery.length > 0,
    });

    const { data: activity, isLoading: isActivityLoading } = useQuery({
        queryKey: ['activities', activityId],
        queryFn: async () => {
            const all = await activityService.getAll();
            return all.find(a => a.id === activityId);
        },
        enabled: !!activityId,
    });

    const { data: members, isLoading: isMembersLoading } = useQuery({
        queryKey: ['members', activityId],
        queryFn: () => membershipService.getMembers(activityId),
        enabled: !!activityId,
    });

    const registerMutation = useMutation({
        mutationFn: membershipService.register,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members', activityId] });
            setIsModalOpen(false);
            setFormData({ student_id: '', role: 'Member' });
            setSearchQuery('');
            setSelectedStudent(null);
        },
        onError: (error: any) => {
            alert('Failed to register student: ' + (error.response?.data?.error || error.message));
        },
    });

    const removeMutation = useMutation({
        mutationFn: membershipService.remove,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members', activityId] });
        },
        onError: (err: any) => {
            alert('Failed to remove student: ' + (err.response?.data?.error || err.message));
        }
    });

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        const studentIdToReg = selectedStudent ? selectedStudent.id : parseInt(formData.student_id);
        if (!studentIdToReg) { alert('Please select or enter a student ID'); return; }
        registerMutation.mutate({
            student_id: studentIdToReg,
            student_name: selectedStudent?.name,
            activity_id: activityId,
            role: formData.role,
            grade: selectedStudent?.grade,
            class_teacher_name: selectedStudent?.classTeacherName,
        } as any);
    };

    const confirmRemove = () => {
        if (deleteModal.membershipId) {
            removeMutation.mutate(deleteModal.membershipId, {
                onSuccess: () => setDeleteModal({ isOpen: false, membershipId: null, studentName: '' }),
            });
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSearchQuery('');
        setSelectedStudent(null);
        setFormData({ student_id: '', role: 'Member' });
    };

    if (isActivityLoading || isMembersLoading) return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-[#633194]/20 border-t-[#633194] animate-spin" />
            <p className="text-sm text-gray-500">Loading members…</p>
        </div>
    );
    if (!activity) return (
        <div className="flex items-center justify-center h-48">
            <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg border border-red-200">Activity not found</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/sports/activities')}
                        className="p-2 rounded-xl hover:bg-[#F4F0FF] text-gray-400 hover:text-[#633194] transition-all"
                        title="Back to Activities"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{activity.name}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {members?.length ?? 0} member{members?.length !== 1 ? 's' : ''} registered
                        </p>
                    </div>
                </div>

                {(user?.role === 'Admin' || user?.role === 'Coach') && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                        style={{ background: 'linear-gradient(135deg, #633194 0%, #9b59b6 100%)' }}
                    >
                        <UserPlusIcon className="h-4 w-4" />
                        Register Student
                    </button>
                )}
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Members</h2>
                    {members && members.length > 0 && (
                        <span className="text-xs font-bold bg-[#F4F0FF] text-[#633194] px-2.5 py-1 rounded-full">
                            {members.length} total
                        </span>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Grade &amp; Teacher</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                                {(user?.role === 'Admin' || user?.role === 'Coach') && (
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {members && members.length > 0 ? (
                                members.map((member: any, idx: number) => {
                                    const roleCfg = ROLE_CONFIG[member.role] ?? ROLE_CONFIG['Member'];
                                    const letter = member.student_name?.charAt(0) ?? String.fromCharCode(65 + (idx % 26));
                                    return (
                                        <tr key={member.id} className="hover:bg-[#F4F0FF]/30 transition-colors group">
                                            {/* Student Name + Avatar */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#633194] to-[#9b59b6] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                        {letter}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800 group-hover:text-[#633194] transition-colors">
                                                            {member.student_name || `Student #${member.student_id}`}
                                                        </p>
                                                        <p className="text-xs text-gray-400">ID #{member.student_id}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Role Badge */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${roleCfg.bg} ${roleCfg.text} ${roleCfg.border}`}>
                                                    {member.role.replace('_', ' ')}
                                                </span>
                                            </td>

                                            {/* Grade & Teacher */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm font-medium text-gray-700">{member.grade || '—'}</p>
                                                <p className="text-xs text-gray-400">{member.class_teacher_name || '—'}</p>
                                            </td>

                                            {/* Joined Date */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>

                                            {/* Remove Action */}
                                            {(user?.role === 'Admin' || user?.role === 'Coach') && (
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteModal({ isOpen: true, membershipId: member.id, studentName: member.student_name || `Student #${member.student_id}` }); }}
                                                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all z-10 relative"
                                                        title="Remove student"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-14 w-14 rounded-2xl bg-[#F4F0FF] flex items-center justify-center">
                                                <UserIcon className="h-7 w-7 text-[#633194]" />
                                            </div>
                                            <p className="text-gray-600 font-semibold">No members yet</p>
                                            <p className="text-xs text-gray-400">Use the Register Student button to add students.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ===== Register Student Modal ===== */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
                        {/* Modal Header */}
                        <div
                            className="px-6 py-4 flex items-center justify-between"
                            style={{ background: 'linear-gradient(135deg, #633194 0%, #9b59b6 100%)' }}
                        >
                            <div className="flex items-center gap-2">
                                <UserPlusIcon className="h-5 w-5 text-white" />
                                <h2 className="text-base font-bold text-white">Register Student</h2>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleRegister} className="p-6 space-y-5">
                            {/* Student Search / Selection */}
                            {!selectedStudent ? (
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                        Search Student by Name or ID
                                    </label>
                                    <div className="relative">
                                        <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                        {isSearchLoading && (
                                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                                                <div className="w-4 h-4 border-2 border-[#633194]/20 border-t-[#633194] rounded-full animate-spin" />
                                            </div>
                                        )}
                                        <input
                                            type="text"
                                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-[#633194] focus:ring-2 focus:ring-[#633194]/15 transition-all"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Type student name to search…"
                                            autoFocus
                                        />

                                        {/* Dropdown Results */}
                                        {searchResults && searchResults.length > 0 && searchQuery.length > 0 && (
                                            <div className="absolute z-20 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                                                {searchResults.map(student => (
                                                    <div
                                                        key={student.id}
                                                        onClick={() => {
                                                            setSelectedStudent(student);
                                                            setFormData({ ...formData, student_id: student.id.toString() });
                                                            setSearchQuery('');
                                                        }}
                                                        className="px-4 py-3 hover:bg-[#F4F0FF] cursor-pointer flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                                                    >
                                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#633194] to-[#9b59b6] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                            {student.name?.charAt(0) ?? '#'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-sm text-gray-800 truncate">{student.name}</p>
                                                            <p className="text-xs text-gray-500">ID #{student.id} · Grade {student.grade} · {student.classTeacherName || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {searchResults && searchResults.length === 0 && searchQuery.length > 0 && !isSearchLoading && (
                                            <div className="absolute z-20 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-md p-4 text-center text-sm text-gray-500">
                                                No students found matching "<strong>{searchQuery}</strong>"
                                            </div>
                                        )}
                                    </div>

                                    {/* Manual ID fallback */}
                                    <div className="mt-4">
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                            Or enter Student ID manually
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-[#633194] focus:ring-2 focus:ring-[#633194]/15 transition-all"
                                            value={formData.student_id}
                                            onChange={e => setFormData({ ...formData, student_id: e.target.value })}
                                            placeholder="e.g. 1042"
                                        />
                                    </div>
                                </div>
                            ) : (
                                /* Selected Student Card */
                                <div className="bg-[#F4F0FF] border border-purple-200 rounded-xl p-4 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#633194] to-[#9b59b6] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                            {selectedStudent.name?.charAt(0) ?? '?'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <CheckCircleIcon className="h-3.5 w-3.5 text-[#633194]" />
                                                <span className="text-xs font-bold text-[#633194] uppercase tracking-wider">Selected</span>
                                            </div>
                                            <p className="text-sm font-bold text-gray-800">{selectedStudent.name}</p>
                                            <p className="text-xs text-gray-500">ID #{selectedStudent.id} · Grade {selectedStudent.grade}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedStudent(null);
                                            setFormData({ ...formData, student_id: '' });
                                        }}
                                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-purple-200 text-[#633194] hover:bg-[#633194] hover:text-white transition-all"
                                    >
                                        Change
                                    </button>
                                </div>
                            )}

                            {/* Role Selector */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                    Activity Role
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Member', 'Captain', 'Vice-Captain', 'Secretary'].map(r => {
                                        const cfg = ROLE_CONFIG[r] ?? ROLE_CONFIG['Member'];
                                        return (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, role: r })}
                                                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${formData.role === r
                                                    ? `${cfg.bg} ${cfg.text} ${cfg.border} shadow-sm`
                                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                {r.replace('-', ' ')}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={registerMutation.isPending}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg, #633194 0%, #9b59b6 100%)' }}
                                >
                                    {registerMutation.isPending ? 'Registering…' : 'Complete Registration'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                title="Remove Student"
                message={`Are you sure you want to remove ${deleteModal.studentName} from ${activity?.name || 'this activity'}?`}
                confirmText="Remove"
                onConfirm={confirmRemove}
                onCancel={() => setDeleteModal({ isOpen: false, membershipId: null, studentName: '' })}
                isLoading={removeMutation.isPending}
            />
        </div>
    );
}
