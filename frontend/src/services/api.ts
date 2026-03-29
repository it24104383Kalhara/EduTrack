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

// Response interceptor to handle auth failures and backend down
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle connection errors (backend down) or 401 Unauthorized
        const isNetworkError = !error.response && error.code !== 'ERR_CANCELED';
        const isUnauthorized = error.response?.status === 401;

        if (isNetworkError || isUnauthorized) {
            // Only clear and redirect if we're not on the landing page or login page
            const publicPaths = ['/', '/login'];
            const isPublicRoute = publicPaths.includes(window.location.pathname);
            
            if (!isPublicRoute) {
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

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

export interface AttendanceReport {
    id: number;
    activity_id: number;
    activity_name?: string;
    coach_id: number;
    report_date: string;
    total_students: number;
    present_count: number;
    absent_count: number;
    late_count: number;
    excused_count: number;
    notes?: string;
    report_details?: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    submitted_at: string;
    reviewed_at?: string | null;
    reviewed_by?: number | null;
}

export interface TeacherNotification {
    id: number;
    report_id: number;
    teacher_id: number;
    message: string;
    status: 'Unread' | 'Read' | 'Actioned';
    sent_at: string;
    report_date?: string;
    activity_name?: string;
    present_count?: number;
    absent_count?: number;
    total_students?: number;
}

export interface InventoryItem {
    id?: number;
    name: string;
    category?: string;
    total_quantity: number;
    available_quantity: number;
    condition: 'New' | 'Good' | 'Fair' | 'Poor' | 'Broken';
    last_updated?: string;
}

export interface InventoryLog {
    id?: number;
    item_id: number;
    borrowed_by_id: number;
    borrowed_at?: string;
    returned_at?: string | null;
    status: 'Borrowed' | 'Returned' | 'Lost' | 'Damaged';
}

export interface InventoryReserved {
    id?: number;
    item_id: number;
    reserve_student_name: string;
    class_teacher: string;
    class_grade: string;
    reserve_start_time: string;
    reserve_end_time: string;
    reserved_at?: string;
    returned_at?: string | null;
    return_condition?: 'New' | 'Good' | 'Fair' | 'Poor' | 'Broken' | null;
    status: 'Reserved' | 'Returned' | 'Cancelled';
    item_name?: string;
    quantity?: number;
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
        const response = await api.get<{ id: number; name: string; grade: string; classTeacherName?: string }[]>(`/students/search`, { params: { q: query } });
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

export const reportService = {
    generate: async (data: { activity_id: number; report_date: string; notes?: string }) => {
        const response = await api.post<AttendanceReport>('/reports', data);
        return response.data;
    },
    getAll: async (params?: { status?: string; coach_id?: number; activity_id?: number }) => {
        const response = await api.get<AttendanceReport[]>('/reports', { params });
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get<AttendanceReport>(`/reports/${id}`);
        return response.data;
    },
    review: async (id: number, status: 'Approved' | 'Rejected') => {
        const response = await api.put(`/reports/${id}/review`, { status });
        return response.data;
    },
    notifyTeacher: async (id: number, teacher_id: number, message: string) => {
        const response = await api.post(`/reports/${id}/notify-teacher`, { teacher_id, message });
        return response.data;
    },
    getMyNotifications: async () => {
        const response = await api.get<TeacherNotification[]>('/reports/notifications/mine');
        return response.data;
    },
    actionNotification: async (id: number) => {
        const response = await api.put(`/reports/notifications/${id}/action`);
        return response.data;
    },
};

export const inventoryService = {
    getAll: async () => {
        const response = await api.get<InventoryItem[]>('/inventory');
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get<InventoryItem>(`/inventory/${id}`);
        return response.data;
    },
    create: async (data: Omit<InventoryItem, 'id' | 'available_quantity'>) => {
        const response = await api.post<InventoryItem>('/inventory', data);
        return response.data;
    },
    update: async (id: number, data: Partial<InventoryItem>) => {
        const response = await api.put(`/inventory/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        await api.delete(`/inventory/${id}`);
    },
    borrow: async (item_id: number, borrowed_by_id: number) => {
        const response = await api.post('/inventory/borrow', { item_id, borrowed_by_id });
        return response.data;
    },
    returnItem: async (log_id: number, status: 'Returned' | 'Lost' | 'Damaged' = 'Returned') => {
        const response = await api.put(`/inventory/return/${log_id}`, { status });
        return response.data;
    },
    getHistory: async (item_id?: number, user_id?: number) => {
        const response = await api.get<InventoryLog[]>('/inventory/history', { params: { item_id, user_id } });
        return response.data;
    },
    // Reserved operations
    getReservedItems: async () => {
        const response = await api.get<InventoryReserved[]>('/inventory/reserved/items');
        return response.data;
    },
    reserveItem: async (data: Omit<InventoryReserved, 'id' | 'reserved_at' | 'returned_at' | 'return_condition' | 'status' | 'item_name'>) => {
        const response = await api.post('/inventory/reserved/items', data);
        return response.data;
    },
    returnReservedItem: async (log_id: number, status: 'Returned' | 'Cancelled', return_condition?: 'New' | 'Good' | 'Fair' | 'Poor' | 'Broken') => {
        const response = await api.put(`/inventory/reserved/return/${log_id}`, { status, return_condition });
        return response.data;
    }
};

export interface Match {
    id?: number;
    activity_id: number;
    date: string;
    opponent: string;
    result: 'Won' | 'Lost' | 'Draw' | 'Participation';
    level: 'School' | 'Zonal' | 'District' | 'Provincial' | 'National';
    score_team?: number;
    score_opponent?: number;
    location?: string;
    notes?: string;
}

export interface LeaderboardEntry {
    student_id: number;
    student_name: string;
    activity_name: string;
    total_points: number;
    member_role: string;
}

export interface TimeSeriesPoint {
    period_label: string;
    total_points: number;
    student_count: number;
}

export const achievementService = {
    getMatches: async (activityId?: number) => {
        const response = await api.get<Match[]>('/achievements/matches', { params: { activity_id: activityId } });
        return response.data;
    },
    createMatch: async (data: Omit<Match, 'id'> & { participants: number[] }) => {
        const response = await api.post('/achievements/matches', data);
        return response.data;
    },
    updateMatch: async (id: number, data: Partial<Match> & { participants?: number[] }) => {
        const response = await api.put(`/achievements/matches/${id}`, data);
        return response.data;
    },
    deleteMatch: async (id: number) => {
        await api.delete(`/achievements/matches/${id}`);
    },
    getMatchParticipants: async (matchId: number): Promise<number[]> => {
        const response = await api.get<number[]>(`/achievements/matches/${matchId}/participants`);
        return response.data;
    },
    getLeaderboard: async (activityId?: number) => {
        const response = await api.get<LeaderboardEntry[]>('/achievements/leaderboard', { params: { activity_id: activityId } });
        return response.data;
    },
    getTimeSeries: async (activityId?: number, period: 'weekly' | 'monthly' | 'yearly' = 'monthly') => {
        const response = await api.get<TimeSeriesPoint[]>('/achievements/analytics/timeseries', { params: { activity_id: activityId, period } });
        return response.data;
    },
    getStudentCV: async (studentId: number, activityId?: number) => {
        const response = await api.get(`/achievements/cv/${studentId}`, { params: { activity_id: activityId } });
        return response.data;
    },
    recalcAttendance: async (studentId: number, activityId: number) => {
        const response = await api.post('/achievements/achievements/recalc-attendance', { student_id: studentId, activity_id: activityId });
        return response.data;
    },
};

export default api;
