# Employee TimeCard Management System

A comprehensive employee time tracking and management system built with React, TypeScript, Node.js, and PostgreSQL.

## 📋 Features

- **Employee Time Tracking**: Clock in/out with location selection (Home/Office)
- **Task Management**: Assign and track employee tasks with due dates
- **Leave Management**: Submit and approve leave requests
- **Manager Dashboard**: View employee statuses, attendance, and performance
- **Timecard History**: Export employee reports to Excel
- **Role-based Access**: Admin, Manager, and Employee roles with different permissions

## 🏗️ Project Structure

```
Employee TimeCard/
├── Employee-Backend/     # Node.js + TypeScript backend with TypeORM
├── Employee-frontend/    # React + TypeScript frontend with Material-UI
├── ARCHITECTURE.md       # Detailed system architecture
└── HIGH-LEVEL-ARCHITECTURE.md  # High-level system overview
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd Employee-Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your PostgreSQL credentials

5. Run database migrations:
   ```bash
   npm run migration:run
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd Employee-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:5173`

## 🔑 Default Credentials

After setting up the database, you can use the default admin credentials:
- **Email**: admin@example.com
- **Password**: admin123

## 📚 Documentation

- [Architecture Documentation](./ARCHITECTURE.md) - Detailed system architecture
- [High-Level Architecture](./HIGH-LEVEL-ARCHITECTURE.md) - System overview
- [Backend README](./Employee-Backend/README.md) - Backend-specific documentation
- [Frontend README](./Employee-frontend/README.md) - Frontend-specific documentation

## 🛠️ Technologies Used

### Backend
- Node.js + TypeScript
- Express.js
- TypeORM
- PostgreSQL
- JWT Authentication
- bcrypt

### Frontend
- React 18
- TypeScript
- Material-UI (MUI)
- Redux Toolkit
- React Router
- Vite
- XLSX (Excel export)

## 📝 License

This project is licensed under the MIT License.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
