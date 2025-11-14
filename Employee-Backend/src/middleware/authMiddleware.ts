import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Employee } from '../entities/employee.entity';
import { AppDataSource } from '../config/data-source';
import { DecodedToken } from '../types/auth.types';

export interface AuthRequest extends Request {
    user?: Employee;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
        const employeeRepository = AppDataSource.getRepository(Employee);
        const user = await employeeRepository.findOne({ where: { id: decoded.id } });

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

export const requireRole = (roles: ('admin' | 'employee' | 'manager') | ('admin' | 'employee' | 'manager')[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Access restricted to ${allowedRoles.join(' or ')} role${allowedRoles.length > 1 ? 's' : ''}`
            });
        }

        next();
    };
};

export const requireOwnershipOrAdmin = (getResourceUserId: (req: Request) => string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const resourceUserId = getResourceUserId(req);
        if (req.user.id !== resourceUserId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access forbidden: You can only access your own resources' });
        }

        next();
    };
};