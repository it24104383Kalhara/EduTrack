import { Request, Response, NextFunction } from 'express';
import { Student } from '../models/Student';

interface ValidationError {
  field: string;
  message: string;
}

export const validateStudentRegistration = (req: Request, res: Response, next: NextFunction) => {
  const errors: ValidationError[] = [];
  const student: Student = req.body;

  // Validate required fields
  // TEMPORARILY DISABLED STRICT VALIDATION TO ALLOW REGISTRATION
  /*
  requiredFields.forEach(field => {
    const fieldValue = student[field as keyof Student];
    if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
      errors.push({
        field,
        message: `${field.replace(/_/g, ' ')} is required`
      });
    }
  });

  // Validate name fields (letters only, min 2 chars)
  if (student.first_name && !/^[a-zA-Z\s]{2,}$/.test(student.first_name.trim())) {
    errors.push({
      field: 'first_name',
      message: 'First name must contain only letters and be at least 2 characters long'
    });
  }

  if (student.last_name && !/^[a-zA-Z\s]{2,}$/.test(student.last_name.trim())) {
    errors.push({
      field: 'last_name',
      message: 'Last name must contain only letters and be at least 2 characters long'
    });
  }

  // Validate date of birth (not future date, reasonable age range)
  if (student.date_of_birth) {
    const dob = new Date(student.date_of_birth);
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate()); // Not older than 25
    const maxDate = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate()); // At least 10 years old

    if (dob > today) {
      errors.push({
        field: 'date_of_birth',
        message: 'Date of birth cannot be in the future'
      });
    } else if (dob < minDate || dob > maxDate) {
      errors.push({
        field: 'date_of_birth',
        message: 'Student must be between 10 and 25 years old'
      });
    }
  }

  // Validate gender
  const validGenders = ['male', 'female', 'other'];
  if (student.gender && !validGenders.includes(student.gender)) {
    errors.push({
      field: 'gender',
      message: 'Invalid gender value'
    });
  }

  if (student.parent_gender && !validGenders.includes(student.parent_gender)) {
    errors.push({
      field: 'parent_gender',
      message: 'Invalid parent gender value'
    });
  }

  // Validate parent type
  const validParentTypes = ['father', 'mother', 'guardian'];
  if (student.parent_type && !validParentTypes.includes(student.parent_type)) {
    errors.push({
      field: 'parent_type',
      message: 'Invalid parent type value'
    });
  }

  // Validate phone number (basic validation)
  if (student.parent_phone && !/^[\d\s\-\+\(\)]{10,20}$/.test(student.parent_phone.trim())) {
    errors.push({
      field: 'parent_phone',
      message: 'Invalid phone number format'
    });
  }

  // Validate email (optional field)
  if (student.parent_email && student.parent_email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(student.parent_email.trim())) {
      errors.push({
        field: 'parent_email',
        message: 'Invalid email format'
      });
    }
  }

  // Validate address length
  if (student.address && student.address.trim().length < 10) {
    errors.push({
      field: 'address',
      message: 'Address must be at least 10 characters long'
    });
  }

  if (student.parent_address && student.parent_address.trim().length < 10) {
    errors.push({
      field: 'parent_address',
      message: 'Parent address must be at least 10 characters long'
    });
  }
  */

  // Required fields check
  const requiredFields = ['first_name', 'last_name', 'date_of_birth', 'gender', 'religion', 'ethnicity', 'address', 'nationality', 'parent_type', 'parent_name', 'parent_phone', 'parent_address', 'parent_gender'];
  
  for (const field of requiredFields) {
    if (!student[field as keyof Student] || (typeof student[field as keyof Student] === 'string' && String(student[field as keyof Student]).trim() === '')) {
      errors.push({
        field,
        message: `${field.replace(/_/g, ' ')} is required`
      });
    }
  }

  // Validate phone number (only digits, exactly 10 chars)
  if (student.parent_phone && !/^\d{10}$/.test(String(student.parent_phone).trim())) {
    errors.push({
      field: 'parent_phone',
      message: 'Parent phone number must be exactly 10 digits'
    });
  }

  // Validate parent email (optional, but must be valid if provided)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (student.parent_email && String(student.parent_email).trim() !== '' && !emailRegex.test(String(student.parent_email).trim())) {
    errors.push({
      field: 'parent_email',
      message: 'Invalid email format'
    });
  }

  // Validate date of birth (2006-12-31 to 2016-01-31)
  if (student.date_of_birth) {
    const dob = new Date(student.date_of_birth);
    const minDob = new Date('2006-12-31');
    const maxDob = new Date('2016-01-31');

    if (isNaN(dob.getTime())) {
      errors.push({
        field: 'date_of_birth',
        message: 'Invalid date format'
      });
    } else if (dob < minDob || dob > maxDob) {
      errors.push({
        field: 'date_of_birth',
        message: 'Student must be born between 31st Dec 2006 and 31st Jan 2016'
      });
    }
  }

  // Basic name validation (letters allowed)
  if (student.first_name && student.first_name.trim().length < 2) {
    errors.push({
      field: 'first_name',
      message: 'First name must be at least 2 characters long'
    });
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // If validation passes, continue to next middleware
  next();
};

export const validateGradeCreation = (req: Request, res: Response, next: NextFunction) => {
  const errors: ValidationError[] = [];
  const grade: { grade?: number; grade_part?: string } = req.body;

  // Validate required fields
  if (!grade.grade || typeof grade.grade !== 'number') {
    errors.push({
      field: 'grade',
      message: 'Grade number is required and must be a number'
    });
  }

  if (!grade.grade_part || typeof grade.grade_part !== 'string') {
    errors.push({
      field: 'grade_part',
      message: 'Grade part is required and must be a string'
    });
  }

  // Validate grade number range (6-13)
  if (grade.grade && (grade.grade < 6 || grade.grade > 13)) {
    errors.push({
      field: 'grade',
      message: 'Grade number must be between 6 and 13'
    });
  }

  // Validate grade part format (letters, numbers, spaces allowed — e.g. 'A', 'Science A', 'Commerce B')
  if (grade.grade_part && !/^[A-Za-z0-9][A-Za-z0-9\s]{0,29}$/.test(grade.grade_part.trim())) {
    errors.push({
      field: 'grade_part',
      message: 'Grade part must start with a letter or number and can include spaces (max 30 characters)'
    });
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Grade validation failed',
      errors,
      timestamp: new Date().toISOString(),
      endpoint: req.path
    });
  }

  // If validation passes, continue to next middleware
  next();
};

export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', error);

  // Handle specific error types
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry detected'
    });
  }

  if (error.code === 'ER_NO_SUCH_TABLE') {
    return res.status(500).json({
      success: false,
      message: 'Database table not found. Please contact administrator.'
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};
