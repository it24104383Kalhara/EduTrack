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

export interface Attendance {
  id?: number;
  grade_id: number;
  grade: number;
  section: string;
  student_id: number;
  student_name: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  marked_by?: string;
  marked_at?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceSummary {
  grade_id: number;
  grade: number;
  section: string;
  date: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  not_marked_count: number;
  attendance_percentage: number;
}

export interface AttendanceReport {
  student_id: number;
  student_name: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  attendance_percentage: number;
}

export interface AttendanceMark {
  id?: number;
  student_id: number;
  student_name: string;
  grade: number;
  section: string;
  status: 'present' | 'absent' | 'late';
  marked_date: string;
  marked_time: string;
  updated_date?: string;
  updated_time?: string;
  marked_by?: string;
  created_at?: string;
  updated_at?: string;
  first_name?: string;
  last_name?: string;
  parent_phone?: string;
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

// ============================================================================
// ATTENDANCE API SERVICE
// ============================================================================
export const attendanceApi = {
  // Mark attendance for multiple students
  async markAttendance(data: {
    grade_id: number;
    date: string;
    attendance_data: Array<{
      student_id: number;
      student_name: string;
      status: 'present' | 'absent' | 'late';
      notes?: string;
    }>;
    marked_by?: string;
  }): Promise<{
    grade_id: number;
    date: string;
    marked_students: number;
    summary: AttendanceSummary;
  }> {
    const response = await apiRequest<any>('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Get attendance by grade and date
  async getByGradeAndDate(gradeId: number, date: string): Promise<{
    grade: {
      id: number;
      grade: number;
      grade_part: string;
    };
    date: string;
    summary: AttendanceSummary;
    attendance: (Attendance & {
      first_name: string;
      last_name: string;
      parent_phone: string;
    })[];
  }> {
    const response = await apiRequest<any>(`/attendance/grade/${gradeId}/date/${date}`);
    return response.data;
  },

  // Get attendance dates for grade
  async getDates(gradeId: number): Promise<string[]> {
    const response = await apiRequest<{ grade: any; dates: string[] }>(`/attendance/grade/${gradeId}/dates`);
    return response.data.dates;
  },

  // Get student attendance report
  async getStudentReport(
    studentId: number,
    startDate?: string,
    endDate?: string
  ): Promise<{
    student_id: number;
    date_range: {
      start_date: string | null;
      end_date: string | null;
    };
    report: AttendanceReport;
  }> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const url = `/attendance/student/${studentId}/report${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiRequest<any>(url);
    return response.data;
  },

  // Get grade attendance report
  async getGradeReport(
    gradeId: number,
    startDate?: string,
    endDate?: string
  ): Promise<{
    grade: {
      id: number;
      grade: number;
      grade_part: string;
    };
    date_range: {
      start_date: string | null;
      end_date: string | null;
    };
    report: AttendanceReport[];
  }> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const url = `/attendance/grade/${gradeId}/report${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiRequest<any>(url);
    return response.data;
  },

  // Delete attendance records
  async deleteAttendance(gradeId: number, date: string): Promise<{
    grade_id: number;
    date: string;
    deleted_at: string;
  }> {
    const response = await apiRequest<any>(`/attendance/grade/${gradeId}/date/${date}`, {
      method: 'DELETE',
    });
    return response.data;
  },

  // Get attendance statistics
  async getStatistics(): Promise<{
    totalRecords: number;
    todayRecords: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
    averageAttendance: number;
  }> {
    const response = await apiRequest<any>('/attendance/statistics');
    return response.data;
  },
};

// ============================================================================
// ATTENDANCE MARK API SERVICE
// ============================================================================
export const attendanceMarkApi = {
  // Mark attendance for a student
  async markAttendance(data: {
    student_id: number;
    student_name: string;
    grade: number;
    section: string;
    status: 'present' | 'absent' | 'late';
    marked_date?: string;
    marked_time?: string;
    marked_by?: string;
  }): Promise<AttendanceMark> {
    const response = await apiRequest<AttendanceMark>('/attendance-mark/mark', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Bulk mark attendance for multiple students
  async bulkMarkAttendance(data: {
    attendance_records: Array<{
      student_id: number;
      student_name: string;
      grade: number;
      section: string;
      status: 'present' | 'absent' | 'late';
      marked_date?: string;
      marked_time?: string;
      marked_by?: string;
    }>;
  }): Promise<{ marked_students: number }> {
    const response = await apiRequest<{ marked_students: number }>('/attendance-mark/bulk-mark', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Get attendance by grade, section, and date
  async getByGradeSectionDate(grade: number, section: string, date: string): Promise<{
    grade: number;
    section: string;
    date: string;
    summary: {
      total_students: number;
      present_count: number;
      absent_count: number;
      late_count: number;
      attendance_percentage: number;
    };
    attendance: AttendanceMark[];
  }> {
    const response = await apiRequest<any>(`/attendance-mark/grade/${grade}/section/${section}/date/${date}`);
    return response.data;
  },

  // Get student attendance records
  async getStudentAttendance(studentId: number): Promise<{
    student_id: number;
    attendance: AttendanceMark[];
  }> {
    const response = await apiRequest<any>(`/attendance-mark/student/${studentId}`);
    return response.data;
  },

  // Get all attendance records
  async getAllAttendance(startDate?: string, endDate?: string): Promise<{
    date_range: { start_date: string | null; end_date: string | null } | null;
    attendance: AttendanceMark[];
  }> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const url = `/attendance-mark/all${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiRequest<any>(url);
    return response.data;
  },

  // Update attendance status
  async updateAttendanceStatus(
    studentId: number,
    date: string,
    status: 'present' | 'absent' | 'late',
    markedBy?: string
  ): Promise<AttendanceMark> {
    const response = await apiRequest<AttendanceMark>(`/attendance-mark/update/${studentId}/${date}`, {
      method: 'PUT',
      body: JSON.stringify({ status, marked_by: markedBy }),
    });
    return response.data;
  },

  // Delete attendance record
  async deleteAttendance(studentId: number, date: string): Promise<{
    student_id: number;
    date: string;
    deleted_at: string;
  }> {
    const response = await apiRequest<any>(`/attendance-mark/${studentId}/${date}`, {
      method: 'DELETE',
    });
    return response.data;
  },

  // Get attendance statistics
  async getStatistics(): Promise<{
    totalRecords: number;
    todayRecords: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
  }> {
    const response = await apiRequest<any>('/attendance-mark/statistics');
    return response.data;
  },
};

export default { gradeApi, studentApi, attendanceApi, attendanceMarkApi };
