import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      const event = new CustomEvent('auth:unauthorized');
      window.dispatchEvent(event);
    }
    return Promise.reject(error);
  }
);

// Manager API Types
interface LeaveRequestReview {
  status: 'approved' | 'rejected';
  comments?: string;
}

const userApi = {
  updateProfile: async (data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    currentPassword?: string;
  }) => {
    const response = await api.put('/api/auth/profile', data);
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  }
};

const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
  },
  signup: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    podName: string;
    position: string;
  }) => {
    const response = await api.post('/api/auth/signup', userData);
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },
  updateProfile: async (data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    currentPassword?: string;
  }) => {
    const response = await api.put('/api/auth/profile', data);
    return response.data;
  },
  getAvailablePods: async (): Promise<string[]> => {
    const response = await api.get('/api/auth/pods');
    return response.data;
  },
  addPod: async (podName: string) => {
    const response = await api.post('/api/auth/pods', { podName });
    return response.data;
  },
  deletePod: async (podName: string) => {
    const response = await api.delete(`/api/auth/pods/${podName}`);
    return response.data;
  }
};

const timecardApi = {
  clockIn: async (location?: 'Home' | 'Office') => {
    const response = await api.post('/api/timecards/clock-in', { location });
    return response.data;
  },
  clockOut: async () => {
    const response = await api.post('/api/timecards/clock-out');
    return response.data;
  },
  getTimecard: async () => {
    const response = await api.get('/api/timecards/today');
    return response.data;
  },
  getTimecardHistory: async (startDate: string, endDate: string) => {
    const response = await api.get('/api/timecards/history', {
      params: { startDate, endDate },
    });
    return response.data;
  },
  exportTimecardHistory: async (startDate: string, endDate: string) => {
    const response = await api.get('/api/timecards/export', {
      params: { startDate, endDate },
      responseType: 'blob'
    });
    return response.data;
  }
};

const leaveApi = {
  submitRequest: async (leaveData: {
    leaveType: 'vacation' | 'sick' | 'personal' | 'other';
    startDate: string;
    endDate: string;
    reason: string;
    backupSpoke?: string;
    dayCount?: number;
  }) => {
    const response = await api.post('/api/leave', {
      ...leaveData,
      type: leaveData.leaveType // Map leaveType to type for backend compatibility
    });
    return response.data;
  },
  getRequests: async () => {
    const response = await api.get('/api/leave');
    return response.data;
  },
  getRequest: async (requestId: string) => {
    const response = await api.get(`/api/leave/${requestId}`);
    return response.data;
  },
  updateRequest: async (requestId: string, status: 'approved' | 'rejected', managerNotes?: string) => {
    const response = await api.put(`/api/leave/${requestId}`, { status, managerNotes });
    return response.data;
  }
};

const taskApi = {
  createTask: async (taskData: {
    title: string;
    description: string;
    estimatedHours: number;
    startDate?: string;
    dueDate: string;
  }) => {
    const response = await api.post('/api/tasks', taskData);
    return response.data;
  },
  updateTask: async (taskId: string, taskData: {
    title?: string;
    description?: string;
    estimatedHours?: number;
    startDate?: string;
    dueDate?: string;
  }) => {
    const response = await api.put(`/api/tasks/${taskId}`, taskData);
    return response.data;
  },
  deleteTask: async (taskId: string) => {
    const response = await api.delete(`/api/tasks/${taskId}`);
    return response.data;
  },
  getTasks: async (filters?: {
    status?: 'todo' | 'ongoing' | 'completed';
    assignedToId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    // Map 'ongoing' to 'in_progress' for backend filters
    const backendFilters = filters ? {
      ...filters,
      status: filters.status === 'ongoing' ? 'in_progress' as any : filters.status
    } : undefined;
    
    const response = await api.get('/api/tasks', { params: backendFilters });
    
    // Map 'in_progress' back to 'ongoing' for frontend
    const tasks = response.data.map((task: any) => ({
      ...task,
      status: task.status === 'in_progress' ? 'ongoing' : task.status
    }));
    
    return tasks;
  },
  updateTaskStatus: async (taskId: string, status: 'todo' | 'ongoing' | 'completed') => {
    // Map 'ongoing' to 'in_progress' for backend compatibility
    const backendStatus = status === 'ongoing' ? 'in_progress' : status;
    const response = await api.put(`/api/tasks/${taskId}/status`, { status: backendStatus });
    return response.data;
  }
};

// Manager API Types
interface LeaveRequestReview {
  status: 'approved' | 'rejected';
  comments?: string;
}

interface ManagerLeaveRequest {
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

const managerApi = {
  // Leave requests
  getLeaveRequests: async (): Promise<ManagerLeaveRequest[]> => {
    const response = await api.get('/api/manager/leave-requests');
    return response.data;
  },

  getLeaveRequest: async (requestId: string): Promise<ManagerLeaveRequest> => {
    const response = await api.get(`/api/manager/leave-requests/${requestId}`);
    return response.data;
  },

  reviewLeaveRequest: async (requestId: string, review: LeaveRequestReview): Promise<void> => {
    await api.put(`/api/manager/leave-requests/${requestId}/review`, review);
  },

  updateLeaveRequest: async (requestId: string, status: 'approved' | 'rejected', notes?: string): Promise<void> => {
    await api.put(`/api/manager/leave-requests/${requestId}`, { status, managerNotes: notes });
  },

  // Team and employee management
  getTeamAttendance: async (filters: {
    startDate?: string;
    endDate?: string;
    department?: string;
  }) => {
    const response = await api.get('/api/manager/attendance', {
      params: filters,
    });
    return response.data;
  },

  getDepartments: async () => {
    const response = await api.get('/api/manager/departments');
    return response.data;
  },

  getEmployeeStatuses: async () => {
    const response = await api.get('/api/manager/employee-statuses');
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/api/manager/dashboard-stats');
    return response.data;
  },

  getEmployeeDetails: async (employeeId: string) => {
    const response = await api.get(`/api/manager/employees/${employeeId}`);
    return response.data;
  },

  getEmployeeTimecards: async (employeeId: string, startDate: string, endDate: string) => {
    const response = await api.get(`/api/manager/employees/${employeeId}/timecards`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  getEmployeeTasks: async (employeeId: string) => {
    const response = await api.get(`/api/manager/employees/${employeeId}/tasks`);
    return response.data;
  },
};

const adminApi = {
  updateEmployeePod: async (employeeId: string, podName: string) => {
    const response = await api.put(`/api/employees/${employeeId}/pod`, { podName });
    return response.data;
  },
};

// Re-export api instance and all service APIs
export { api as default, userApi, timecardApi, leaveApi, taskApi, managerApi, authApi, adminApi };