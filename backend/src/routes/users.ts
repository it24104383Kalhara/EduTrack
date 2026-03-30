import { Router, Request, Response } from 'express';
import { UserModel } from '../models/User';
import { authenticateToken } from '../middleware/auth';
import pool from '../config/database';
import EmailService from '../services/EmailService';

const router = Router();
const emailService = new EmailService();

// Only Admins can access these routes
const authorizeAdmin = (req: any, res: Response, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
  }
  next();
};

// GET /api/users/pending
router.get('/pending', authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const pendingUsers = await UserModel.getPendingUsers();
    res.json({ success: true, count: pendingUsers.length, data: pendingUsers });
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/users/teachers
router.get('/teachers', authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const teachers = await UserModel.getAllTeachers();
    res.json({ success: true, count: teachers.length, data: teachers });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/users/teachers/:id
router.put('/teachers/:id', authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    // Include grade_id in destructuring
    let { first_name, last_name, gender, grade, phone_number, birthday, address, email, grade_id } = req.body;

    console.log('🔍 === GRADE UPDATE REQUEST START ===');
    console.log('🔍 Request params:', { id });
    console.log('🔍 Request body:', { first_name, last_name, gender, grade, phone_number, birthday, address, email, grade_id });
    console.log('🔍 User from token:', (req as any).user);

    // Check if grade_id is provided to perform class reassignment
    // If grade_id is an empty string, we treat it as unassigning
    console.log('🔍 Grade update request:', { grade_id, currentTeacherId: id });
    
    try {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        
        if (grade_id !== undefined) {
          // Clear previously assigned classes for this teacher
          console.log('🔍 Clearing previous assignments for teacher:', id);
          const clearResult = await connection.execute('UPDATE grades SET teacher_id = NULL WHERE teacher_id = ?', [id]);
          console.log('🔍 Clear result:', clearResult);

          const newGradeId = (grade_id && grade_id !== "unassigned" && grade_id !== "") ? parseInt(grade_id) : null;
          console.log('🔍 Parsed newGradeId:', newGradeId);

          if (newGradeId && !isNaN(newGradeId)) {
            // Link teacher to the newly chosen class
            console.log('🔍 Assigning teacher', id, 'to grade:', newGradeId);
            const assignResult = await connection.execute('UPDATE grades SET teacher_id = ? WHERE id = ?', [id, newGradeId]);
            console.log('🔍 Assign result:', assignResult);

            // Formulate the grade string to update the profile tables uniformly
            const [gradeRows] = await connection.execute('SELECT grade, grade_part FROM grades WHERE id = ?', [newGradeId]);
            console.log('🔍 Grade rows result:', gradeRows);
            
            if ((gradeRows as any[]).length > 0) {
              const gradeData = (gradeRows as any[])[0];
              grade = `Grade ${gradeData.grade}-${gradeData.grade_part}`;
              console.log('🔍 Formulated grade string:', grade);
            } else {
              console.log('🔴 No grade found for ID:', newGradeId);
              grade = "No Class Assigned";
            }
          } else {
            // Unassigned
            grade = "No Class Assigned";
            console.log('🔍 Teacher unassigned from grade');
          }

          // Update the base users table to keep it in sync
          console.log('🔍 Updating users table with grade:', grade, 'for teacher:', id);
          const userUpdateResult = await connection.execute('UPDATE users SET grade = ? WHERE id = ?', [grade, id]);
          console.log('🔍 User update result:', userUpdateResult);
        } else {
          // If no grade_id provided, fetch current grade from users table to preserve it
          const [userRows] = await connection.execute('SELECT grade FROM users WHERE id = ?', [id]);
          if ((userRows as any[]).length > 0) {
            grade = (userRows as any[])[0].grade;
            console.log('🔍 Preserved existing grade:', grade);
          }
        }

        // Update teacher details in both tables within the same transaction
        const profileUpdates: string[] = [];
        const profileValues: any[] = [];
        
        if (first_name !== undefined) { profileUpdates.push('first_name = ?'); profileValues.push(first_name); }
        if (last_name !== undefined) { profileUpdates.push('last_name = ?'); profileValues.push(last_name); }
        if (gender !== undefined) { profileUpdates.push('gender = ?'); profileValues.push(gender); }
        if (grade !== undefined) { profileUpdates.push('grade = ?'); profileValues.push(grade); }
        if (phone_number !== undefined) { profileUpdates.push('phone_number = ?'); profileValues.push(phone_number); }
        if (birthday !== undefined) { profileUpdates.push('birthday = ?'); profileValues.push(birthday); }
        if (address !== undefined) { profileUpdates.push('address = ?'); profileValues.push(address); }

        console.log('🔍 Profile updates:', profileUpdates);
        console.log('🔍 Profile values:', profileValues);

        let affectedRows = 0;

        // Update email in both tables
        if (email !== undefined) {
          const [uResult] = await connection.execute(
            'UPDATE users SET email = ? WHERE id = ? AND role = "teacher"',
            [email, id]
          );
          affectedRows += (uResult as any).affectedRows;
          console.log('🔍 Email update result:', uResult);
        }

        // Update teachers table AND keep users table in sync
        if (profileUpdates.length > 0) {
          const valuesWithId = [...profileValues, id];

          const [tResult] = await connection.execute(
            `UPDATE teachers SET ${profileUpdates.join(', ')} WHERE user_id = ?`,
            valuesWithId
          );
          affectedRows += (tResult as any).affectedRows;
          console.log('🔍 Teachers table update result:', tResult);

          // Sync the same changes to users table (source of truth for pending/pre-approval state)
          const [uSyncResult] = await connection.execute(
            `UPDATE users SET ${profileUpdates.join(', ')} WHERE id = ? AND role = 'teacher'`,
            valuesWithId
          );
          console.log('🔍 Users table sync result:', uSyncResult);
        }

        await connection.commit();
        console.log('🔍 Transaction committed successfully');
        console.log('🔍 Returning response with grade:', grade);
        console.log('🔍 === GRADE UPDATE REQUEST END ===');
        
        res.json({ success: true, message: 'Teacher details updated successfully', grade });
        
      } catch (error) {
        await connection.rollback();
        console.error('🔴 Transaction rolled back:', error);
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('🔴 Database connection error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating teacher details:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/users/:id/approve
router.put('/:id/approve', authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { grade_id } = req.body;

    // Get user first to access their email, name, and profile data
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const success = await UserModel.updateStatus(id, 'approved');

    if (success) {
      if (grade_id) {
        // Link teacher to the grade
        await pool.execute('UPDATE grades SET teacher_id = ? WHERE id = ?', [id, grade_id]);

        // ✅ AUTO-SYNC ASSIGNED GRADE: fetch the grade's string format (e.g. "Grade 6-A") 
        // and update the user's `grade` column BEFORE inserting into teachers.
        const [gradeRows] = await pool.execute('SELECT grade, grade_part FROM grades WHERE id = ?', [grade_id]);
        if ((gradeRows as any[]).length > 0) {
          const gradeData = (gradeRows as any[])[0];
          const gradeName = `Grade ${gradeData.grade}-${gradeData.grade_part}`;

          // Sync it to the user object directly so the INSERT statement uses this value
          await pool.execute('UPDATE users SET grade = ? WHERE id = ?', [gradeName, id]);
          user.grade = gradeName;
        }
      }

      // ✅ APPROVAL GATE: Only now copy teacher profile from users → teachers table
      // If rejected, this block is never reached so teachers table stays clean
      if (user.role === 'teacher') {
        const { USER_QUERIES } = require('../models/DatabaseQueries');
        await pool.execute(USER_QUERIES.SYNC_USER_TO_TEACHER, [id]);
      }

      // Send approval email to teacher
      if (user.role === 'teacher') {
        emailService.sendTeacherApprovalEmail(user.email, user.username).catch((err: any) => {
          console.error('Error sending teacher approval email:', err);
        });
      }

      res.json({ success: true, message: 'User approved' + (grade_id ? ' and assigned to class' : '') + ' successfully' });
    } else {
      res.status(404).json({ success: false, message: 'User not found or already approved' });
    }
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/users/:id/reject
router.put('/:id/reject', authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);

    // Get user first to access their email and name
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const success = await UserModel.updateStatus(id, 'rejected');
    if (success) {
      // Send email if teacher
      if (user.role === 'teacher') {
        emailService.sendTeacherRejectionEmail(user.email, user.username).catch((err: any) => {
          console.error('Error sending teacher rejection email:', err);
        });
      }
      res.json({ success: true, message: 'User rejected successfully' });
    } else {
      res.status(404).json({ success: false, message: 'User not found or already rejected' });
    }
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
