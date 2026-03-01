import { Request, Response, NextFunction } from 'express';

interface ValidationError {
  field: string;
  message: string;
}

// Generic validation middleware
export const validate = (validations: Array<(req: Request) => ValidationError[]>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const errors: ValidationError[] = [];
    
    for (const validation of validations) {
      const validationErrors = validation(req);
      errors.push(...validationErrors);
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    next();
  };
};

// Student validation
export const validateStudentRegistration = (req: Request): ValidationError[] => {
  const errors: ValidationError[] = [];
  const student = req.body;

  const requiredFields = [
    'first_name',
    'last_name',
    'date_of_birth',
    'gender',
    'religion',
    'address',
    'nationality',
    'parent_type',
    'parent_name',
    'parent_phone',
    'parent_address',
    'parent_gender',
    'parent_religion',
    'parent_nationality'
  ];

  for (const field of requiredFields) {
    if (!student[field] || student[field].trim() === '') {
      errors.push({
        field,
        message: `${field.replace(/_/g, ' ')} is required`
      });
    }
  }

  // Email validation if provided
  if (student.parent_email && !isValidEmail(student.parent_email)) {
    errors.push({
      field: 'parent_email',
      message: 'Invalid email format'
    });
  }

  // Phone validation
  if (student.parent_phone && !isValidPhone(student.parent_phone)) {
    errors.push({
      field: 'parent_phone',
      message: 'Invalid phone number format'
    });
  }

  // Gender validation
  const validGenders = ['male', 'female', 'other'];
  if (student.gender && !validGenders.includes(student.gender.toLowerCase())) {
    errors.push({
      field: 'gender',
      message: 'Gender must be male, female, or other'
    });
  }

  if (student.parent_gender && !validGenders.includes(student.parent_gender.toLowerCase())) {
    errors.push({
      field: 'parent_gender',
      message: 'Parent gender must be male, female, or other'
    });
  }

  // Date of birth validation
  if (student.date_of_birth && !isValidDate(student.date_of_birth)) {
    errors.push({
      field: 'date_of_birth',
      message: 'Invalid date format (use YYYY-MM-DD)'
    });
  }

  return errors;
};

// Grade validation
export const validateGradeCreation = (req: Request): ValidationError[] => {
  const errors: ValidationError[] = [];
  const grade = req.body;

  if (!grade.name || grade.name.trim() === '') {
    errors.push({
      field: 'name',
      message: 'Grade name is required'
    });
  }

  return errors;
};

// Subject validation
export const validateSubjectCreation = (req: Request): ValidationError[] => {
  const errors: ValidationError[] = [];
  const subject = req.body;

  if (!subject.name || subject.name.trim() === '') {
    errors.push({
      field: 'name',
      message: 'Subject name is required'
    });
  }

  if (!subject.code || subject.code.trim() === '') {
    errors.push({
      field: 'code',
      message: 'Subject code is required'
    });
  }

  if (!subject.grades || (Array.isArray(subject.grades) && subject.grades.length === 0)) {
    errors.push({
      field: 'grades',
      message: 'At least one grade is required'
    });
  }

  const validTypes = ['6-11', '12-13'];
  if (subject.type && !validTypes.includes(subject.type)) {
    errors.push({
      field: 'type',
      message: 'Type must be either 6-11 or 12-13'
    });
  }

  return errors;
};

// Marks validation
export const validateMarkCreation = (req: Request): ValidationError[] => {
  const errors: ValidationError[] = [];
  const mark = req.body;

  if (!mark.studentId) {
    errors.push({
      field: 'studentId',
      message: 'Student ID is required'
    });
  }

  if (!mark.subjectId) {
    errors.push({
      field: 'subjectId',
      message: 'Subject ID is required'
    });
  }

  if (mark.marks === undefined || mark.marks === null) {
    errors.push({
      field: 'marks',
      message: 'Marks obtained is required'
    });
  } else if (isNaN(mark.marks) || mark.marks < 0) {
    errors.push({
      field: 'marks',
      message: 'Marks must be a non-negative number'
    });
  }

  if (mark.maxMarks !== undefined && (isNaN(mark.maxMarks) || mark.maxMarks <= 0)) {
    errors.push({
      field: 'maxMarks',
      message: 'Maximum marks must be a positive number'
    });
  }

  if (mark.marks !== undefined && mark.maxMarks !== undefined && mark.marks > mark.maxMarks) {
    errors.push({
      field: 'marks',
      message: 'Marks obtained cannot exceed maximum marks'
    });
  }

  if (!mark.examType || mark.examType.trim() === '') {
    errors.push({
      field: 'examType',
      message: 'Exam type is required'
    });
  }

  if (mark.date && !isValidDate(mark.date)) {
    errors.push({
      field: 'date',
      message: 'Invalid date format (use YYYY-MM-DD)'
    });
  }

  return errors;
};

// Attendance validation
export const validateAttendanceMarking = (req: Request): ValidationError[] => {
  const errors: ValidationError[] = [];
  const { date, gradeId, attendance } = req.body;

  if (!date) {
    errors.push({
      field: 'date',
      message: 'Date is required'
    });
  } else if (!isValidDate(date)) {
    errors.push({
      field: 'date',
      message: 'Invalid date format (use YYYY-MM-DD)'
    });
  }

  if (!gradeId) {
    errors.push({
      field: 'gradeId',
      message: 'Grade ID is required'
    });
  }

  if (!attendance || !Array.isArray(attendance) || attendance.length === 0) {
    errors.push({
      field: 'attendance',
      message: 'Attendance array is required'
    });
  } else {
    attendance.forEach((record: any, index: number) => {
      if (!record.studentId) {
        errors.push({
          field: `attendance[${index}].studentId`,
          message: 'Student ID is required'
        });
      }

      if (!record.status) {
        errors.push({
          field: `attendance[${index}].status`,
          message: 'Status is required'
        });
      } else {
        const validStatuses = ['present', 'absent', 'late', 'excused'];
        if (!validStatuses.includes(record.status.toLowerCase())) {
          errors.push({
            field: `attendance[${index}].status`,
            message: 'Status must be present, absent, late, or excused'
          });
        }
      }
    });
  }

  return errors;
};

// Utility functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

function isValidDate(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}
