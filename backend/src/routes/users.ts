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
    const { first_name, last_name, gender, grade, phone_number, birthday, address, email } = req.body;
    
    const success = await UserModel.updateTeacherDetails(id, {
      first_name,
      last_name,
      gender,
      grade,
      phone_number,
      birthday,
      address,
      email
    });

    if (success) {
      res.json({ success: true, message: 'Teacher details updated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Teacher not found or not updated' });
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
        // Because we might have automatically populated the `grade` column above (if a class was assigned),
        // we pull from `users` again below to guarantee we get the newly synced grade!
        await pool.execute(
          `INSERT INTO teachers (user_id, first_name, last_name, gender, grade, phone_number, birthday, address)
           SELECT id, first_name, last_name, gender, grade, phone_number, birthday, address
           FROM users WHERE id = ?
           ON DUPLICATE KEY UPDATE
             first_name = VALUES(first_name),
             last_name = VALUES(last_name),
             gender = VALUES(gender),
             grade = VALUES(grade),
             phone_number = VALUES(phone_number),
             birthday = VALUES(birthday),
             address = VALUES(address)`,
          [id]
        );
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
