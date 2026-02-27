import axios from 'axios';

const API_URL = 'http://localhost:5000/api/sports';

// Create axios instance with auth interceptor
const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        config.headers['x-user-id'] = user.id;
        config.headers['x-user-role'] = user.role;
        config.headers['x-user-name'] = user.name;
    }
    return config;
});

export interface Activity {
    id: number;
    name: string;
    type: 'Sport' | 'Club' | 'Society';
    in_charge_staff_id?: number;
    description?: string;
}

export interface Member {
    id: number;
    student_id: number;
    name?: string;
    role: 'Member' | 'Captain' | 'Vice_Captain' | 'Secretary';
    joined_at: string;
}

export interface PracticeSession {
    id: number;
    activity_id: number;
    coach_id: number;
    start_time: string;
    end_time: string;
    location_id?: number;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Excused' | 'Late';

export interface AttendanceRecord {
    id: number;
    session_id: number;
    student_id: number;
    status: AttendanceStatus;
    recorded_at?: string;
}

export const activityService = {
    getAll: async () => {
        const response = await api.get<Activity[]>('/activities');
        return response.data;
    },

    getById: async (id: number) => {
        // We might not have a specific 'get one' endpoint, or allow filtering.
        // For now, let's assume we can fetch all and find, or implement filter. 
        // Based on routes, we might need GET /activities/:id or filter list.
        // Let's assume GET /activities/:id exists for now, or fetch list.
        // Actually, route was `router.get('/', ...)` and `router.post('/', ...)` 
        // Let's rely on list for now or check backend.
        // If not, we might have to filter locally or add backend route. 
        // Let's use list and find locally for this demo if needed.
        // Or better, let's implement get members which is separate.
        const response = await api.get<Activity[]>('/activities'); // Simplified
        return response.data.find(a => a.id === id);
    },

    create: async (data: Omit<Activity, 'id'>) => {
        const response = await api.post<Activity>('/activities', data);
        return response.data;
    },

    delete: async (id: number) => {
        await api.delete(`/activities/${id}`);
    }
};

export const membershipService = {
    getMembers: async (activityId: number) => {
        const response = await api.get<Member[]>(`/memberships/activity/${activityId}`);
        return response.data;
    },

    register: async (data: { student_id: number; activity_id: number; role: string }) => {
        const response = await api.post('/memberships/register', data);
        return response.data;
    },

    remove: async (membershipId: number) => {
        await api.delete(`/memberships/${membershipId}`); // Assuming an ID-based delete or by composite key?
        // Route was: router.delete('/:id', ...) which likely deletes the membership record.
    }
};

export const studentService = {
    search: async (query: string) => {
        const response = await api.get<{ id: number; name: string; grade: string }[]>(`/students/search`, { params: { q: query } });
        return response.data;
    }
};

export const attendanceService = {
    getSessions: async (activityId?: number) => {
        const response = await api.get<PracticeSession[]>('/attendance/sessions', { params: { activity_id: activityId } });
        return response.data;
    },
    createSession: async (data: Omit<PracticeSession, 'id'>) => {
        const response = await api.post<PracticeSession>('/attendance/sessions', data);
        return response.data;
    },
    deleteSession: async (id: number) => {
        await api.delete(`/attendance/sessions/${id}`);
    },
    getSessionAttendance: async (sessionId: number) => {
        const response = await api.get<AttendanceRecord[]>(`/attendance/session/${sessionId}`);
        return response.data;
    },
    bulkMark: async (session_id: number, attendances: { student_id: number; status: AttendanceStatus }[]) => {
        const response = await api.post('/attendance/mark-bulk', { session_id, attendances });
        return response.data;
    },
    mark: async (session_id: number, student_id: number, status: AttendanceStatus) => {
        const response = await api.post('/attendance/mark', { session_id, student_id, status });
        return response.data;
    },
};

export default api;
