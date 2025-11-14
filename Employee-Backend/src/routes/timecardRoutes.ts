import { Router } from 'express';
import { authenticateToken, requireRole, requireOwnershipOrAdmin, AuthRequest } from '../middleware/authMiddleware';
import { AppDataSource } from '../config/data-source';
import { TimeCard } from '../entities/timecard.entity';
import { Between } from 'typeorm';

const router = Router();
const timecardRepository = AppDataSource.getRepository(TimeCard);

// Get timecard history
// Get today's timecard
router.get('/today', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const timecard = await timecardRepository.findOne({
            where: {
                employeeId: req.user!.id,
                date: today
            }
        });

        res.json(timecard || null);
    } catch (error) {
        console.error('Error fetching today\'s timecard:', error);
        res.status(500).json({ message: 'Error fetching today\'s timecard' });
    }
});

router.get('/history', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const timecards = await timecardRepository.find({
            where: {
                employeeId: req.user!.id,
                date: Between(start, end)
            },
            order: {
                date: 'DESC',
                clockIn: 'DESC'
            }
        });

        res.json(timecards);
    } catch (error) {
        console.error('Error fetching timecard history:', error);
        res.status(500).json({ message: 'Error fetching timecard history' });
    }
});

// Clock In
router.post('/clock-in', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { location } = req.body;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already clocked in today
        const existingTimecard = await timecardRepository.findOne({
            where: {
                employeeId: req.user!.id,
                date: today
            }
        });

        if (existingTimecard) {
            return res.status(400).json({ message: 'Already clocked in today' });
        }

        const timecard = timecardRepository.create({
            employeeId: req.user!.id,
            date: today,
            clockIn: new Date(),
            location: location || null,
            status: 'pending'
        });

        await timecardRepository.save(timecard);
        res.status(201).json(timecard);
    } catch (error) {
        res.status(500).json({ message: 'Error clocking in' });
    }
});

// Clock Out
router.post('/clock-out', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const timecard = await timecardRepository.findOne({
            where: {
                employeeId: req.user!.id,
                date: today
            }
        });

        if (!timecard) {
            return res.status(404).json({ message: 'No clock-in record found for today' });
        }

        if (timecard.clockOut) {
            return res.status(400).json({ message: 'Already clocked out' });
        }

        const clockOut = new Date();
        const totalHours = (clockOut.getTime() - timecard.clockIn.getTime()) / (1000 * 60 * 60);

        timecard.clockOut = clockOut;
        timecard.totalHours = Math.round(totalHours * 100) / 100; // Round to 2 decimal places

        await timecardRepository.save(timecard);
        res.json(timecard);
    } catch (error) {
        res.status(500).json({ message: 'Error clocking out' });
    }
});

// Get timecards for a date range (admin can see all, employees see only their own)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate as string) : new Date();
        const end = endDate ? new Date(endDate as string) : new Date();
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const queryOptions: any = {
            where: {
                date: Between(start, end)
            },
            relations: ['employee'],
            order: {
                date: 'DESC',
                clockIn: 'DESC'
            }
        };

        // If not admin, only show own timecards
        if (req.user!.role !== 'admin') {
            queryOptions.where.employeeId = req.user!.id;
        }

        const timecards = await timecardRepository.find(queryOptions);
        res.json(timecards);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching timecards' });
    }
});

// Approve/Reject timecard (admin only)
router.patch('/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const timecard = await timecardRepository.findOne({
            where: { id: req.params.id }
        });

        if (!timecard) {
            return res.status(404).json({ message: 'Timecard not found' });
        }

        timecard.status = status;
        await timecardRepository.save(timecard);
        res.json({ message: `Timecard ${status}` });
    } catch (error) {
        res.status(500).json({ message: 'Error updating timecard status' });
    }
});

export default router;