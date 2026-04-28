// ============================================================================
// API SERVICE
// ============================================================================
// Version: 1.0.0 | Production Ready
// Author: EduTrack Development Team
// Description: Centralized API service for backend communication
// ============================================================================

export const API_BASE_URL = 'http://localhost:5005/api';

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
}

export interface StudentAssignment {
  grade: Grade;
  student: Student;
  assigned_at: string;
}

export interface AttendanceMarkResponse {
  grade_id: number;
  date: string;
  marked_students: number;
  summary: AttendanceSummary;
}

export interface AttendanceByGradeResponse {
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
}

export interface AttendanceStatistics {
  total_students: number;
  present_today: number;
  absent_today: number;
  average_attendance: number;
}

export interface GradeDatesResponse {
  grade: Grade;
  dates: string[];
}

export interface StudentReportResponse {
  student_id: number;
  date_range: {
    start_date: string | null;
    end_date: string | null;
  };
  report: AttendanceReport;
}

export interface GradeReportResponse {
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
}

export interface DeleteAttendanceResponse {
  grade_id: number;
  date: string;
  deleted_at: string;
}

export interface StatisticsResponse {
  totalRecords: number;
  todayRecords: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  averageAttendance: number;
}

export interface AttendanceMarkResponse {
  grade: number;
  section: string;
  date: string;
  total_students: number;
  attendance_percentage: number;
  attendance: AttendanceMark[];
}

export interface StudentAttendanceResponse {
  student_id: number;
  attendance: AttendanceMark[];
}

export interface AllAttendanceResponse {
  date_range: { start_date: string | null; end_date: string | null } | null;
  attendance: AttendanceMark[];
}

export interface DeleteAttendanceMarkResponse {
  student_id: number;
  date: string;
  deleted_at: string;
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

export interface Subject {
  id: number;
  name: string;
  code: string;
  grades: string | string[];
  stream?: string | string[];
  type: '6-11' | '12-13';
  category?: string;
  is_optional?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StudentSubject {
  id?: number;
  student_id: number;
  subject_id: number;
  grade_id: number;
  assigned_at?: string;
  subject_name?: string;
  subject_code?: string;
  category?: string;
  is_optional?: boolean;
}

export interface Mark {
  id?: number;
  student_id: number;
  subject_id: number;
  grade_id: number;
  term: string;
  exam_type: 'mid_term' | 'final_term' | 'assignment' | 'quiz' | 'practical';
  marks_obtained: number | string; // Allow number for marks, string for "AB"
  max_marks: number;
  grade_obtained?: 'A' | 'B' | 'C' | 'S' | 'F'; // Make optional - backend calculates this
  remarks?: string;
  exam_date: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MarkWithDetails extends Mark {
  student_name: string;
  subject_name: string;
  subject_code: string;
  grade_name: string;
  parent_email?: string;
}

export interface StudentResult {
  student_id: number;
  student_name: string;
  grade_name: string;
  term: string;
  total_marks_obtained: number;
  total_max_marks: number;
  overall_percentage: number;
  overall_grade: 'A' | 'B' | 'C' | 'S' | 'F';
  result: 'PASS' | 'FAIL';
  subject_marks: Array<{
    subject_name: string;
    subject_code: string;
    marks_obtained: number;
    max_marks: number;
    percentage: number;
    grade_obtained: string;
    exam_type: string;
  }>;
  created_at?: string;
}

export interface RecentActivity {
  type: 'Student' | 'Grade' | 'Subject' | 'Attendance' | 'Mark';
  description: string;
  timestamp: string;
  time: string;
  date: string;
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
    console.log('🔵 [API_REQUEST]:', { method: options.method || 'GET', url, endpoint });

    // Debug: Log the exact body being sent
    if (options.body) {
      console.log('📤 [API_REQUEST_BODY]:', options.body);
      if (typeof options.body === 'string') {
        const parsedBody = JSON.parse(options.body);
        console.log('📤 [API_REQUEST_PARSED]:', parsedBody);
        console.log('📤 [API_REQUEST_MARKS_OBTAINED]:', parsedBody.marks_obtained);
      }
    }

    const token = localStorage.getItem('edutrack_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });


    const data = await response.json();
    console.log('🟢 [API_RESPONSE]:', { status: response.status, ok: response.ok, data });

    if (!response.ok) {
      // Extract specific validation errors if present
      const errorDetails = data.errors ? data.errors.map((e: any) => e.message).join(', ') : (data.error || '');
      const errorMessage = errorDetails ? `${data.message}: ${errorDetails}` : (data.message || `HTTP error! status: ${response.status}`);
      throw new Error(errorMessage);
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
  async getAllAssignments(): Promise<StudentAssignment[]> {
    const response = await apiRequest<StudentAssignment[]>('/grades/assignments');
    return response.data;
  },

  // Get assignments for a specific grade
  async getAssignmentsByGrade(gradeId: number): Promise<StudentAssignment[]> {
    const response = await apiRequest<StudentAssignment[]>(`/grades/${gradeId}/assignments`);
    return response.data;
  },

  // Transfer student between grades and move records
  async transferStudent(studentId: number, oldGradeId: number, newGradeId: number): Promise<boolean> {
    const response = await apiRequest<any>('/grades/transfer-student', {
      method: 'POST',
      body: JSON.stringify({ studentId, oldGradeId, newGradeId }),
    });
    return !!response.success;
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
    const response = await apiRequest<AttendanceMarkResponse>('/attendance/mark', {
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
    const response = await apiRequest<AttendanceByGradeResponse>(`/attendance/grade/${gradeId}/date/${date}`);
    return response.data;
  },

  // Get attendance dates for grade
  async getDates(gradeId: number): Promise<string[]> {
    const response = await apiRequest<GradeDatesResponse>(`/attendance/grade/${gradeId}/dates`);
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
    const response = await apiRequest<StudentReportResponse>(url);
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
    const response = await apiRequest<GradeReportResponse>(url);
    return response.data;
  },

  // Delete attendance records
  async deleteAttendance(gradeId: number, date: string): Promise<{
    grade_id: number;
    date: string;
    deleted_at: string;
  }> {
    const response = await apiRequest<DeleteAttendanceResponse>(`/attendance/grade/${gradeId}/date/${date}`, {
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
    const response = await apiRequest<StatisticsResponse>('/attendance/statistics');
    return response.data;
  },

  // Get weekly attendance trends
  async getWeeklyTrends(): Promise<{ day: string; attendance_percentage: number; date: string }[]> {
    const response = await apiRequest<{ day: string; attendance_percentage: number; date: string }[]>('/attendance/weekly-trends');
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
    const response = await apiRequest<AttendanceMarkResponse>(`/attendance-mark/grade/${grade}/section/${section}/date/${date}`);
    return response.data;
  },

  // Get student attendance records
  async getStudentAttendance(studentId: number): Promise<{
    student_id: number;
    attendance: AttendanceMark[];
  }> {
    const response = await apiRequest<StudentAttendanceResponse>(`/attendance-mark/student/${studentId}`);
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
    const response = await apiRequest<AllAttendanceResponse>(url);
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
    const response = await apiRequest<DeleteAttendanceMarkResponse>(`/attendance-mark/${studentId}/${date}`, {
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
    const response = await apiRequest<StatisticsResponse>('/attendance-mark/statistics');
    return response.data;
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
  async create(subjectData: Omit<Subject, 'id' | 'created_at' | 'updated_at'>): Promise<Subject> {
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

  // Get subjects by type
  async getByType(type: '6-11' | '12-13'): Promise<Subject[]> {
    const response = await apiRequest<Subject[]>(`/subjects/type/${type}`);
    return response.data;
  },

  // Get subjects assigned to a student
  async getStudentSubjects(studentId: number, gradeId: number): Promise<StudentSubject[]> {
    const response = await apiRequest<StudentSubject[]>(`/subjects/student/${studentId}/grade/${gradeId}`);
    return response.data;
  },

  // Assign subjects to a student
  async assignStudentSubjects(studentId: number, gradeId: number, subjectIds: number[]): Promise<boolean> {
    await apiRequest('/subjects/student-assignment', {
      method: 'POST',
      body: JSON.stringify({ studentId, gradeId, subjectIds }),
    });
    return true;
  },

  // Get students enrolled in a subject
  async getSubjectEnrollment(subjectId: number, gradeId: number): Promise<any[]> {
    const response = await apiRequest<any[]>(`/subjects/subject-enrollment/${subjectId}/grade/${gradeId}`);
    return response.data;
  },

  // Bulk assign students to a subject
  async bulkEnrollStudents(subjectId: number, gradeId: number, studentIds: number[]): Promise<boolean> {
    await apiRequest('/subjects/bulk-student-assignment', {
      method: 'POST',
      body: JSON.stringify({ subjectId, gradeId, studentIds }),
    });
    return true;
  },
};

// ============================================================================
// MARKS API SERVICE
// ============================================================================
export const marksApi = {
  // Create new mark
  async create(markData: Omit<Mark, 'id' | 'grade_obtained' | 'created_at' | 'updated_at'>): Promise<Mark> {
    const response = await apiRequest<Mark>('/marks', {
      method: 'POST',
      body: JSON.stringify(markData),
    });
    return response.data;
  },

  // Bulk create marks
  async bulkCreate(marksData: Array<Omit<Mark, 'id' | 'grade_obtained' | 'created_at' | 'updated_at'>>): Promise<{
    created: Mark[];
    errors: Array<{
      student_id: number;
      subject_id: number;
      error: string;
    }>;
  }> {
    const response = await apiRequest<{
      created: Mark[];
      errors: Array<{
        student_id: number;
        subject_id: number;
        error: string;
      }>;
    }>('/marks/bulk', {
      method: 'POST',
      body: JSON.stringify({ marks_data: marksData }),
    });
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

  // Get marks by student, grade, and term
  async getByStudentGradeTerm(studentId: number, gradeId: number, term: string): Promise<MarkWithDetails[]> {
    const response = await apiRequest<MarkWithDetails[]>(`/marks/student/${studentId}/grade/${gradeId}/term/${term}`);
    return response.data;
  },

  // Get marks by grade, subject, and term
  async getByGradeSubjectTerm(gradeId: number, subjectId: number, term: string): Promise<MarkWithDetails[]> {
    const response = await apiRequest<MarkWithDetails[]>(`/marks/grade/${gradeId}/subject/${subjectId}/term/${term}`);
    return response.data;
  },

  // Get all marks by grade and term
  async getByGradeTerm(gradeId: number, term: string): Promise<MarkWithDetails[]> {
    const response = await apiRequest<MarkWithDetails[]>(`/marks/grade/${gradeId}/term/${term}`);
    return response.data;
  },

  // Update mark
  async update(id: number, updates: Partial<Mark>): Promise<Mark | null> {
    try {
      const response = await apiRequest<Mark>(`/marks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return response.data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  },

  // Delete mark
  async delete(id: number): Promise<boolean> {
    await apiRequest(`/marks/${id}`, {
      method: 'DELETE',
    });
    return true;
  },

  // Send bulk consolidated low mark reports for an entire grade and term
  async sendTermReports(gradeId: number, term: string): Promise<boolean> {
    const response = await apiRequest(`/marks/grade/${gradeId}/term/${term}/send-reports`, {
      method: 'POST',
      body: JSON.stringify({ examType: 'final_term' }),
    });
    return response.success;
  },

  // Calculate student result
  async calculateStudentResult(studentId: number, gradeId: number, term: string): Promise<StudentResult> {
    const response = await apiRequest<StudentResult>(`/marks/result/student/${studentId}/grade/${gradeId}/term/${term}`);
    return response.data;
  },

  // Get low marks (below threshold)
  async getLowMarks(threshold: number = 40): Promise<MarkWithDetails[]> {
    const response = await apiRequest<MarkWithDetails[]>(`/marks/low-marks/threshold/${threshold}`);
    return response.data;
  },

  // Get grade statistics
  async getGradeStatistics(gradeId: number, term: string): Promise<{
    total_students: number;
    passed_students: number;
    failed_students: number;
    average_percentage: number;
    highest_percentage: number;
    lowest_percentage: number;
    a_plus_count: number;
    a_count: number;
    b_plus_count: number;
    b_count: number;
    c_plus_count: number;
    c_count: number;
    d_count: number;
    f_count: number;
  }> {
    const response = await apiRequest<any>(`/marks/statistics/grade/${gradeId}/term/${term}`);
    return response.data;
  },

  // Get all grades performance statistics
  async getAllGradesPerformance(term: string): Promise<{ grade_name: string, average_percentage: number }[]> {
    const response = await apiRequest<{ grade_name: string, average_percentage: number }[]>(`/marks/statistics/all-grades/${term}`);
    return response.data;
  },
};

// Results API
export const resultsApi = {
  // Get merit list (class results with ranking)
  async getMeritList(gradeId: number, term: string): Promise<{
    student: Student;
    result: StudentResult;
    rank: number;
    class_average: number;
  }[]> {
    const response = await apiRequest<any>(`/results/merit/${gradeId}/term/${term}`);
    return response.data;
  },

  // Get individual student result with rank
  async getStudentResultWithRank(studentId: number, gradeId: number, term: string): Promise<{
    result: StudentResult;
    rank: number;
    total_students: number;
    class_average: number;
  }> {
    const response = await apiRequest<any>(`/results/student/${studentId}/grade/${gradeId}/term/${term}/ranked`);
    return response.data;
  }
};

// ============================================================================
// REPORT CARD API SERVICE
// ============================================================================
export const reportCardApi = {
  // Download report card PDF
  async downloadReportCard(studentId: number, gradeId: number, term: string): Promise<Blob> {
    const token = localStorage.getItem('edutrack_token');
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`
    };

    const response = await fetch(`${API_BASE_URL}/report-cards/student/${studentId}/grade/${gradeId}/term/${term}`, {
      headers
    });

    if (!response.ok) {
      throw new Error('Failed to download report card');
    }
    return await response.blob();
  }
};

// ============================================================================
// DASHBOARD API SERVICE
// ============================================================================
export const dashboardApi = {
  // Get recent system activity
  async getRecentActivity(): Promise<RecentActivity[]> {
    const response = await apiRequest<RecentActivity[]>('/dashboard/recent-activity');
    return response.data;
  },
};

// ============================================================================
// EMAIL ALERTS API SERVICE
// ============================================================================
export const emailAlertsApi = {
  // Get all email logs with pagination and filters
  async getLogs(params: {
    page?: number;
    limit?: number;
    status?: string;
    student_name?: string;
  } = {}): Promise<EmailLogResponse['data']> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params.student_name) queryParams.append('student_name', params.student_name);

    const url = `/email-alerts/logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest<EmailLogResponse['data']>(url);
    return response.data;
  },

  // Get email alert statistics
  async getStatistics(): Promise<any> {
    const response = await apiRequest<any>('/email-alerts/statistics');
    return response.data;
  },

  // Send email alerts for low marks in a specific grade and term
  async sendLowMarksAlerts(gradeId: number, term: string, threshold: number = 40): Promise<any> {
    const response = await apiRequest<any>('/email-alerts/send-low-marks', {
      method: 'POST',
      body: JSON.stringify({ gradeId, term, threshold }),
    });
    return response.data;
  }
};

interface EmailLogResponse {
  success: boolean;
  message: string;
  data: {
    logs: any[];
    pagination: {
      current_page: number;
      per_page: number;
      total: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
    statistics?: {
      total_sent: number;
      total_failed: number;
      success_rate: number;
      total_students: number;
      recent_activity: number;
    };
  };
}

export default {
  gradeApi,
  studentApi,
  subjectApi,
  attendanceApi,
  attendanceMarkApi,
  marksApi,
  resultsApi,
  reportCardApi,
  dashboardApi,
  emailAlertsApi
};

import axios from 'axios';

const API_URL = 'http://localhost:5005/api/sports';

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
        // Handle 401 Unauthorized only (not network errors - those are transient)
        const isUnauthorized = error.response?.status === 401;

        if (isUnauthorized) {
            // Only clear and redirect if we're on a sports route
            const isSportsRoute = window.location.pathname.startsWith('/sports');
            const isPublicRoute = ['/', '/login', '/sports/login'].includes(window.location.pathname);
            
            if (isSportsRoute && !isPublicRoute) {
                localStorage.removeItem('user');
                window.location.href = '/sports/login';
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

export const sportsApi = api;
