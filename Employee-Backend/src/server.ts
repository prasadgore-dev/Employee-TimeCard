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
import azureTaskRoutes from './routes/azureTaskRoutes';
import { AppDataSource } from './config/data-source';

dotenv.config();

const app: Express = express();

// CORS configuration with allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5174', 'http://localhost:5173', 'https://employee-timecard-1.onrender.com'];

// Middleware
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/timecards', timecardRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/azure-tasks', azureTaskRoutes);

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