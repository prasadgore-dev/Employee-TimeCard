import { Router, Request, Response } from 'express';
import { azureDevOpsService } from '../services/azure-devops.service';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

/**
 * GET /api/azure-tasks/my-tasks
 * Fetch Azure DevOps tasks for the authenticated employee
 */
router.get('/my-tasks', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const employeeEmail = req.user?.email;
    
    if (!employeeEmail) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const tasks = await azureDevOpsService.getEmployeeTasks(employeeEmail);
    
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching employee Azure tasks:', error);
    res.status(500).json({ message: 'Failed to fetch Azure DevOps tasks' });
  }
});

/**
 * GET /api/azure-tasks/employee/:employeeId
 * Fetch Azure DevOps tasks for a specific employee (Manager only)
 */
router.get('/employee/:employeeId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    
    // Only managers and admins can view other employees' tasks
    if (userRole !== 'manager' && userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Manager or Admin role required.' });
    }

    const { employeeId } = req.params;
    
    // Get employee email from database
    const { AppDataSource } = require('../config/data-source');
    const { Employee } = require('../entities/employee.entity');
    const employeeRepository = AppDataSource.getRepository(Employee);
    
    const employee = await employeeRepository.findOne({ where: { id: employeeId } });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    const tasks = await azureDevOpsService.getEmployeeTasks(employee.email);
    
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching employee Azure tasks:', error);
    res.status(500).json({ message: 'Failed to fetch Azure DevOps tasks' });
  }
});

/**
 * GET /api/azure-tasks/all
 * Fetch all Azure DevOps tasks (Manager/Admin only)
 */
router.get('/all', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    
    // Only managers and admins can view all tasks
    if (userRole !== 'manager' && userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Manager or Admin role required.' });
    }
    
    const tasks = await azureDevOpsService.getAllTasks();
    
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching all Azure tasks:', error);
    res.status(500).json({ message: 'Failed to fetch Azure DevOps tasks' });
  }
});

/**
 * GET /api/azure-tasks/test-connection
 * Test Azure DevOps connection (Admin only)
 */
router.get('/test-connection', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    
    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    
    const isConnected = await azureDevOpsService.testConnection();
    
    res.json({ 
      connected: isConnected,
      message: isConnected ? 'Azure DevOps connection successful' : 'Azure DevOps connection failed'
    });
  } catch (error) {
    console.error('Error testing Azure connection:', error);
    res.status(500).json({ message: 'Failed to test Azure DevOps connection' });
  }
});

export default router;
