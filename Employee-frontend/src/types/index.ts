export type PodName = "ADP1" | "ADP2" | "Loans1" | "Investments" | "Wheels" | "SME" | "CF360" | "Consent" | "Corporate" | "Horizontal" | "BALIC" | "CPR" | "Loans2";

export interface User {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'employee' | 'manager' | 'admin' | 'hr';
  podName: PodName;
  position: string;
  phone?: string;
  address?: string;
  joinDate: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface TimeEntry {
  id: string;
  userId: string;
  type: 'clock-in' | 'clock-out';
  timestamp: string;
  location?: 'Home' | 'Office';
}

export interface TimeCard {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut?: string | null;
  totalHours?: number;
  status: 'pending' | 'approved' | 'rejected';
  location?: 'Home' | 'Office' | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  status: 'todo' | 'ongoing' | 'completed' | 'in_progress';
  dueDate: string;
  startDate?: string;
  createdDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  userId: string;
  vacationDays: number;
  sickDays: number;
  personalDays: number;
  year: number;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  leaveType: 'vacation' | 'sick' | 'personal' | 'other';
  startDate: string;
  endDate: string;
  reason: string;
  backupSpoke?: string;
  dayCount?: number;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  managerNotes?: string;
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  podName?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

// Manager API response type for leave requests
export interface ManagerLeaveRequest {
  id: string;
  employeeName: string;
  podName: string;
  type: string;
  startDate: string;
  endDate: string;
  dayCount?: number;
  backupSpoke?: string;
  status: string;
  reason: string;
  notes?: string;
}