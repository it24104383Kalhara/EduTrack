import pool from '../config/database';
import { EmailService } from '../services/EmailService';
import { MARKS_QUERIES } from './DatabaseQueries';

export interface Mark {
  id?: number;
  student_id: number;
  subject_id: number;
  grade_id: number;
  term: string;
  exam_type: 'mid_term' | 'final_term' | 'assignment' | 'quiz' | 'practical';
  marks_obtained: number | string; // Allow number for marks, string for "AB"
  max_marks: number;
  percentage?: number; // Add percentage property (calculated in database)
  grade_obtained: 'A' | 'B' | 'C' | 'S' | 'F' | 'AB'; // Include "AB" for absent
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
  parent_name?: string;
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

export class MarksModel {

  private static completionChecksInProgress = new Set<string>();

  static async create(mark: Omit<Mark, 'id' | 'percentage' | 'grade_obtained' | 'created_at' | 'updated_at'>): Promise<Mark> {
    const values = [
      mark.student_id,
      mark.subject_id,
      mark.grade_id,
      mark.term,
      mark.exam_type,
      mark.marks_obtained,
      mark.max_marks,
      mark.remarks ?? null,
      mark.exam_date,
      mark.created_by ?? null
    ];

    try {
      const result = await pool.execute(MARKS_QUERIES.CREATE, values);
      const insertedId = (result as any).insertId;
      
      if (!insertedId) {
        const existingMark = await this.findByUniqueKey(mark.student_id, mark.subject_id, mark.grade_id, mark.term, mark.exam_type);
        if (existingMark) {
          return existingMark;
        }
        throw new Error('Failed to get inserted ID and no existing record found');
      }
      
      this.triggerCompletionCheck(mark.student_id, mark.grade_id, mark.term, mark.exam_type);
      
      const createdMark = await this.findById(insertedId);
      if (!createdMark) {
        throw new Error('Failed to retrieve created mark');
      }
      
      return createdMark;
    } catch (error: any) {
      console.error('❌ Error creating mark:', error);
      
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        const existingMark = await this.findByUniqueKey(mark.student_id, mark.subject_id, mark.grade_id, mark.term, mark.exam_type);
        if (existingMark) {
          const updated = await this.update(existingMark.id!, {
            marks_obtained: mark.marks_obtained,
            max_marks: mark.max_marks,
            remarks: mark.remarks,
            exam_date: mark.exam_date,
            created_by: mark.created_by
          });
          if (updated) return updated;
        }
      }
      
      throw error;
    }
  }

  static async findByUniqueKey(studentId: number, subjectId: number, gradeId: number, term: string, examType: string): Promise<Mark | null> {
    try {
      const [rows] = await pool.execute(MARKS_QUERIES.FIND_BY_UNIQUE_KEY, [studentId, subjectId, gradeId, term.trim(), examType.trim()]) as [Mark[], any];
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('❌ Error finding mark by unique key:', error);
      throw error;
    }
  }

  static async findById(id: number): Promise<Mark | null> {
    try {
      const [rows] = await pool.execute(MARKS_QUERIES.FIND_BY_ID, [id]) as [Mark[], any];
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('❌ Error finding mark by ID:', error);
      throw error;
    }
  }

  static async findByStudentGradeTerm(studentId: number, gradeId: number, term: string): Promise<MarkWithDetails[]> {
    try {
      const [rows] = await pool.execute(MARKS_QUERIES.FIND_DETAILS_BY_STUDENT_GRADE_TERM, [studentId, gradeId, term]) as [MarkWithDetails[], any];
      return rows;
    } catch (error) {
      console.error('❌ Error finding marks by student, grade, and term:', error);
      throw error;
    }
  }

  static async findByGradeSubjectTerm(gradeId: number, subjectId: number, term: string): Promise<MarkWithDetails[]> {
    try {
      const [rows] = await pool.execute(MARKS_QUERIES.FIND_DETAILS_BY_GRADE_SUBJECT_TERM, [gradeId, subjectId, term]) as [MarkWithDetails[], any];
      return rows;
    } catch (error) {
      console.error('❌ Error finding marks by grade, subject, and term:', error);
      throw error;
    }
  }

  static async findByGradeTerm(gradeId: number, term: string): Promise<MarkWithDetails[]> {
    try {
      const [rows] = await pool.execute(MARKS_QUERIES.FIND_DETAILS_BY_GRADE_TERM, [gradeId, term]) as [MarkWithDetails[], any];
      return rows;
    } catch (error) {
      console.error('❌ Error finding marks by grade and term:', error);
      throw error;
    }
  }

  static async update(id: number, updates: Partial<Omit<Mark, 'id' | 'percentage' | 'grade_obtained' | 'created_at' | 'updated_at'>>): Promise<Mark | null> {
    const oldMark = await this.findById(id);
    const updateFields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'percentage' && key !== 'grade_obtained') {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    const setClause = updateFields.join(', ');
    values.push(id);

    try {
      await pool.execute(MARKS_QUERIES.UPDATE(setClause), values);
      const updatedMark = await this.findById(id);
      
      if (updatedMark) {
        // Rely purely on the smart fingerprint deduplication in EmailService.
        // It will detect naturally if the specific failed marks actually changed.
        this.triggerCompletionCheck(updatedMark.student_id, updatedMark.grade_id, updatedMark.term, updatedMark.exam_type, false);
      }
      
      return updatedMark;
    } catch (error) {
      console.error('❌ Error updating mark:', error);
      throw error;
    }
  }

  static async delete(id: number): Promise<boolean> {
    try {
      const [result] = await pool.execute(MARKS_QUERIES.DELETE, [id]) as [any, any];
      return result.affectedRows > 0;
    } catch (error) {
      console.error('❌ Error deleting mark:', error);
      throw error;
    }
  }

  static async calculateStudentResult(studentId: number, gradeId: number, term: string): Promise<StudentResult | null> {
    try {
      const [rows] = await pool.execute(MARKS_QUERIES.CALCULATE_STUDENT_RESULT, [studentId, gradeId, term]) as [any[], any];
      
      if (rows.length === 0) return null;

      const row = rows[0];
      const subject_marks = row.subject_marks_data.split(';').map((data: string) => {
        const [subject_name, subject_code, marks_obtained, max_marks, percentage, grade_obtained, exam_type] = data.split('|');
        return {
          subject_name,
          subject_code,
          marks_obtained: marks_obtained === 'AB' ? 'AB' : parseFloat(marks_obtained),
          max_marks: parseFloat(max_marks),
          percentage: percentage === 'AB' ? 'AB' : parseFloat(percentage),
          grade_obtained,
          exam_type
        };
      });

      let overall_grade: 'A' | 'B' | 'C' | 'S' | 'F';
      const percentage = row.overall_percentage;
      
      if (percentage >= 75) overall_grade = 'A';
      else if (percentage >= 65) overall_grade = 'B';
      else if (percentage >= 55) overall_grade = 'C';
      else if (percentage >= 40) overall_grade = 'S';
      else overall_grade = 'F';

      return {
        student_id: row.student_id,
        student_name: row.student_name,
        grade_name: row.grade_name,
        term: row.term,
        total_marks_obtained: row.total_marks_obtained,
        total_max_marks: row.total_max_marks,
        overall_percentage: row.overall_percentage,
        overall_grade,
        result: row.result,
        subject_marks
      };
    } catch (error) {
      console.error('❌ Error calculating student result:', error);
      throw error;
    }
  }

  static async getLowMarks(threshold: number = 40): Promise<MarkWithDetails[]> {
    try {
      const [rows] = await pool.execute(MARKS_QUERIES.GET_LOW_MARKS, [threshold]) as [MarkWithDetails[], any];
      return rows;
    } catch (error) {
      console.error('❌ Error getting low marks:', error);
      throw error;
    }
  }

  static async getGradeStatistics(gradeId: number, term: string): Promise<any> {
    try {
      const [rows] = await pool.execute(MARKS_QUERIES.GET_GRADE_STATISTICS, [gradeId, term]) as [any[], any];
      return rows[0] || {};
    } catch (error) {
      console.error('❌ Error getting grade statistics:', error);
      throw error;
    }
  }

  static async getAllGradesPerformance(term: string, teacherId?: number): Promise<{ grade_name: string, average_percentage: number }[]> {
    try {
      let query = MARKS_QUERIES.GET_ALL_GRADES_PERFORMANCE;
      let params: any[] = [term];

      if (teacherId) {
        query = `
          SELECT 
            CONCAT(g.grade, '-', g.grade_part) as grade_name,
            AVG(CAST(m.percentage AS DECIMAL(10,2))) as average_percentage
          FROM marks m
          JOIN grades g ON m.grade_id = g.id
          WHERE m.term = ? AND m.marks_obtained != 'AB' AND g.teacher_id = ?
          GROUP BY g.id, g.grade, g.grade_part
          ORDER BY g.grade ASC, g.grade_part ASC
        `;
        params.push(teacherId);
      }

      const [rows] = await pool.execute(query, params) as [any[], any];
      return rows.map(row => ({
        grade_name: row.grade_name,
        average_percentage: parseFloat(row.average_percentage) || 0
      }));
    } catch (error) {
      console.error('❌ Error getting all grades performance:', error);
      throw error;
    }
  }

  static async sendBulkConsolidatedReports(gradeId: number, term: string, examType: string): Promise<void> {
    try {
      const emailService = new EmailService();
      
      // Get all unique student IDs who have marks in this grade/term
      const [rows] = await pool.execute(
        'SELECT DISTINCT student_id FROM marks WHERE grade_id = ? AND term = ? AND exam_type = ?',
        [gradeId, term, examType]
      ) as [any[], any];
      
      for (const row of rows) {
        await emailService.sendConsolidatedLowMarksAlert(row.student_id, gradeId, term, examType, true);
      }
    } catch (error) {
      console.error('❌ Error sending bulk consolidated reports:', error);
      throw error;
    }
  }

  private static triggerCompletionCheck(studentId: number, gradeId: number, term: string, examType: string, force: boolean = false): void {
    const key = `${studentId}|${gradeId}|${term}|${examType}`;
    if (this.completionChecksInProgress.has(key)) return;
    this.completionChecksInProgress.add(key);

    // Increase throttle window to 2000ms to ensure all marks in a bulk save are processed
    // before sending the consolidated alert.
    setTimeout(async () => {
      this.completionChecksInProgress.delete(key);
      try {
        await this.checkTermCompletionAndAlert(studentId, gradeId, term, examType, force);
      } catch (error) {
        console.error(`⚠️ Failed to trigger completion check for student ${studentId}:`, error);
      }
    }, 2000);
  }

  static async checkTermCompletionAndAlert(studentId: number, gradeId: number, term: string, examType: string, force: boolean = false): Promise<void> {
    try {
      const [gradeRows] = await pool.execute(MARKS_QUERIES.FIND_GRADE_NUMERIC, [gradeId]) as [any[], any];
      if (gradeRows.length === 0) return;
      const gradeLevel = gradeRows[0].grade.toString();

      const [subjectRows] = await pool.execute(MARKS_QUERIES.COUNT_SUBJECTS_FOR_GRADE, [JSON.stringify(gradeLevel)]) as [any[], any];
      const totalSubjects = parseInt(subjectRows[0]?.total ?? 0);

      const [markRows] = await pool.execute(MARKS_QUERIES.COUNT_ENTERED_MARKS, [studentId, gradeId, term, examType]) as [any[], any];
      const enteredSubjects = parseInt(markRows[0]?.entered ?? 0);

      console.log(`📊 Student ${studentId}: ${enteredSubjects}/${totalSubjects} subjects entered for ${term} (${examType}). Evaluating for low marks alerts...`);

      const emailService = new EmailService();
      await emailService.sendConsolidatedLowMarksAlert(studentId, gradeId, term, examType, force);
    } catch (error) {
      console.error('❌ Error in checkTermCompletionAndAlert:', error);
    }
  }

  static async checkAndSendLowMarkAlert(markId: number, force: boolean = false): Promise<{
    alertSent: boolean;
    emailLog?: any;
    error?: string;
  }> {
    try {
      const emailService = new EmailService();
      return await emailService.checkAndSendLowMarkAlert(markId, force);
    } catch (error) {
      console.error('❌ Error in checkAndSendLowMarkAlert:', error);
      return {
        alertSent: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
