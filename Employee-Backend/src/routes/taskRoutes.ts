import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, requireRole, requireOwnershipOrAdmin, AuthRequest } from '../middleware/authMiddleware';
import { AppDataSource } from '../config/data-source';
import { Task } from '../entities/task.entity';
import { body, validationResult } from 'express-validator';

const router = Router();
const taskRepository = AppDataSource.getRepository(Task);

// Validation middleware
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Validation rules for task
const taskValidation = [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('estimatedHours')
        .notEmpty()
        .withMessage('Estimated hours is required')
        .isFloat({ min: 0.1 })
        .withMessage('Estimated hours must be greater than 0'),
    body('dueDate')
        .notEmpty()
        .withMessage('Due date is required')
        .isISO8601()
        .withMessage('Due date must be a valid date'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('Priority must be low, medium, or high'),
    body('assignedToId')
        .optional()
        .isUUID()
        .withMessage('Invalid assignee ID format')
];

// Create task (accessible to all authenticated users)
router.post('/', authenticateToken, requireRole(['admin', 'manager', 'employee']), taskValidation, validateRequest, async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, assignedToId, priority, dueDate, startDate, estimatedHours } = req.body;

        // Check if user has permission to assign tasks to others
        if (assignedToId && req.user!.role === 'employee' && assignedToId !== req.user!.id) {
            return res.status(403).json({ 
                message: 'Employees can only create tasks for themselves' 
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const taskData: any = {
            title,
            description,
            assignedToId: assignedToId || req.user!.id, // If no assignee specified, assign to creator
            assignedById: req.user!.id,
            priority: priority || 'medium', // Default priority
            dueDate: new Date(dueDate),
            createdDate: today, // Set created date to today
            estimatedHours: Number(estimatedHours),
            status: 'todo'
        };

        if (startDate) {
            taskData.startDate = new Date(startDate);
        }

        const task = taskRepository.create(taskData);

        await taskRepository.save(task);
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Error creating task' });
    }
});

// Get tasks (admin sees all, employees see assigned tasks)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { status, priority, dueDate, startDate, endDate } = req.query;
        const queryBuilder = taskRepository.createQueryBuilder('task')
            .leftJoinAndSelect('task.assignedTo', 'assignedTo')
            .leftJoinAndSelect('task.assignedBy', 'assignedBy')
            .orderBy('task.dueDate', 'ASC')
            .addOrderBy('task.createdAt', 'DESC');

        // Apply filters
        if (status && ['todo', 'in_progress', 'completed', 'blocked'].includes(status as string)) {
            queryBuilder.andWhere('task.status = :status', { status });
        }
        if (priority && ['low', 'medium', 'high'].includes(priority as string)) {
            queryBuilder.andWhere('task.priority = :priority', { priority });
        }
        
        // Handle date filtering
        if (startDate && endDate) {
            // Date range filter for dashboard (filter by createdDate)
            const start = new Date(startDate as string);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate as string);
            end.setHours(23, 59, 59, 999);
            queryBuilder.andWhere('task.createdDate BETWEEN :startDate AND :endDate', { 
                startDate: start, 
                endDate: end 
            });
        } else if (dueDate) {
            // Single date filter (backward compatibility - filter by createdDate)
            const date = new Date(dueDate as string);
            date.setHours(0, 0, 0, 0);
            const endOfDay = new Date(dueDate as string);
            endOfDay.setHours(23, 59, 59, 999);
            queryBuilder.andWhere('task.createdDate BETWEEN :startOfDay AND :endOfDay', { 
                startOfDay: date, 
                endOfDay: endOfDay 
            });
        }

        // If not admin, only show assigned tasks
        if (req.user!.role !== 'admin') {
            queryBuilder.andWhere('task.assignedToId = :userId', { userId: req.user!.id });
        }

        const tasks = await queryBuilder.getMany();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tasks' });
    }
});

// Get single task
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const task = await taskRepository.findOne({
            where: { id: req.params.id },
            relations: ['assignedTo', 'assignedBy']
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user has access to this task
        if (req.user!.role !== 'admin' && task.assignedToId !== req.user!.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching task' });
    }
});

// Update task status (assignee or admin)
router.put('/:id/status', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.body;
        if (!['todo', 'in_progress', 'completed', 'blocked'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const task = await taskRepository.findOne({
            where: { id: req.params.id }
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user can update this task
        if (req.user!.role !== 'admin' && task.assignedToId !== req.user!.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        task.status = status;
        if (status === 'completed') {
            task.completedAt = new Date();
        }

        await taskRepository.save(task);
        res.json({ message: 'Task status updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating task status' });
    }
});

// Update task (owner or admin)
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const task = await taskRepository.findOne({
            where: { id: req.params.id }
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user has permission to update this task
        if (req.user!.role !== 'admin' && task.assignedToId !== req.user!.id && task.assignedById !== req.user!.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { title, description, dueDate, startDate, estimatedHours, priority } = req.body;

        // Update the task fields
        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (dueDate !== undefined) task.dueDate = new Date(dueDate);
        if (startDate !== undefined) {
            task.startDate = startDate ? new Date(startDate) : undefined as any;
        }
        if (estimatedHours !== undefined) task.estimatedHours = Number(estimatedHours);
        if (priority !== undefined) task.priority = priority;

        await taskRepository.save(task);
        res.json({ message: 'Task updated', task });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Error updating task' });
    }
});

// Delete task (owner or admin)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const task = await taskRepository.findOne({
            where: { id: req.params.id }
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user has permission to delete this task
        if (req.user!.role !== 'admin' && task.assignedToId !== req.user!.id && task.assignedById !== req.user!.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await taskRepository.remove(task);
        res.json({ message: 'Task deleted' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Error deleting task' });
    }
});

export default router;