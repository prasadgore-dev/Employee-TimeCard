import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';
import { AppDataSource } from '../config/data-source';
import { Employee } from '../entities/employee.entity';
import { TimeCard } from '../entities/timecard.entity';
import { LeaveRequest } from '../entities/leave-request.entity';
import { Task } from '../entities/task.entity';
import { Between, In, IsNull } from 'typeorm';
import type { AuthRequest } from '../types/auth.types';

const router = Router();

// Get all employee statuses (requires manager role)
// Get dashboard statistics
router.get('/dashboard-stats', authenticateToken, requireRole(['manager', 'admin'] as const), async (req: AuthRequest, res) => {
    try {
        // Get total number of employees
        const totalEmployees = await AppDataSource.getRepository(Employee).count({
            where: { role: 'employee' }
        });

        // Get pending leave requests
        const pendingLeaveRequests = await AppDataSource.getRepository(LeaveRequest).count({
            where: { status: 'pending' }
        });

        // Get POD statistics
        const pods = await AppDataSource
            .getRepository(Employee)
            .createQueryBuilder('employee')
            .select('employee.podName', 'name')
            .addSelect('COUNT(*)', 'count')
            .where('employee.role = :role', { role: 'employee' })
            .groupBy('employee.podName')
            .getRawMany();

        res.json({
            totalEmployees,
            podStats: pods.map(pod => ({
                name: pod.name || 'Unassigned',
                count: parseInt(pod.count, 10)
            })),
            pendingLeaveRequests
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Error fetching dashboard statistics' });
    }
});

router.get('/employee-statuses', authenticateToken, requireRole(['manager', 'admin'] as const), async (req: AuthRequest, res) => {
    try {
        const employees = await AppDataSource.getRepository(Employee).find({
            where: {
                role: In(['employee'])
            },
            select: ['id', 'firstName', 'lastName', 'email', 'podName', 'position']
        });

        // Get today's timecards
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const timecards = await AppDataSource.getRepository(TimeCard).find({
            where: {
                date: Between(today, tomorrow),
                employeeId: In(employees.map(e => e.id))
            }
        });

        const employeeStatuses = employees.map(employee => {
            const timecard = timecards.find(t => t.employeeId === employee.id);
            return {
                ...employee,
                status: timecard && !timecard.clockOut ? 'clocked_in' : 'clocked_out',
                lastClockIn: timecard?.clockIn,
                lastClockOut: timecard?.clockOut,
                currentLocation: timecard && !timecard.clockOut ? timecard.location : null
            };
        });

        res.json(employeeStatuses);
    } catch (error) {
        console.error('Error fetching employee statuses:', error);
        res.status(500).json({ message: 'Error fetching employee statuses' });
    }
});

// Get dashboard statistics (requires manager role)
router.get('/dashboard-stats', authenticateToken, requireRole(['manager', 'admin']), async (req: AuthRequest, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get all stats in parallel
        const [totalEmployees, clockedInCount, pendingLeaveRequests, tasksInProgress] = await Promise.all([
            // Count total employees
            AppDataSource.getRepository(Employee).count({
                where: { role: 'employee' }
            }),
            // Count employees currently clocked in
            AppDataSource.getRepository(TimeCard)
                .createQueryBuilder('timecard')
                .where('timecard.date BETWEEN :today AND :tomorrow', { today, tomorrow })
                .andWhere('timecard.clockOut IS NULL')
                .getCount(),
            // Count pending leave requests
            AppDataSource.getRepository(LeaveRequest)
                .createQueryBuilder('leave')
                .where('leave.status = :status', { status: 'pending' })
                .getCount(),
            // Count tasks in progress
            AppDataSource.getRepository(Task)
                .createQueryBuilder('task')
                .where('task.status = :status', { status: 'in_progress' })
                .getCount()
        ]);

        const stats = {
            totalEmployees,
            clockedIn: clockedInCount,
            pendingLeaveRequests,
            tasksInProgress
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Error fetching dashboard statistics' });
    }
});

// Get all leave requests
router.get('/leave-requests', authenticateToken, requireRole(['manager', 'admin']), async (req: AuthRequest, res) => {
    try {
        const leaveRequests = await AppDataSource.getRepository(LeaveRequest)
            .createQueryBuilder('leave')
            .leftJoinAndSelect('leave.employee', 'employee')
            .orderBy('leave.createdAt', 'DESC')
            .getMany();

        const formattedRequests = leaveRequests.map(request => ({
            id: request.id,
            employeeName: `${request.employee.firstName} ${request.employee.lastName}`,
            podName: request.employee.podName,
            type: request.leaveType,
            startDate: request.startDate,
            endDate: request.endDate,
            dayCount: request.dayCount,
            backupSpoke: request.backupSpoke,
            status: request.status,
            reason: request.reason,
            notes: request.managerNotes
        }));

        res.json(formattedRequests);
    } catch (error) {
        console.error('Error fetching leave requests:', error);
        res.status(500).json({ message: 'Error fetching leave requests' });
    }
});

// Get a specific leave request
router.get('/leave-requests/:id', authenticateToken, requireRole(['manager', 'admin']), async (req: AuthRequest, res) => {
    try {
        const request = await AppDataSource.getRepository(LeaveRequest)
            .createQueryBuilder('leave')
            .leftJoinAndSelect('leave.employee', 'employee')
            .where('leave.id = :id', { id: req.params.id })
            .select([
                'leave.id',
                'leave.startDate',
                'leave.endDate',
                'leave.leaveType',
                'leave.reason',
                'leave.status',
                'leave.managerNotes',
                'employee.firstName',
                'employee.lastName',
                'employee.podName'
            ])
            .getOne();

        if (!request) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        const formattedRequest = {
            id: request.id,
            employeeName: `${request.employee.firstName} ${request.employee.lastName}`,
            podName: request.employee.podName,
            type: request.leaveType,
            startDate: request.startDate,
            endDate: request.endDate,
            status: request.status,
            reason: request.reason,
            notes: request.managerNotes
        };

        res.json(formattedRequest);
    } catch (error) {
        console.error('Error fetching leave request:', error);
        res.status(500).json({ message: 'Error fetching leave request' });
    }
});

// Review (approve/reject) a leave request
router.put('/leave-requests/:id/review', authenticateToken, requireRole(['manager', 'admin']), async (req: AuthRequest, res) => {
    try {
        const { status, comments } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const leaveRequest = await AppDataSource.getRepository(LeaveRequest).findOne({
            where: { id: req.params.id }
        });

        if (!leaveRequest) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        if (leaveRequest.status !== 'pending') {
            return res.status(400).json({ message: 'Can only review pending requests' });
        }

        await AppDataSource.getRepository(LeaveRequest).update(req.params.id, {
            status,
            managerNotes: comments,
            approvedById: req.user?.id || ''
        });

        res.json({ message: `Leave request ${status}` });
    } catch (error) {
        console.error('Error reviewing leave request:', error);
        res.status(500).json({ message: 'Error reviewing leave request' });
    }
});

// Get employee details
router.get('/employees/:employeeId', authenticateToken, requireRole(['manager', 'admin'] as const), async (req: AuthRequest, res) => {
    try {
        const { employeeId } = req.params;
        
        const employee = await AppDataSource.getRepository(Employee).findOne({
            where: { id: employeeId },
            select: ['id', 'firstName', 'lastName', 'email', 'podName', 'position', 'role', 'employeeId']
        });

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.json(employee);
    } catch (error) {
        console.error('Error fetching employee details:', error);
        res.status(500).json({ message: 'Error fetching employee details' });
    }
});

// Get employee timecards for a date range
router.get('/employees/:employeeId/timecards', authenticateToken, requireRole(['manager', 'admin'] as const), async (req: AuthRequest, res) => {
    try {
        const { employeeId } = req.params;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required' });
        }

        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const timecards = await AppDataSource.getRepository(TimeCard).find({
            where: {
                employeeId,
                date: Between(start, end)
            },
            order: {
                date: 'DESC',
                clockIn: 'DESC'
            }
        });

        res.json(timecards);
    } catch (error) {
        console.error('Error fetching employee timecards:', error);
        res.status(500).json({ message: 'Error fetching employee timecards' });
    }
});

// Get employee tasks
router.get('/employees/:employeeId/tasks', authenticateToken, requireRole(['manager', 'admin'] as const), async (req: AuthRequest, res) => {
    try {
        const { employeeId } = req.params;
        
        const tasks = await AppDataSource.getRepository(Task).find({
            where: { assignedToId: employeeId },
            order: { createdAt: 'DESC' }
        });

        res.json(tasks);
    } catch (error) {
        console.error('Error fetching employee tasks:', error);
        res.status(500).json({ message: 'Error fetching employee tasks' });
    }
});

export default router;