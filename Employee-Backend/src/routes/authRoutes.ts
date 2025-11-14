import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/auth.service';
import { LoginCredentials, RegisterEmployeeDto } from '../types/auth.types';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';
import { AppDataSource } from '../config/data-source';
import { Employee } from '../entities/employee.entity';

const router = Router();
const authService = new AuthService();

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Login validation rules
const loginValidation = [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required'),
];

// Registration validation rules
const registerValidation = [
    body('email')
        .isEmail().withMessage('Invalid email format')
        .custom((value) => {
            const allowedDomains = ['@bajajfinserv.in', '@bizsupportc.com'];
            const emailDomain = value.substring(value.lastIndexOf('@'));
            if (!allowedDomains.includes(emailDomain)) {
                throw new Error('Email must be from @bajajfinserv.in or @bizsupportc.com domain');
            }
            return true;
        }),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('employeeId').notEmpty().withMessage('Employee ID is required'),
    body('podName').notEmpty().withMessage('POD Name is required'),
    body('position').notEmpty().withMessage('Position is required'),
];

// Login route
router.post('/login', loginValidation, validateRequest, async (req: Request, res: Response) => {
    try {
        const credentials: LoginCredentials = req.body;
        const result = await authService.login(credentials);
        res.json(result);
    } catch (error: any) {
        if (error.message === 'Invalid credentials') {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Register route
router.post('/signup', registerValidation, validateRequest, async (req: Request, res: Response) => {
    try {
        const employeeData: RegisterEmployeeDto = req.body;
        const result = await authService.register(employeeData);
        res.status(201).json(result);
    } catch (error: any) {
        if (error.message === 'Email already exists') {
            return res.status(400).json({ message: 'Email already registered' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.post('/register', registerValidation, validateRequest, async (req: Request, res: Response) => {
    try {
        const employeeData: RegisterEmployeeDto = req.body;
        const result = await authService.register(employeeData);
        res.status(201).json(result);
    } catch (error: any) {
        console.error('Registration error:', error);
        
        if (error.message === 'Email already exists') {
            return res.status(400).json({ message: 'Email is already registered' });
        }
        
        // Handle PostgreSQL enum errors
        if (error.code === '22P02') {
            return res.status(400).json({ 
                message: 'Invalid POD name or role. Please select from the available options.' 
            });
        }
        
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Password reset request validation rules
const forgotPasswordValidation = [
    body('email').isEmail().withMessage('Invalid email format'),
];

// Reset password validation rules
const resetPasswordValidation = [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long'),
];

// Request password reset
router.post('/forgot-password', forgotPasswordValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        const resetToken = await authService.requestPasswordReset(email);
        res.status(200).json({ 
            message: 'Password reset instructions have been sent to your email',
            // In production, don't send the token in response
            resetToken 
        });
    } catch (error: any) {
        if (error.message === 'No account found with this email') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Reset password with token
router.post('/reset-password', resetPasswordValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token, newPassword } = req.body;
        await authService.resetPassword(token, newPassword);
        res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error: any) {
        if (error.message === 'Invalid or expired reset token') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get available PODs
router.get('/pods', async (req: Request, res: Response) => {
    try {
        const result = await AppDataSource.query(`
            SELECT unnest(enum_range(NULL::employees_podname_enum)) AS pod_name
            ORDER BY pod_name
        `);
        const pods = result.map((row: any) => row.pod_name);
        res.json(pods);
    } catch (error) {
        console.error('Error fetching PODs:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Add new POD (admin only)
router.post('/pods', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        // Check if user is admin
        const userRepository = AppDataSource.getRepository(Employee);
        const user = await userRepository.findOne({ where: { id: req.user!.id } });
        
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can add PODs' });
        }

        const { podName } = req.body;

        if (!podName || !podName.trim()) {
            return res.status(400).json({ message: 'POD name is required' });
        }

        // Check if POD already exists
        const existingPods = await AppDataSource.query(`
            SELECT unnest(enum_range(NULL::employees_podname_enum)) AS pod_name
        `);
        const podExists = existingPods.some((row: any) => row.pod_name === podName);

        if (podExists) {
            return res.status(400).json({ message: 'POD already exists' });
        }

        // Add new value to enum
        await AppDataSource.query(`
            ALTER TYPE employees_podname_enum ADD VALUE IF NOT EXISTS '${podName}'
        `);

        res.json({ message: 'POD added successfully', podName });
    } catch (error) {
        console.error('Error adding POD:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete POD (admin only)
router.delete('/pods/:podName', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        // Check if user is admin
        const userRepository = AppDataSource.getRepository(Employee);
        const user = await userRepository.findOne({ where: { id: req.user!.id } });
        
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can delete PODs' });
        }

        const { podName } = req.params;

        // Check if any employees are assigned to this POD
        const employeesInPod = await userRepository.count({ where: { podName } });

        if (employeesInPod > 0) {
            return res.status(400).json({ 
                message: `Cannot delete POD "${podName}". It has ${employeesInPod} employee(s) assigned. Please reassign them first.` 
            });
        }

        // Note: PostgreSQL doesn't support removing enum values easily
        // In production, you'd want to either:
        // 1. Keep a separate POD table instead of using enum
        // 2. Use a migration to recreate the enum without the value
        // For now, we'll return a message indicating this limitation

        res.status(501).json({ 
            message: 'Deleting PODs from database enum is not supported. POD is hidden from UI but remains in database.' 
        });
    } catch (error) {
        console.error('Error deleting POD:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const user = await AppDataSource.getRepository(Employee).findOne({
            where: { id: req.user!.id },
            select: ['id', 'firstName', 'lastName', 'email', 'podName', 'position', 'role', 'employeeId']
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { firstName, lastName, email, phone, address, password, currentPassword, podName } = req.body;
        
        const userRepository = AppDataSource.getRepository(Employee);
        const user = await userRepository.findOne({ where: { id: req.user!.id } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If updating password, verify current password
        if (password && currentPassword) {
            const { comparePasswords, hashPassword } = await import('../utils/auth');
            const isCurrentPasswordValid = await comparePasswords(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }
            user.password = await hashPassword(password);
        }

        // Update other fields
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (email !== undefined) user.email = email;
        if (phone !== undefined) user.phone = phone;
        if (address !== undefined) user.address = address;
        if (podName !== undefined) user.podName = podName;

        await userRepository.save(user);

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Error updating user profile:', error);
        if (error instanceof Error && error.message.includes('duplicate key')) {
            res.status(400).json({ message: 'Email already exists' });
        } else {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
});

export default router;