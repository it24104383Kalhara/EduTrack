// ============================================================================
// API SERVICE
// ============================================================================
// Version: 1.0.0 | Production Ready
// Author: EduTrack Development Team
// Description: Centralized API service for backend communication
// ============================================================================

const API_BASE_URL = 'http://localhost:5000/api';

// ============================================================================
// INTERFACES
// ============================================================================
export interface Grade {
  id: number;
  grade: number;
  grade_part: string;
  created_at?: string;
  updated_at?: string;
  students?: Student[];
}

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  religion: string;
  ethnicity: string;
  address: string;
  nationality: string;
  parent_type: 'father' | 'mother' | 'guardian';
  parent_name: string;
  parent_phone: string;
  parent_address: string;
  parent_gender: 'male' | 'female' | 'other';
  parent_email?: string;
  parent_religion: string;
  parent_ethnicity: string;
  parent_nationality: string;
  created_at?: string;
  updated_at?: string;
  assigned_at?: string; // Added for grade assignment tracking
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  count?: number;
  timestamp: string;
  endpoint: string;
}

// ============================================================================
// API HELPER FUNCTIONS
// ============================================================================
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('🔵 [API_REQUEST]:', { method: options.method, url, endpoint });
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    console.log('🟢 [API_RESPONSE]:', { status: response.status, ok: response.ok, data });

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('🔴 [API_REQUEST_ERROR]:', error);
    throw error;
  }
}

// ============================================================================
// GRADE API SERVICE
// ============================================================================
export const gradeApi = {
  // Get all grades
  async getAll(): Promise<Grade[]> {
    const response = await apiRequest<Grade[]>('/grades');
    return response.data;
  },

  // Get grade by ID
  async getById(id: number): Promise<Grade | null> {
    try {
      const response = await apiRequest<Grade>(`/grades/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  },

  // Create new grade
  async create(gradeData: Omit<Grade, 'id' | 'created_at' | 'students'>): Promise<Grade> {
    const response = await apiRequest<Grade>('/grades/create', {
      method: 'POST',
      body: JSON.stringify(gradeData),
    });
    return response.data;
  },

  // Update grade
  async update(id: number, gradeData: Partial<Grade>): Promise<Grade> {
    const response = await apiRequest<Grade>(`/grades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(gradeData),
    });
    return response.data;
  },

  // Delete grade
  async delete(id: number): Promise<boolean> {
    await apiRequest(`/grades/${id}`, {
      method: 'DELETE',
    });
    return true;
  },

  // Clear all grades
  async clearAll(): Promise<boolean> {
    await apiRequest('/grades/clear', {
      method: 'DELETE',
    });
    return true;
  },

  // Assign student to grade
  async assignStudent(gradeId: number, studentId: number): Promise<boolean> {
    await apiRequest(`/grades/${gradeId}/assign-student/${studentId}`, {
      method: 'POST',
    });
    return true;
  },

  // Remove student from grade
  async removeStudent(gradeId: number, studentId: number): Promise<boolean> {
    await apiRequest(`/grades/${gradeId}/remove-student/${studentId}`, {
      method: 'DELETE',
    });
    return true;
  },

  // Get all student assignments with details
  async getAllAssignments(): Promise<any[]> {
    const response = await apiRequest<any[]>('/grades/assignments');
    return response.data;
  },

  // Get assignments for a specific grade
  async getAssignmentsByGrade(gradeId: number): Promise<any[]> {
    const response = await apiRequest<any[]>(`/grades/${gradeId}/assignments`);
    return response.data;
  },
};

// ============================================================================
// STUDENT API SERVICE
// ============================================================================
export const studentApi = {
  // Get all students
  async getAll(): Promise<Student[]> {
    const response = await apiRequest<Student[]>('/students');
    return response.data;
  },

  // Get student by ID
  async getById(id: number): Promise<Student | null> {
    try {
      const response = await apiRequest<Student>(`/students/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  },

  // Register new student
  async create(studentData: Omit<Student, 'id' | 'created_at'>): Promise<Student> {
    const response = await apiRequest<Student>('/students/register', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
    return response.data;
  },

  // Update student
  async update(id: number, studentData: Partial<Student>): Promise<Student> {
    const response = await apiRequest<Student>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
    return response.data;
  },

  // Delete student
  async delete(id: number): Promise<boolean> {
    await apiRequest(`/students/${id}`, {
      method: 'DELETE',
    });
    return true;
  },
};

export default { gradeApi, studentApi };
