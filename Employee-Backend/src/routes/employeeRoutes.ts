import { Router } from 'express';
import { authenticateToken, requireRole, requireOwnershipOrAdmin, AuthRequest } from '../middleware/authMiddleware';
import { AppDataSource } from '../config/data-source';
import { Employee } from '../entities/employee.entity';
import { TimeCard } from '../entities/timecard.entity';
import { LeaveRequest } from '../entities/leave-request.entity';
import { Task } from '../entities/task.entity';

const router = Router();
const employeeRepository = AppDataSource.getRepository(Employee);
const timecardRepository = AppDataSource.getRepository(TimeCard);
const leaveRequestRepository = AppDataSource.getRepository(LeaveRequest);
const taskRepository = AppDataSource.getRepository(Task);

// Get all employees (admin only)
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const employees = await employeeRepository.find({
            select: ['id', 'firstName', 'lastName', 'email', 'role', 'podName', 'position', 'employeeId', 'createdAt']
        });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching employees' });
    }
});

// Get employee by ID (admin or self)
router.get('/:id', authenticateToken, requireOwnershipOrAdmin(req => req.params.id), async (req, res) => {
    try {
        const employee = await employeeRepository.findOne({
            where: { id: req.params.id },
            select: ['id', 'firstName', 'lastName', 'email', 'role', 'podName', 'position', 'createdAt']
        });

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.json(employee);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching employee' });
    }
});

// Update employee (admin or self)
router.put('/:id', authenticateToken, requireOwnershipOrAdmin(req => req.params.id), async (req: AuthRequest, res) => {
    try {
        const employee = await employeeRepository.findOne({ where: { id: req.params.id } });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Admin can update any field, employees can only update certain fields
        const allowedFields = (req.user as Employee).role === 'admin' 
            ? ['firstName', 'lastName', 'email', 'podName', 'position', 'role']
            : ['firstName', 'lastName', 'email'];

        const updates = Object.keys(req.body)
            .filter(key => allowedFields.includes(key))
            .reduce((obj: any, key) => {
                obj[key] = req.body[key];
                return obj;
            }, {});

        await employeeRepository.update(req.params.id, updates);
        res.json({ message: 'Employee updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating employee' });
    }
});

// Update employee role (admin only)
router.put('/:id/role', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
        const { role } = req.body;

        // Validate role
        if (!role || !['employee', 'manager', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Must be employee, manager, or admin.' });
        }

        const employee = await employeeRepository.findOne({ where: { id: req.params.id } });
        
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Update the role
        await employeeRepository.update(req.params.id, { role });

        const updatedEmployee = await employeeRepository.findOne({
            where: { id: req.params.id },
            select: ['id', 'firstName', 'lastName', 'email', 'role', 'podName', 'position']
        });

        res.json({ 
            message: 'Role updated successfully',
            employee: updatedEmployee
        });
    } catch (error) {
        console.error('Error updating employee role:', error);
        res.status(500).json({ message: 'Error updating employee role' });
    }
});

// Update employee POD (admin only)
router.put('/:id/pod', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
        const { podName } = req.body;

        if (!podName) {
            return res.status(400).json({ message: 'POD name is required' });
        }

        const employee = await employeeRepository.findOne({ where: { id: req.params.id } });
        
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Update the POD
        await employeeRepository.update(req.params.id, { podName });

        const updatedEmployee = await employeeRepository.findOne({
            where: { id: req.params.id },
            select: ['id', 'firstName', 'lastName', 'email', 'role', 'podName', 'position']
        });

        res.json({ 
            message: 'POD updated successfully',
            employee: updatedEmployee
        });
    } catch (error) {
        console.error('Error updating employee POD:', error);
        res.status(500).json({ message: 'Error updating employee POD' });
    }
});

// Delete employee (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const currentUserId = (req.user as Employee).id;

        // Prevent admin from deleting themselves
        if (id === currentUserId) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }

        const employee = await employeeRepository.findOne({ where: { id } });
        
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Delete related records first
        // Delete timecards
        await timecardRepository.delete({ employeeId: id });

        // Delete leave requests (as employee)
        await leaveRequestRepository.delete({ employeeId: id });

        // Update leave requests (as approver) - set approvedById to null
        await leaveRequestRepository
            .createQueryBuilder()
            .update(LeaveRequest)
            .set({ approvedById: null as any })
            .where("approvedById = :id", { id })
            .execute();

        // Delete tasks (assigned to)
        await taskRepository.delete({ assignedToId: id });

        // Update tasks (assigned by) - set assignedById to null
        await taskRepository
            .createQueryBuilder()
            .update(Task)
            .set({ assignedById: null as any })
            .where("assignedById = :id", { id })
            .execute();

        // Finally, delete the employee
        await employeeRepository.remove(employee);

        res.json({ 
            message: 'Employee deleted successfully',
            deletedId: id
        });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ message: 'Error deleting employee' });
    }
});

export default router;