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
    const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    const maxDate = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate()); // At least 3 years old

    if (dob > today) {
      errors.push({
        field: 'date_of_birth',
        message: 'Date of birth cannot be in the future'
      });
    } else if (dob < minDate) {
      errors.push({
        field: 'date_of_birth',
        message: 'Date of birth cannot be more than 100 years ago'
      });
    } else if (dob > maxDate) {
      errors.push({
        field: 'date_of_birth',
        message: 'Student must be at least 3 years old'
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
