export interface IEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'employee' | 'admin';
  department: string;
  position: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITimeCard {
  id: string;
  employeeId: string;
  date: Date;
  clockIn: Date;
  clockOut: Date | null;
  totalHours: number;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}