import { MarksModel, StudentResult } from '../models/Marks';

export interface ClassResult {
  grade_id: number;
  grade_name: string;
  term: string;
  total_students: number;
  passed_students: number;
  failed_students: number;
  pass_rate: number;
  average_percentage: number;
  highest_percentage: number;
  lowest_percentage: number;
  grade_distribution: {
    'A': number;
    'B': number;
    'C': number;
    'S': number;
    'F': number;
  };
  subject_averages: Array<{
    subject_name: string;
    subject_code: string;
    average_percentage: number;
    highest_marks: number;
    lowest_marks: number;
  }>;
  top_performers: Array<{
    student_id: number;
    student_name: string;
    overall_percentage: number;
    overall_grade: string;
    rank: number;
  }>;
  at_risk_students: Array<{
    student_id: number;
    student_name: string;
    overall_percentage: number;
    overall_grade: string;
    failed_subjects: string[];
  }>;
  generated_at: string;
}

export class ResultService {
  /**
   * Generate comprehensive class results for a grade and term
   */
  async generateClassResults(gradeId: number, term: string): Promise<ClassResult> {
    try {
      // Get grade statistics
      const statistics = await MarksModel.getGradeStatistics(gradeId, term);
      
      // Get all marks for this grade and term
      const allMarks = await MarksModel.findByGradeTerm(gradeId, term);
      
      // Calculate subject averages
      const subjectAverages = this.calculateSubjectAverages(allMarks);
      
      // Get top performers
      const topPerformers = await this.getTopPerformers(gradeId, term, 10);
      
      // Get at-risk students
      const atRiskStudents = await this.getAtRiskStudents(gradeId, term);
      
      // Calculate grade distribution
      const gradeDistribution = {
        'A': statistics.a_count || 0,
        'B': statistics.b_count || 0,
        'C': statistics.c_count || 0,
        'S': statistics.s_count || 0,
        'F': statistics.f_count || 0
      };

      // Calculate pass rate
      const passRate = statistics.total_students > 0 
        ? (statistics.passed_students / statistics.total_students) * 100 
        : 0;

      // Get grade name from first mark
      const gradeName = allMarks.length > 0 ? allMarks[0].grade_name : `Grade ${gradeId}`;

      const classResult: ClassResult = {
        grade_id: gradeId,
        grade_name: gradeName,
        term: term,
        total_students: statistics.total_students || 0,
        passed_students: statistics.passed_students || 0,
        failed_students: statistics.failed_students || 0,
        pass_rate: passRate,
        average_percentage: statistics.average_percentage || 0,
        highest_percentage: statistics.highest_percentage || 0,
        lowest_percentage: statistics.lowest_percentage || 0,
        grade_distribution: gradeDistribution,
        subject_averages: subjectAverages,
        top_performers: topPerformers,
        at_risk_students: atRiskStudents,
        generated_at: new Date().toISOString()
      };

      return classResult;
    } catch (error) {
      console.error('Error generating class results:', error);
      throw error;
    }
  }

  /**
   * Calculate subject averages from marks data
   */
  private calculateSubjectAverages(allMarks: any[]): Array<{
    subject_name: string;
    subject_code: string;
    average_percentage: number;
    highest_marks: number;
    lowest_marks: number;
  }> {
    const subjectMap = new Map();

    allMarks.forEach(mark => {
      const key = mark.subject_id;
      
      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          subject_name: mark.subject_name,
          subject_code: mark.subject_code,
          total_marks: 0,
          total_max_marks: 0,
          marks: [],
          count: 0
        });
      }

      const subject = subjectMap.get(key);
      subject.total_marks += mark.marks_obtained;
      subject.total_max_marks += mark.max_marks;
      subject.marks.push(mark.marks_obtained);
      subject.count++;
    });

    const subjectAverages = Array.from(subjectMap.values()).map(subject => ({
      subject_name: subject.subject_name,
      subject_code: subject.subject_code,
      average_percentage: subject.total_max_marks > 0 
        ? (subject.total_marks / subject.total_max_marks) * 100 
        : 0,
      highest_marks: Math.max(...subject.marks),
      lowest_marks: Math.min(...subject.marks)
    }));

    return subjectAverages.sort((a, b) => b.average_percentage - a.average_percentage);
  }

  /**
   * Get top performers for a grade and term
   */
  private async getTopPerformers(gradeId: number, term: string, limit: number): Promise<Array<{
    student_id: number;
    student_name: string;
    overall_percentage: number;
    overall_grade: string;
    total_marks_obtained?: number;
    total_max_marks?: number;
    rank: number;
  }>> {
    try {
      // Get all students in this grade
      const allMarks = await MarksModel.findByGradeTerm(gradeId, term);
      
      // Group marks by student
      const studentMap = new Map();

      allMarks.forEach(mark => {
        if (!studentMap.has(mark.student_id)) {
          studentMap.set(mark.student_id, {
            student_id: mark.student_id,
            student_name: mark.student_name,
            total_marks_obtained: 0,
            total_max_marks: 0,
            subjects: new Set()
          });
        }

        const student = studentMap.get(mark.student_id);
        const marksObtained = mark.marks_obtained === 'AB' ? 0 : Number(mark.marks_obtained);
        const maxMarks = Number(mark.max_marks || 100);

        student.total_marks_obtained += marksObtained;
        student.total_max_marks += maxMarks;
        student.subjects.add(mark.subject_id);
      });

      // Calculate percentages and grades
      const studentResults = Array.from(studentMap.values())
        .map(student => {
          const percentage = student.total_max_marks > 0 
            ? (student.total_marks_obtained / student.total_max_marks) * 100 
            : 0;
          
          const grade = this.calculateGrade(percentage);
          
          return {
            student_id: student.student_id,
            student_name: student.student_name,
            overall_percentage: percentage,
            overall_grade: grade,
            total_marks_obtained: student.total_marks_obtained,
            total_max_marks: student.total_max_marks,
            rank: 0, // Will be set after sorting
            subjects: student.subjects
          };
        })
        .sort((a, b) => b.overall_percentage - a.overall_percentage)
        .slice(0, limit);

      // Assign ranks
      studentResults.forEach((student, index) => {
        student.rank = index + 1;
      });

      return studentResults;
    } catch (error) {
      console.error('Error getting top performers:', error);
      return [];
    }
  }

  /**
   * Get at-risk students for a grade and term
   */
  private async getAtRiskStudents(gradeId: number, term: string): Promise<Array<{
    student_id: number;
    student_name: string;
    overall_percentage: number;
    overall_grade: string;
    failed_subjects: string[];
  }>> {
    try {
      // Get all students in this grade
      const allMarks = await MarksModel.findByGradeTerm(gradeId, term);
      
      // Group marks by student
      const studentMap = new Map();

      allMarks.forEach(mark => {
        if (!studentMap.has(mark.student_id)) {
          studentMap.set(mark.student_id, {
            student_id: mark.student_id,
            student_name: mark.student_name,
            total_marks_obtained: 0,
            total_max_marks: 0,
            failed_subjects: []
          });
        }

        const student = studentMap.get(mark.student_id);
        student.total_marks_obtained += mark.marks_obtained;
        student.total_max_marks += mark.max_marks;
        
        // Check if failed this subject (below 40%)
        if ((mark.percentage || 0) < 40) {
          student.failed_subjects.push(mark.subject_name);
        }
      });

      // Calculate percentages and filter at-risk students
      const atRiskStudents = Array.from(studentMap.values())
        .map(student => {
          const percentage = student.total_max_marks > 0 
            ? (student.total_marks_obtained / student.total_max_marks) * 100 
            : 0;
          
          const grade = this.calculateGrade(percentage);
          
          return {
            student_id: student.student_id,
            student_name: student.student_name,
            overall_percentage: percentage,
            overall_grade: grade,
            failed_subjects: student.failed_subjects
          };
        })
        .filter(student => 
          student.overall_percentage < 50 || 
          student.failed_subjects.length > 0 ||
          student.overall_grade === 'F'
        )
        .sort((a, b) => a.overall_percentage - b.overall_percentage);

      return atRiskStudents;
    } catch (error) {
      console.error('Error getting at-risk students:', error);
      return [];
    }
  }

  /**
   * Calculate grade based on percentage
   */
  private calculateGrade(percentage: number): string {
    if (percentage >= 75) return 'A';
    if (percentage >= 65) return 'B';
    if (percentage >= 55) return 'C';
    if (percentage >= 40) return 'S';
    return 'F';
  }

  /**
   * Generate individual student result card
   */
  async generateStudentResultCard(studentId: number, gradeId: number, term: string): Promise<StudentResult | null> {
    try {
      const result = await MarksModel.calculateStudentResult(studentId, gradeId, term);
      return result;
    } catch (error) {
      console.error('Error generating student result card:', error);
      return null;
    }
  }

  /**
   * Generate merit list for a grade and term
   */
  async generateMeritList(gradeId: number, term: string): Promise<Array<{
    rank: number;
    student_id: number;
    student_name: string;
    overall_percentage: number;
    overall_grade: string;
    total_marks: number;
    max_marks: number;
  }>> {
    try {
      const topPerformers = await this.getTopPerformers(gradeId, term, 500); // Get top 500 so it covers all students in an average class
      
      return topPerformers.map(performer => ({
        rank: performer.rank,
        student_id: performer.student_id,
        student_name: performer.student_name,
        overall_percentage: performer.overall_percentage,
        overall_grade: performer.overall_grade,
        total_marks: performer.total_marks_obtained || 0,
        max_marks: performer.total_max_marks || 0
      }));
    } catch (error) {
      console.error('Error generating merit list:', error);
      return [];
    }
  }

  /**
   * Calculate class performance trends
   */
  async calculatePerformanceTrends(gradeId: number, terms: string[]): Promise<{
    term: string;
    average_percentage: number;
    pass_rate: number;
    grade_distribution: any;
  }[]> {
    try {
      const trends = [];

      for (const term of terms) {
        const statistics = await MarksModel.getGradeStatistics(gradeId, term);
        const passRate = statistics.total_students > 0 
          ? (statistics.passed_students / statistics.total_students) * 100 
          : 0;

        trends.push({
          term: term,
          average_percentage: statistics.average_percentage || 0,
          pass_rate: passRate,
          grade_distribution: {
            'A': statistics.a_count || 0,
            'B': statistics.b_count || 0,
            'C': statistics.c_count || 0,
            'S': statistics.s_count || 0,
            'F': statistics.f_count || 0
          }
        });
      }

      return trends;
    } catch (error) {
      console.error('Error calculating performance trends:', error);
      return [];
    }
  }

  /**
   * Generate individual student result card with rank and class average
   */
  async generateStudentResultWithRank(studentId: number, gradeId: number, term: string): Promise<{
    result: StudentResult;
    rank: number;
    total_students: number;
    class_average: number;
  } | null> {
    try {
      // 1. Get the individual student's result
      const result = await MarksModel.calculateStudentResult(studentId, gradeId, term);
      if (!result) return null;

      // 2. Get all marks for this grade and term to calculate ranking and class average
      const allMarks = await MarksModel.findByGradeTerm(gradeId, term);
      
      const studentMap = new Map<number, number>(); // studentId -> total marks
      
      allMarks.forEach(mark => {
        const currentTotal = studentMap.get(mark.student_id) || 0;
        const markVal = mark.marks_obtained === 'AB' ? 0 : Number(mark.marks_obtained);
        studentMap.set(mark.student_id, currentTotal + markVal);
      });

      // 3. Calculate class average (as a percentage)
      const totalStudents = studentMap.size;
      let totalPercentageSum = 0;
      
      // We need to calculate percentages for each student to get a class average %
      // Grouping marks by student including max_marks
      const studentMetricsMap = new Map<number, { obtained: number, max: number }>();
      allMarks.forEach(mark => {
        const current = studentMetricsMap.get(mark.student_id) || { obtained: 0, max: 0 };
        const markVal = mark.marks_obtained === 'AB' ? 0 : Number(mark.marks_obtained);
        const maxVal = Number(mark.max_marks || 100);
        studentMetricsMap.set(mark.student_id, {
          obtained: current.obtained + markVal,
          max: current.max + maxVal
        });
      });

      studentMetricsMap.forEach(metrics => {
        const percentage = metrics.max > 0 ? (metrics.obtained / metrics.max) * 100 : 0;
        totalPercentageSum += percentage;
      });

      const classAveragePercentage = totalStudents > 0 ? (totalPercentageSum / totalStudents) : 0;

      // 4. Calculate Ranks
      // Sort students by total marks descending
      const sortedStudents = Array.from(studentMap.entries())
        .sort((a, b) => b[1] - a[1]); // [studentId, totalMarks]

      let rank = 0;
      for (let i = 0; i < sortedStudents.length; i++) {
        // Handle ties by giving same rank if totals are equal
        if (i > 0 && sortedStudents[i][1] === sortedStudents[i-1][1]) {
          // Keep the same rank
        } else {
          rank = i + 1;
        }

        if (sortedStudents[i][0] === studentId) {
          return {
            result,
            rank,
            total_students: totalStudents,
            class_average: classAveragePercentage
          };
        }
      }

      // Fallback
      return {
        result,
        rank: 0,
        total_students: totalStudents,
        class_average: classAveragePercentage
      };

    } catch (error) {
      console.error('Error generating student result with rank:', error);
      return null;
    }
  }
}

export default ResultService;
