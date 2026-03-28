import jsPDF from 'jspdf';
import { MarksModel, StudentResult } from '../models/Marks';
import { StudentModel } from '../models/Student';
import { GradeModel } from '../models/Grade';

export interface ReportCardData {
  student: {
    id: number;
    name: string;
    admission_number: string;
    grade: string;
    section: string;
    date_of_birth: string;
    gender: string;
    address: string;
    parent_name: string;
    parent_phone: string;
    parent_email: string;
  };
  term: string;
  academic_year: string;
  result: StudentResult;
  rank: number;
  class_average: number;
  attendance_summary: {
    total_days: number;
    present_days: number;
    absent_days: number;
    percentage: number;
  };
  total_students: number;
  teacher_remarks: string;
  principal_signature: string;
  generated_at: string;
}

export class ReportCardService {
  /**
   * Generate comprehensive PDF report card for a student
   */
  async generateReportCardPDF(studentId: number, gradeId: number, term: string): Promise<Buffer> {
    try {
      // Get student information
      const student = await StudentModel.findById(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      // Get grade information
      const grade = await GradeModel.findById(gradeId);
      if (!grade) {
        throw new Error('Grade not found');
      }

      // Get student results with rank and class average
      const resultService = new (require('./ResultService').default)();
      const rankedData = await resultService.generateStudentResultWithRank(studentId, gradeId, term);
      if (!rankedData) {
        throw new Error('Student results not found for the specified term');
      }

      // Mock attendance data (would integrate with attendance system)
      const attendanceSummary = {
        total_days: 180,
        present_days: 165,
        absent_days: 15,
        percentage: 91.7
      };

      // Prepare report card data
      const reportCardData: ReportCardData = {
        student: {
          id: student.id!,
          name: `${student.first_name} ${student.last_name}`,
          admission_number: `ADM${student.id!.toString().padStart(6, '0')}`,
          grade: grade.grade.toString(),
          section: grade.grade_part,
          date_of_birth: new Date(student.date_of_birth).toLocaleDateString(),
          gender: student.gender,
          address: student.address,
          parent_name: student.parent_name,
          parent_phone: student.parent_phone,
          parent_email: student.parent_email || 'N/A'
        },
        term: term,
        academic_year: '2024-2025', // Would be dynamic
        result: rankedData.result,
        rank: rankedData.rank,
        total_students: rankedData.total_students,
        class_average: rankedData.class_average,
        attendance_summary: attendanceSummary,
        teacher_remarks: this.generateTeacherRemarks(rankedData.result),
        principal_signature: 'Dr. John Smith', // Would be dynamic
        generated_at: new Date().toISOString()
      };

      // Generate PDF
      const pdfBuffer = this.createReportCardPDF(reportCardData);
      
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating report card PDF:', error);
      throw error;
    }
  }

  /**
   * Create PDF report card using jsPDF with premium UI-matched styling
   */
  private createReportCardPDF(data: ReportCardData): Buffer {
    const doc = new jsPDF();
    let yPosition = 15;

    // Brand Colors
    const colors = {
      primary: [99, 49, 148],    // #633194 (Purple)
      success: [16, 185, 129],  // #10B981 (Green)
      info: [59, 130, 246],     // #3B82F6 (Blue)
      warning: [245, 158, 11],  // #F59E0B (Orange)
      textDark: [31, 41, 55],   // #1F2937
      textLight: [107, 114, 128], // #6B7280
      bgLight: [249, 250, 251]  // #F9FAFB
    };

    // Helper functions
    const setFontSize = (size: number) => doc.setFontSize(size);
    const setBold = (bold: boolean) => doc.setFont('helvetica', bold ? 'bold' : 'normal');
    const setTextColor = (rgb: number[]) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    const setDrawColor = (rgb: number[]) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
    const setFillColor = (rgb: number[]) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);

    // Background Header Accent
    setFillColor(colors.primary);
    doc.rect(0, 0, 210, 40, 'F');

    // Header Content
    setTextColor([255, 255, 255]);
    setBold(true);
    setFontSize(24);
    doc.text('EDUTRACK ACADEMY', 105, 22, { align: 'center' });
    
    setFontSize(12);
    setBold(false);
    doc.text(`Official Academic Report Card • ${data.academic_year}`, 105, 30, { align: 'center' });

    yPosition = 50;

    // Student Info Section
    setTextColor(colors.textDark);
    setBold(true);
    setFontSize(14);
    doc.text('STUDENT PROFILE', 20, yPosition);
    yPosition += 8;

    setFillColor(colors.bgLight);
    setDrawColor([229, 231, 235]); // Light grey border
    doc.roundedRect(20, yPosition, 170, 42, 3, 3, 'FD');

    const infoY = yPosition + 8;
    setFontSize(10);
    
    // Info Column 1
    setTextColor(colors.textLight);
    doc.text('Student Name:', 25, infoY);
    setTextColor(colors.textDark);
    setBold(true);
    doc.text(data.student.name, 55, infoY);

    setBold(false);
    setTextColor(colors.textLight);
    doc.text('Admission No:', 25, infoY + 8);
    setTextColor(colors.textDark);
    doc.text(data.student.admission_number, 55, infoY + 8);

    setTextColor(colors.textLight);
    doc.text('Grade & Sec:', 25, infoY + 16);
    setTextColor(colors.textDark);
    doc.text(`${data.student.grade} - ${data.student.section}`, 55, infoY + 16);

    // Info Column 2
    setTextColor(colors.textLight);
    doc.text('Current Term:', 110, infoY);
    setTextColor(colors.textDark);
    doc.text(data.term, 140, infoY);

    setTextColor(colors.textLight);
    doc.text('Issued Date:', 110, infoY + 8);
    setTextColor(colors.textDark);
    doc.text(new Date().toLocaleDateString(), 140, infoY + 8);

    yPosition += 55;

    // --- ACADEMIC SUMMARY CARDS (Like the UI) ---
    const cardWidth = 38;
    const cardHeight = 22;
    const spacing = 6;
    let cardX = 20;

    // 1. Rank Card
    setFillColor([255, 255, 255]); setDrawColor(colors.primary);
    doc.roundedRect(cardX, yPosition, cardWidth, cardHeight, 2, 2, 'D');
    setTextColor(colors.textLight); setFontSize(8); doc.text('CLASS RANK', cardX + 19, yPosition + 6, { align: 'center' });
    setTextColor(colors.primary); setFontSize(14); setBold(true); doc.text(`${data.rank}`, cardX + 19, yPosition + 15, { align: 'center' });
    cardX += cardWidth + spacing;

    // 2. Total Marks Card
    setBold(false); setDrawColor(colors.success);
    doc.roundedRect(cardX, yPosition, cardWidth, cardHeight, 2, 2, 'D');
    setTextColor(colors.textLight); setFontSize(8); doc.text('TOTAL MARKS', cardX + 19, yPosition + 6, { align: 'center' });
    setTextColor(colors.success); setFontSize(14); setBold(true); doc.text(`${data.result.total_marks_obtained}`, cardX + 19, yPosition + 15, { align: 'center' });
    cardX += cardWidth + spacing;

    // 3. Percentage Card
    setBold(false); setDrawColor(colors.info);
    doc.roundedRect(cardX, yPosition, cardWidth, cardHeight, 2, 2, 'D');
    setTextColor(colors.textLight); setFontSize(8); doc.text('PERCENTAGE', cardX + 19, yPosition + 6, { align: 'center' });
    setTextColor(colors.info); setFontSize(14); setBold(true); doc.text(`${data.result.overall_percentage.toFixed(1)}%`, cardX + 19, yPosition + 15, { align: 'center' });
    cardX += cardWidth + spacing;

    // 4. Average Card
    setBold(false); setDrawColor(colors.warning);
    doc.roundedRect(cardX, yPosition, cardWidth, cardHeight, 2, 2, 'D');
    setTextColor(colors.textLight); setFontSize(8); doc.text('CLASS AVG', cardX + 19, yPosition + 6, { align: 'center' });
    setTextColor(colors.warning); setFontSize(14); setBold(true); doc.text(`${data.class_average.toFixed(1)}%`, cardX + 19, yPosition + 15, { align: 'center' });

    yPosition += cardHeight + 15;

    // --- SUBJECT MARKS TABLE ---
    setTextColor(colors.textDark);
    setBold(true);
    setFontSize(14);
    doc.text('SUBJECT PERFORMANCE', 20, yPosition);
    yPosition += 8;

    const tableHeaders = ['Subject', 'Marks', 'Max', 'Grade', 'Status'];
    const tableWidths = [70, 25, 25, 25, 25];
    let headerX = 20;

    // Table Header Styling
    setFillColor([243, 244, 246]); // Light grey bg
    doc.rect(20, yPosition, 170, 8, 'F');
    setTextColor(colors.textDark);
    setFontSize(10);
    setBold(true);
    
    tableHeaders.forEach((header, i) => {
      doc.text(header, headerX + 5, yPosition + 6);
      headerX += tableWidths[i];
    });

    yPosition += 8;
    setBold(false);
    setFontSize(9);

    data.result.subject_marks.forEach((subject, i) => {
      // Row Background (Zebra striping)
      if (i % 2 === 1) {
        setFillColor([252, 253, 254]);
        doc.rect(20, yPosition, 170, 7, 'F');
      }
      
      let cellX = 20;
      doc.text(subject.subject_name.substring(0, 35), cellX + 5, yPosition + 5);
      cellX += tableWidths[0];
      
      const isAbsent = subject.grade_obtained === 'AB';
      const marksDisplay = isAbsent ? 'AB' : subject.marks_obtained.toString();
      doc.text(marksDisplay, cellX + 5, yPosition + 5);
      cellX += tableWidths[1];
      
      doc.text(subject.max_marks.toString(), cellX + 5, yPosition + 5);
      cellX += tableWidths[2];
      doc.text(subject.grade_obtained, cellX + 5, yPosition + 5);
      cellX += tableWidths[3];
      
      const isPass = !isAbsent && subject.grade_obtained !== 'F';
      const passStatus = isAbsent ? 'Absent' : (isPass ? 'Pass' : 'Fail');

      if (isAbsent) {
        setTextColor(colors.textLight); // Grey for absent
      } else if (isPass) {
        setTextColor(colors.success); // Green for pass
      } else {
        setTextColor([239, 68, 68]); // Red for fail
      }
      doc.text(passStatus, cellX + 5, yPosition + 5);
      setTextColor(colors.textDark);
      
      yPosition += 7;
    });

    // --- REMARKS & SIGNATURES ---
    yPosition += 8;
    // Removed explicit page break to force one-page layout

    setBold(true);
    doc.text('TEACHER\'S REMARKS:', 20, yPosition);
    setBold(false);
    setTextColor(colors.textLight);
    const remarkLines = this.splitText(data.teacher_remarks, 100);
    remarkLines.forEach(line => {
      yPosition += 5;
      doc.text(line, 20, yPosition);
    });

    yPosition += 15;
    
    // Signatures
    setTextColor(colors.textDark);
    setDrawColor([200, 200, 200]);
    doc.line(20, yPosition, 80, yPosition);
    doc.line(130, yPosition, 190, yPosition);
    
    yPosition += 4;
    setFontSize(8);
    doc.text('Class Teacher Signature', 50, yPosition, { align: 'center' });
    doc.text('Principal Signature', 160, yPosition, { align: 'center' });

    // Footer
    doc.text(`Computer generated on ${new Date().toLocaleString()}`, 105, 288, { align: 'center' });
    doc.text('EduTrack Academy - Quality Education for Future Leaders', 105, 292, { align: 'center' });

    return Buffer.from(doc.output('arraybuffer'));
  }

  /**
   * Generate teacher remarks based on student performance
   */
  private generateTeacherRemarks(result: StudentResult): string {
    const percentage = result.overall_percentage;
    const grade = result.overall_grade;
    const failedSubjects = result.subject_marks.filter(s => s.grade_obtained === 'F');

    if (percentage >= 90 && grade === 'A') {
      return 'Outstanding performance! The student has shown exceptional academic excellence and consistently demonstrates mastery of all subjects. Keep up the excellent work!';
    } else if (percentage >= 75 && grade === 'A') {
      return 'Excellent performance! The student has demonstrated strong academic abilities and shows great potential for continued success. Maintain this level of dedication.';
    } else if (percentage >= 65 && grade === 'B') {
      return 'Good performance with room for improvement. The student shows understanding of core concepts but should focus on weaker areas to achieve better results.';
    } else if (percentage >= 55 && grade === 'C') {
      return 'Satisfactory performance. The student needs to put more effort into studies and seek additional help in challenging subjects. Regular practice and revision are recommended.';
    } else if (percentage >= 40 && grade === 'S') {
      return 'Performance needs significant improvement. The student must focus on fundamentals and consider extra tutoring. Parental support and guidance are essential.';
    } else {
      if (failedSubjects.length > 0) {
        return `Critical performance level requiring immediate intervention. The student has failed in ${failedSubjects.length} subject(s): ${failedSubjects.map(s => s.subject_name).join(', ')}. Intensive remedial classes and parental support are urgently required.`;
      }
      return 'Unsatisfactory performance. The student requires immediate academic intervention and support. Regular monitoring and additional help are necessary to improve.';
    }
  }

  /**
   * Split long text into multiple lines
   */
  private splitText(text: string, maxLength: number): string[] {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + word).length <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word.substring(0, maxLength));
          currentLine = word.substring(maxLength);
        }
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Generate bulk report cards for entire class
   */
  async generateClassReportCards(gradeId: number, term: string): Promise<{
    success: number;
    failed: number;
    errors: Array<{ student_id: number; error: string }>;
    reportCards: Array<{ student_id: number; student_name: string; pdf_buffer: Buffer }>;
  }> {
    try {
      // Get all students in the grade
      const grade = await GradeModel.findById(gradeId);
      if (!grade) {
        throw new Error('Grade not found');
      }

      const studentIds = grade.students?.map(s => s.id) || [];
      const results = {
        success: 0,
        failed: 0,
        errors: [] as Array<{ student_id: number; error: string }>,
        reportCards: [] as Array<{ student_id: number; student_name: string; pdf_buffer: Buffer }>
      };

      for (const studentId of studentIds) {
        try {
          const pdfBuffer = await this.generateReportCardPDF(studentId, gradeId, term);
          const student = await StudentModel.findById(studentId);
          
          results.reportCards.push({
            student_id: studentId,
            student_name: student ? `${student.first_name} ${student.last_name}` : 'Unknown',
            pdf_buffer: pdfBuffer
          });
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            student_id: studentId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error generating class report cards:', error);
      throw error;
    }
  }
}

export default ReportCardService;
