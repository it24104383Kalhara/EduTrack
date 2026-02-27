import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { activityService, membershipService, studentService } from '../../services/api';
import { useAuth } from '../../utils/auth';
import { useState } from 'react';
import ArrowLeftIcon from '@heroicons/react/24/outline/ArrowLeftIcon';
import UserPlusIcon from '@heroicons/react/24/outline/UserPlusIcon';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import UserIcon from '@heroicons/react/24/outline/UserIcon';

export default function ActivityMembersPage() {
    const { id } = useParams<{ id: string }>();
    const activityId = parseInt(id || '0');
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<{ id: number, name: string, grade: string } | null>(null);
    const [formData, setFormData] = useState({
        student_id: '',
        role: 'Member'
    });

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
        enabled: !!activityId
    });

    const { data: members, isLoading: isMembersLoading } = useQuery({
        queryKey: ['members', activityId],
        queryFn: () => membershipService.getMembers(activityId),
        enabled: !!activityId
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
        }
    });

    const removeMutation = useMutation({
        mutationFn: membershipService.remove,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members', activityId] });
        },
    });

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        const studentIdToReg = selectedStudent ? selectedStudent.id : parseInt(formData.student_id);
        if (!studentIdToReg) {
            alert("Please select or enter a student ID");
            return;
        }
        registerMutation.mutate({
            student_id: studentIdToReg,
            activity_id: activityId,
            role: formData.role
        });
    };

    const handleRemove = (membershipId: number) => {
        if (window.confirm('Are you sure you want to remove this student from the activity?')) {
            removeMutation.mutate(membershipId);
        }
    };

    if (isActivityLoading || isMembersLoading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
    if (!activity) return <div className="p-8 text-center text-red-500">Activity not found</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/sports/activities')}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{activity.name} - Members</h1>
                    <p className="text-sm text-gray-500">Manage students registered for this activity.</p>
                </div>
            </div>

            {/* Action Bar */}
            {(user?.role === 'Admin' || user?.role === 'Coach') && (
                <div className="flex justify-end">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-[#1a3b70] text-white px-4 py-2 rounded-lg hover:bg-[#11274a] transition shadow-sm font-medium"
                    >
                        <UserPlusIcon className="h-5 w-5" />
                        Register Student
                    </button>
                </div>
            )}

            {/* Members List */}
            <div className="bg-white rounded-lg border border-gray-100 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Student ID
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Joined Date
                            </th>
                            {(user?.role === 'Admin' || user?.role === 'Coach') && (
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {members && members.length > 0 ? (
                            members.map((member: any) => (
                                <tr key={member.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8 bg-blue-50 rounded-full flex items-center justify-center text-[#1a3b70]">
                                                <UserIcon className="h-4 w-4" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">Student #{member.student_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${member.role === 'Captain' ? 'bg-yellow-100 text-yellow-800' :
                                                member.role === 'Vice_Captain' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'}`}>
                                            {member.role.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(member.joined_at).toLocaleDateString()}
                                    </td>
                                    {(user?.role === 'Admin' || user?.role === 'Coach') && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleRemove(member.id)}
                                                className="text-[#e11d48] hover:text-red-800 transition-colors"
                                                title="Remove Student"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                    No members found for this activity.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Register Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)] w-full max-w-md overflow-hidden border border-gray-100">
                        <div className="px-6 py-4 border-b border-gray-100 bg-[#f8fafc] flex justify-between items-center">
                            <h2 className="text-lg font-bold text-[#1a3b70]">Register Student</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleRegister} className="p-6 space-y-4">
                            {!selectedStudent ? (
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Student by Name or ID</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border border-gray-300 shadow-sm focus:border-[#1a3b70] focus:ring-[#1a3b70] px-3 py-2 outline-none transition-colors"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Type to search..."
                                    />
                                    {isSearchLoading && <div className="absolute right-3 top-9 text-xs text-gray-400">Loading...</div>}

                                    {searchResults && searchResults.length > 0 && searchQuery.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                            {searchResults.map(student => (
                                                <div
                                                    key={student.id}
                                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                                                    onClick={() => {
                                                        setSelectedStudent(student);
                                                        setFormData({ ...formData, student_id: student.id.toString() });
                                                        setSearchQuery('');
                                                    }}
                                                >
                                                    <div>
                                                        <div className="font-medium text-gray-900">{student.name}</div>
                                                        <div className="text-xs text-gray-500">ID: {student.id} • Grade: {student.grade}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {searchResults && searchResults.length === 0 && searchQuery.length > 0 && !isSearchLoading && (
                                        <div className="absolute w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 text-center text-sm text-gray-500">
                                            No students found
                                        </div>
                                    )}
                                    <p className="mt-2 text-xs text-gray-400">Or manually enter below if unable to search:</p>
                                    <input
                                        type="number"
                                        className="w-full rounded-md border border-gray-300 shadow-sm focus:border-[#1a3b70] focus:ring-[#1a3b70] px-3 py-2 mt-1 outline-none transition-colors"
                                        value={formData.student_id}
                                        onChange={e => setFormData({ ...formData, student_id: e.target.value })}
                                        placeholder="Enter Student ID manually"
                                    />
                                </div>
                            ) : (
                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-md flex justify-between items-center">
                                    <div>
                                        <div className="text-xs text-[#10b981] font-bold uppercase tracking-wider mb-1">Student Selected</div>
                                        <div className="text-lg font-bold text-gray-900">{selectedStudent.name}</div>
                                        <div className="text-xs text-gray-600">ID: {selectedStudent.id} • Grade: {selectedStudent.grade}</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedStudent(null);
                                            setFormData({ ...formData, student_id: '' });
                                        }}
                                        className="text-xs bg-white px-3 py-1.5 rounded border border-emerald-200 text-[#10b981] font-medium hover:bg-emerald-100 transition-colors shadow-sm"
                                    >
                                        Change
                                    </button>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    className="w-full rounded-md border border-gray-300 shadow-sm focus:border-[#1a3b70] focus:ring-[#1a3b70] px-3 py-2 outline-none transition-colors"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="Member">Member</option>
                                    <option value="Captain">Captain</option>
                                    <option value="Vice_Captain">Vice Captain</option>
                                    <option value="Secretary">Secretary</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3 justify-end border-t border-gray-100 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 mt-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a3b70] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={registerMutation.isPending}
                                    className="px-4 py-2 mt-2 text-sm font-medium text-white bg-[#1a3b70] border border-transparent rounded-md hover:bg-[#11274a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a3b70] disabled:opacity-50 transition-colors"
                                >
                                    {registerMutation.isPending ? 'Registering...' : 'Complete Registration'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
