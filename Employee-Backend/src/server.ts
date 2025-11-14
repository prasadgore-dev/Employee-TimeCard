import "reflect-metadata";
import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import employeeRoutes from './routes/employeeRoutes';
import timecardRoutes from './routes/timecardRoutes';
import leaveRoutes from './routes/leaveRoutes';
import taskRoutes from './routes/taskRoutes';
import managerRoutes from './routes/managerRoutes';
import { AppDataSource } from './config/data-source';

dotenv.config();

const app: Express = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:5174', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/timecards', timecardRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/manager', managerRoutes);

// Error handling
app.use(errorHandler);

const PORT: number = parseInt(process.env.PORT || '5000', 10);

// Initialize TypeORM connection
AppDataSource.initialize()
  .then(() => {
    console.log('Connected to PostgreSQL database');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error: Error) => {
    console.error('Error connecting to database:', error);
    process.exit(1);
  });

export default app;