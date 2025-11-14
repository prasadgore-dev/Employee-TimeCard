import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, requireRole, requireOwnershipOrAdmin, AuthRequest } from '../middleware/authMiddleware';
import { AppDataSource } from '../config/data-source';
import { LeaveRequest } from '../entities/leave-request.entity';
import { Between } from 'typeorm';
import { body, validationResult } from 'express-validator';

const router = Router();
const leaveRequestRepository = AppDataSource.getRepository(LeaveRequest);

// Validation middleware
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Validation rules for leave request
const leaveRequestValidation = [
    body('startDate').notEmpty().withMessage('Start date is required'),
    body('endDate').notEmpty().withMessage('End date is required'),
    body(['type', 'leaveType']).isIn(['vacation', 'sick', 'personal', 'other']).withMessage('Invalid leave type'),
    body('reason').notEmpty().withMessage('Reason is required')
];

// Submit leave request
router.post('/', authenticateToken, leaveRequestValidation, validateRequest, async (req: AuthRequest, res: Response) => {
    try {
        const { startDate, endDate, type, leaveType, reason, backupSpoke, dayCount } = req.body;
        const finalType = type || leaveType; // Use type if provided, otherwise use leaveType

        if (!startDate || !endDate || !finalType || !reason) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Validate dates
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);

        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        if (endDateObj < startDateObj) {
            return res.status(400).json({ message: 'End date cannot be before start date' });
        }

        // Check for overlapping leave requests
        const overlapping = await leaveRequestRepository.findOne({
            where: {
                employeeId: req.user!.id,
                status: 'approved',
                startDate: Between(startDateObj, endDateObj)
            }
        });

        if (overlapping) {
            return res.status(400).json({ message: 'You already have approved leave during this period' });
        }

        const leaveRequest = leaveRequestRepository.create({
            employeeId: req.user!.id,
            startDate: startDateObj,
            endDate: endDateObj,
            leaveType: finalType,
            reason,
            backupSpoke: backupSpoke || null,
            dayCount: dayCount || null,
            status: 'pending'
        });

        await leaveRequestRepository.save(leaveRequest);
        res.status(201).json(leaveRequest);
    } catch (error) {
        res.status(500).json({ message: 'Error submitting leave request' });
    }
});

// Get leave requests (admin sees all, employees see only their own)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        const queryOptions: any = {
            where: {},
            relations: ['employee', 'approvedBy'],
            order: {
                startDate: 'DESC'
            }
        };

        // Filter by date range if provided
        if (startDate && endDate) {
            queryOptions.where.startDate = Between(
                new Date(startDate as string),
                new Date(endDate as string)
            );
        }

        // Filter by status if provided
        if (status && ['pending', 'approved', 'rejected'].includes(status as string)) {
            queryOptions.where.status = status;
        }

        // If not admin, only show own requests
        if (req.user!.role !== 'admin') {
            queryOptions.where.employeeId = req.user!.id;
        }

        const requests = await leaveRequestRepository.find(queryOptions);
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leave requests' });
    }
});


// Get single leave request
router.get('/:id', authenticateToken, requireOwnershipOrAdmin(req => req.params.id), async (req, res) => {
    try {
        const request = await leaveRequestRepository.findOne({
            where: { id: req.params.id },
            relations: ['employee', 'approvedBy']
        });

        if (!request) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leave request' });
    }
});

// Approve/Reject leave request (admin only)
router.patch('/:id/status', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
        const { status, managerNotes } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const request = await leaveRequestRepository.findOne({
            where: { id: req.params.id }
        });

        if (!request) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: `Leave request has already been ${request.status}` });
        }

        request.status = status;
        request.managerNotes = managerNotes;
        request.approvedById = req.user!.id;

        await leaveRequestRepository.save(request);
        res.json({ message: `Leave request ${status}` });
    } catch (error) {
        res.status(500).json({ message: 'Error updating leave request status' });
    }
});

// Cancel leave request (only if pending)
router.delete('/:id', authenticateToken, requireOwnershipOrAdmin(req => req.params.id), async (req, res) => {
    try {
        const request = await leaveRequestRepository.findOne({
            where: { id: req.params.id }
        });

        if (!request) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Cannot cancel a processed leave request' });
        }

        await leaveRequestRepository.remove(request);
        res.json({ message: 'Leave request cancelled' });
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling leave request' });
    }
});

export default router;