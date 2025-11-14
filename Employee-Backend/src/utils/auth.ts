import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Employee } from '../entities/employee.entity';

export const generateToken = (user: Employee): string => {
    return jwt.sign(
        { 
            id: user.id,
            email: user.email,
            role: user.role 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
    );
};

export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

export const comparePasswords = async (
    password: string,
    hashedPassword: string
): Promise<boolean> => {
    return bcrypt.compare(password, hashedPassword);
};

export interface TokenPayload {
    id: string;
    email: string;
    role: 'admin' | 'employee';
}