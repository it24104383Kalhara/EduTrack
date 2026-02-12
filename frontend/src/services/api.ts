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

export const activityService = {
    getAll: async () => {
        const response = await api.get<Activity[]>('/activities');
        return response.data;
    },

    create: async (data: Omit<Activity, 'id'>) => {
        const response = await api.post<Activity>('/activities', data);
        return response.data;
    },

    delete: async (id: number) => {
        await api.delete(`/activities/${id}`);
    }
};

export default api;
