import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include user info
export interface AuthRequest extends Request {
    user?: {
        id: number;
        role: 'Admin' | 'Coach' | 'Teacher' | 'Student' | 'Principal';
        name: string;
    };
}

/**
 * Mock Authentication Middleware
 * In production, this would verify JWT tokens and extract user info
 * For now, we'll use a header-based approach for testing
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    // Check for mock user info in headers (for development/testing)
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const userName = req.headers['x-user-name'] as string;

    if (!userId || !userRole) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing authentication headers. Please provide x-user-id and x-user-role'
        });
    }

    // Validate role
    const validRoles = ['Admin', 'Coach', 'Teacher', 'Student', 'Principal'];
    if (!validRoles.includes(userRole)) {
        return res.status(401).json({
            error: 'Invalid role',
            message: 'Role must be one of: Admin, Coach, Teacher, Student, Principal'
        });
    }

    // Attach user info to request
    req.user = {
        id: parseInt(userId),
        role: userRole as 'Admin' | 'Coach' | 'Teacher' | 'Student' | 'Principal',
        name: userName || 'Unknown User'
    };

    next();
};

/**
 * Role-based authorization middleware
 * Usage: authorize(['Admin', 'Coach'])
 */
export const authorize = (allowedRoles: Array<'Admin' | 'Coach' | 'Teacher' | 'Student' | 'Principal'>) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};
