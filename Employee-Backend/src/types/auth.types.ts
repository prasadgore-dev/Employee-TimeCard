import { Request } from 'express';
import { Employee } from "../entities/employee.entity";

export interface LoginCredentials {
    email: string;
    password: string;
}

export type PodName = "ADP1" | "ADP2" | "Loans1" | "Investments" | "Wheels" | "SME" | "CF360" | "Consent" | "Corporate" | "Horizontal" | "BALIC" | "CPR" | "Loans2";

export interface RegisterEmployeeDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    employeeId: string;
    podName: PodName;
    position: string;
    phone?: string;
}

export interface AuthResponse {
    token: string;
    user: Omit<Employee, 'password'>;
}

export interface DecodedToken {
    id: string;
    email: string;
    role: 'admin' | 'employee' | 'manager';
    iat: number;
    exp: number;
}

export interface AuthRequest extends Request {
    user?: DecodedToken;
}

export interface PasswordResetRequest {
    email: string;
}

export interface PasswordReset {
    token: string;
    newPassword: string;
}