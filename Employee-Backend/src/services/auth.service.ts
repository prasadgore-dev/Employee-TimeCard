import { AppDataSource } from '../config/data-source';
import { Employee } from '../entities/employee.entity';
import { LoginCredentials, RegisterEmployeeDto, AuthResponse, DecodedToken } from '../types/auth.types';
import { generateToken, hashPassword, comparePasswords } from '../utils/auth';
import * as jwt from 'jsonwebtoken';

export class AuthService {
    private employeeRepository = AppDataSource.getRepository(Employee);

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const { email, password } = credentials;
        
        console.log('Login attempt:', { email }); // Debug log
        
        const employee = await this.employeeRepository.findOne({ 
            where: { email } 
        });

        console.log('Employee found:', employee ? 'yes' : 'no'); // Debug log

        if (!employee) {
            throw new Error('Invalid credentials - user not found');
        }

        const isPasswordValid = await comparePasswords(password, employee.password);
        console.log('Password valid:', isPasswordValid); // Debug log
        
        if (!isPasswordValid) {
            throw new Error('Invalid credentials - invalid password');
        }

        const token = generateToken(employee);
        const { password: _, ...userWithoutPassword } = employee;

        return {
            token,
            user: userWithoutPassword
        };
    }

    async register(employeeData: RegisterEmployeeDto): Promise<AuthResponse> {
        // Check for existing email
        const existingEmail = await this.employeeRepository.findOne({
            where: { email: employeeData.email }
        });

        if (existingEmail) {
            throw new Error('Email already exists');
        }

        // Check for existing employee ID
        const existingEmployeeId = await this.employeeRepository.findOne({
            where: { employeeId: employeeData.employeeId }
        });

        if (existingEmployeeId) {
            throw new Error('Employee ID already exists');
        }

        const hashedPassword = await hashPassword(employeeData.password);

        const newEmployee = this.employeeRepository.create({
            ...employeeData,
            password: hashedPassword,
            role: 'employee' // Default role for new registrations
        });

        await this.employeeRepository.save(newEmployee);

        const token = generateToken(newEmployee);
        const { password: _, ...userWithoutPassword } = newEmployee;

        return {
            token,
            user: userWithoutPassword
        };
    }

    async validateToken(token: string): Promise<Employee | null> {
        try {
            const employee = await this.employeeRepository.findOne({
                where: { id: token }
            });
            return employee;
        } catch (error) {
            return null;
        }
    }

    async requestPasswordReset(email: string): Promise<string> {
        const employee = await this.employeeRepository.findOne({ 
            where: { email } 
        });

        if (!employee) {
            throw new Error('No account found with this email');
        }

        // Generate reset token (valid for 1 hour)
        const resetToken = jwt.sign(
            { id: employee.id, email: employee.email },
            process.env.JWT_SECRET!,
            { expiresIn: '1h' }
        );

        // In a real application, send this token via email
        // For now, we'll console.log it (remove in production!)
        console.log('Password reset token:', resetToken);
        console.log('Reset link would be:', `http://localhost:3000/reset-password?token=${resetToken}`);

        return resetToken;
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
            const employee = await this.employeeRepository.findOne({
                where: { id: decoded.id }
            });

            if (!employee) {
                throw new Error('Invalid token');
            }

            // Hash new password
            const hashedPassword = await hashPassword(newPassword);
            employee.password = hashedPassword;

            // Save new password
            await this.employeeRepository.save(employee);
        } catch (error) {
            throw new Error('Invalid or expired reset token');
        }
    }
}