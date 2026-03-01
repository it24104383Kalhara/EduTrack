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
  grade?: number;
  section?: string;
  grade_part?: string;
  stream?: string;
  created_at?: string;
  assigned_at?: string;
}

export interface Mark {
  id?: number;
  student_id?: number;
  subject_id?: string | number;
  studentId?: number;
  subjectId?: string | number;
  marks?: number;
  marks_obtained?: number;
  maxMarks?: number;
  total_marks?: number;
  examType?: string;
  exam_type?: string;
  date?: string;
  exam_date?: string;
  grade?: number;
  section?: string;
  createdAt?: Date;
  created_at?: string;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  type: '6-11' | '12-13';
  grades: string[];
  description?: string;
  created_at?: string;
}

export interface Stream {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
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
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

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
    await apiRequest('/grades', {
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

// ============================================================================
// MARK API SERVICE
// ============================================================================
export const markApi = {
  // Get all marks
  async getAll(): Promise<Mark[]> {
    const response = await apiRequest<Mark[]>('/marks');
    return response.data;
  },

  // Get mark by ID
  async getById(id: number): Promise<Mark | null> {
    try {
      const response = await apiRequest<Mark>(`/marks/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  },

  // Create new mark
  async create(markData: Omit<Mark, 'id' | 'createdAt'>): Promise<Mark> {
    const response = await apiRequest<Mark>('/marks', {
      method: 'POST',
      body: JSON.stringify(markData),
    });
    return response.data;
  },

  // Update mark
  async update(id: number, markData: Partial<Mark>): Promise<Mark> {
    const response = await apiRequest<Mark>(`/marks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(markData),
    });
    return response.data;
  },

  // Delete mark
  async delete(id: number): Promise<boolean> {
    await apiRequest(`/marks/${id}`, {
      method: 'DELETE',
    });
    return true;
  },

  // Clear all marks
  async clearAll(): Promise<boolean> {
    await apiRequest('/marks', {
      method: 'DELETE',
    });
    return true;
  },
};

// ============================================================================
// SUBJECT API SERVICE
// ============================================================================
export const subjectApi = {
  // Get all subjects
  async getAll(): Promise<Subject[]> {
    const response = await apiRequest<Subject[]>('/subjects');
    return response.data;
  },

  // Get subject by ID
  async getById(id: number): Promise<Subject | null> {
    try {
      const response = await apiRequest<Subject>(`/subjects/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  },

  // Create new subject
  async create(subjectData: Omit<Subject, 'id' | 'created_at'>): Promise<Subject> {
    const response = await apiRequest<Subject>('/subjects', {
      method: 'POST',
      body: JSON.stringify(subjectData),
    });
    return response.data;
  },

  // Update subject
  async update(id: number, subjectData: Partial<Subject>): Promise<Subject> {
    const response = await apiRequest<Subject>(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subjectData),
    });
    return response.data;
  },

  // Delete subject
  async delete(id: number): Promise<boolean> {
    await apiRequest(`/subjects/${id}`, {
      method: 'DELETE',
    });
    return true;
  },
};

// ============================================================================
// STREAM API SERVICE
// ============================================================================
export const streamApi = {
  // Get all streams
  async getAll(): Promise<Stream[]> {
    const response = await apiRequest<Stream[]>('/streams');
    return response.data;
  },

  // Get stream by ID
  async getById(id: number): Promise<Stream | null> {
    try {
      const response = await apiRequest<Stream>(`/streams/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  },

  // Create new stream
  async create(streamData: Omit<Stream, 'id' | 'created_at'>): Promise<Stream> {
    const response = await apiRequest<Stream>('/streams', {
      method: 'POST',
      body: JSON.stringify(streamData),
    });
    return response.data;
  },

  // Update stream
  async update(id: number, streamData: Partial<Stream>): Promise<Stream> {
    const response = await apiRequest<Stream>(`/streams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(streamData),
    });
    return response.data;
  },

  // Delete stream
  async delete(id: number): Promise<boolean> {
    await apiRequest(`/streams/${id}`, {
      method: 'DELETE',
    });
    return true;
  },
};

export default { gradeApi, studentApi, markApi, subjectApi, streamApi };
