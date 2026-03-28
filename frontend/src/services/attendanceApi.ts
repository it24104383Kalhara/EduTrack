// ============================================================================
// ATTENDANCE API SERVICE
// ============================================================================
// Version: 1.0.0 | Production Ready
// Author: EduTrack Development Team
// Description: API service for attendance management operations
// ============================================================================

import axios from 'axios';

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// ATTENDANCE INTERFACES
// ============================================================================
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

export interface AttendanceData {
  student_id: number;
  student_name: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}

export interface MarkAttendanceRequest {
  grade_id: number;
  date: string;
  attendance_data: AttendanceData[];
  marked_by?: string;
}

export interface GradeAttendanceResponse {
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

export interface AttendanceDatesResponse {
  grade: {
    id: number;
    grade: number;
    grade_part: string;
  };
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

export interface AttendanceStatistics {
  totalRecords: number;
  todayRecords: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  averageAttendance: number;
}

// ============================================================================
// ATTENDANCE API CLASS
// ============================================================================
export class AttendanceApi {
  
  // ============================================================================
  // MARK ATTENDANCE FOR MULTIPLE STUDENTS
  // ============================================================================
  static async markAttendance(request: MarkAttendanceRequest): Promise<{
    grade_id: number;
    date: string;
    marked_students: number;
    summary: AttendanceSummary;
  }> {
    try {
      const response = await api.post('/attendance/mark', request);
      return response.data.data;
    } catch (error) {
      console.error('🔴 [ATTENDANCE_MARK_ERROR]:', error);
      throw new Error('Failed to mark attendance');
    }
  }

  // ============================================================================
  // GET ATTENDANCE BY GRADE AND DATE
  // ============================================================================
  static async getAttendanceByGradeAndDate(gradeId: number, date: string): Promise<GradeAttendanceResponse> {
    try {
      const response = await api.get(`/attendance/grade/${gradeId}/date/${date}`);
      return response.data.data;
    } catch (error) {
      console.error('🔴 [ATTENDANCE_GET_GRADE_DATE_ERROR]:', error);
      throw new Error('Failed to get attendance by grade and date');
    }
  }

  // ============================================================================
  // GET ATTENDANCE DATES FOR GRADE
  // ============================================================================
  static async getAttendanceDates(gradeId: number): Promise<string[]> {
    try {
      const response = await api.get(`/attendance/grade/${gradeId}/dates`);
      return response.data.data.dates;
    } catch (error) {
      console.error('🔴 [ATTENDANCE_GET_DATES_ERROR]:', error);
      throw new Error('Failed to get attendance dates');
    }
  }

  // ============================================================================
  // GET STUDENT ATTENDANCE REPORT
  // ============================================================================
  static async getStudentAttendanceReport(
    studentId: number, 
    startDate?: string, 
    endDate?: string
  ): Promise<StudentReportResponse> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const url = `/attendance/student/${studentId}/report${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      return response.data.data;
    } catch (error) {
      console.error('🔴 [ATTENDANCE_STUDENT_REPORT_ERROR]:', error);
      throw new Error('Failed to get student attendance report');
    }
  }

  // ============================================================================
  // GET GRADE ATTENDANCE REPORT
  // ============================================================================
  static async getGradeAttendanceReport(
    gradeId: number, 
    startDate?: string, 
    endDate?: string
  ): Promise<GradeReportResponse> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const url = `/attendance/grade/${gradeId}/report${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      return response.data.data;
    } catch (error) {
      console.error('🔴 [ATTENDANCE_GRADE_REPORT_ERROR]:', error);
      throw new Error('Failed to get grade attendance report');
    }
  }

  // ============================================================================
  // DELETE ATTENDANCE RECORDS
  // ============================================================================
  static async deleteAttendance(gradeId: number, date: string): Promise<{
    grade_id: number;
    date: string;
    deleted_at: string;
  }> {
    try {
      const response = await api.delete(`/attendance/grade/${gradeId}/date/${date}`);
      return response.data.data;
    } catch (error) {
      console.error('🔴 [ATTENDANCE_DELETE_ERROR]:', error);
      throw new Error('Failed to delete attendance records');
    }
  }

  // ============================================================================
  // GET ATTENDANCE STATISTICS
  // ============================================================================
  static async getStatistics(): Promise<AttendanceStatistics> {
    try {
      const response = await api.get('/attendance/statistics');
      return response.data.data;
    } catch (error) {
      console.error('🔴 [ATTENDANCE_STATISTICS_ERROR]:', error);
      throw new Error('Failed to get attendance statistics');
    }
  }

  // ============================================================================
  // HELPER: GET TODAY'S DATE IN YYYY-MM-DD FORMAT
  // ============================================================================
  static getTodayDate(): string {
    return new Date().toLocaleDateString('en-CA');
  }

  // ============================================================================
  // HELPER: FORMAT DATE FOR DISPLAY
  // ============================================================================
  static formatDateForDisplay(date: string): string {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // ============================================================================
  // HELPER: VALIDATE DATE FORMAT
  // ============================================================================
  static isValidDateFormat(date: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(date);
  }

  // ============================================================================
  // HELPER: GET DATE RANGE FOR REPORTS
  // ============================================================================
  static getDateRange(period: 'week' | 'month' | 'term'): { start_date: string; end_date: string } {
    const today = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'term':
        startDate.setMonth(today.getMonth() - 3);
        break;
    }

    return {
      start_date: startDate.toLocaleDateString('en-CA'),
      end_date: today.toLocaleDateString('en-CA')
    };
  }
}

export default AttendanceApi;
