import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import EmailService from '../services/EmailService';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'edutrack_secret_key_2026';
const emailService = new EmailService();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { username, email, password, role, first_name, last_name, gender, grade, phone_number, birthday, address } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  if (role !== 'admin' && role !== 'teacher') {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  try {
    const existingUser = await UserModel.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const status = 'pending';

    const insertId = await UserModel.create({
      username,
      email,
      password_hash,
      role,
      status,
      first_name,
      last_name,
      gender,
      grade,
      phone_number,
      birthday,
      address
    });

    // Send email to teacher
    if (role === 'teacher') {
      emailService.sendTeacherRegistrationWaitEmail(email, username).catch((err: any) => {
        console.error('Error sending registration wait email:', err);
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your account is pending admin approval.',
      data: { userId: insertId, status }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Failed to create account. Email or username might be in use.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
  }

  try {
    const user = await UserModel.findByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Check account approval status
    if (user.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin approval.'
      });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({
        success: false,
        message: 'Your account registration was rejected.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: user
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  const { username, newPassword } = req.body;

  if (!username || !newPassword) {
    return res.status(400).json({ success: false, message: 'Username and new password are required' });
  }

  try {
    const user = await UserModel.findByUsername(username);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await UserModel.updatePassword(username, password_hash);

    res.json({ success: true, message: 'Password reset successful! You can now sign in.' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

// GET /api/auth/me (Verify token and get user info)
router.get('/me', async (req: any, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await UserModel.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        user: user
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

export default router;
