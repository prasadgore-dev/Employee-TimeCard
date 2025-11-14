# Employee TimeCard Backend

RESTful API backend service for the Employee TimeCard Management System built with **Express.js**, **TypeScript**, **TypeORM**, and **PostgreSQL**.

## 🚀 Features

- **RESTful API** with Express.js and TypeScript
- **PostgreSQL Database** with TypeORM ORM
- **JWT Authentication** for secure access
- **Role-Based Access Control** (Admin, Manager, Employee)
- **Input Validation** with express-validator
- **Dynamic POD Management** with PostgreSQL enums
- **Error Handling Middleware** for consistent error responses
- **Database Migrations** for schema version control
- **Email Domain Validation** for user registration
- **Password Hashing** with bcryptjs
- **CORS Support** for cross-origin requests
- **TypeScript** for type safety

## 📁 Project Structure

```
src/
├── config/           # Configuration files
│   └── data-source.ts     # TypeORM DataSource configuration
├── controllers/      # Request handlers
│   └── auth.controller.ts # Authentication controller
├── entities/         # TypeORM entities (Database models)
│   ├── employee.entity.ts
│   ├── leave-request.entity.ts
│   ├── task.entity.ts
│   └── timecard.entity.ts
├── middleware/       # Custom middleware
│   ├── authMiddleware.ts  # JWT authentication
│   └── errorHandler.ts    # Global error handler
├── migrations/       # Database migrations
│   ├── 1699357500000-AddEmployeeId.ts
│   ├── 1699357500000-AddEmployeeIdWithDefault.ts
│   └── 1699357500001-FixEmployeeIdColumn.ts
├── routes/           # API route definitions
│   ├── authRoutes.ts      # Auth endpoints (login, register, POD management)
│   ├── employeeRoutes.ts  # Employee CRUD operations
│   ├── leaveRoutes.ts     # Leave request management
│   ├── managerRoutes.ts   # Manager-specific endpoints
│   ├── taskRoutes.ts      # Task management
│   └── timecardRoutes.ts  # Timecard operations
├── scripts/          # Utility scripts
│   ├── fix-employee-ids.ts
│   ├── init-db.ts
│   └── update-tasks-date.ts
├── services/         # Business logic layer
│   ├── auth.service.ts
│   └── timecard.service.ts
├── types/            # TypeScript type definitions
│   ├── auth.types.ts
│   └── index.ts
├── utils/            # Helper functions
│   └── auth.ts
└── server.ts         # Application entry point
```

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 14+
- **ORM**: TypeORM 0.3.x
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **CORS**: cors middleware
- **Environment Variables**: dotenv

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v14 or higher)

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
createdb employee_timecard
```

Or using psql:

```sql
CREATE DATABASE employee_timecard;
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=employee_timecard

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=24h

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

### 4. Initialize Database

Run the database initialization script:

```bash
npm run db:init
```

This will:
- Create necessary tables
- Set up PostgreSQL enums for POD names and employee roles
- Create initial POD entries

### 5. Run Database Migrations (if any)

```bash
npm run migration:run
```

### 6. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### 7. Build for Production

```bash
npm run build
```

### 8. Start Production Server

```bash
npm start
```

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload (nodemon) |
| `npm start` | Start production server |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm test` | Run tests with Jest |
| `npm run lint` | Run ESLint on TypeScript files |
| `npm run format` | Format code with Prettier |
| `npm run db:init` | Initialize database with seed data |
| `npm run migration:create` | Create a new migration file |
| `npm run migration:generate` | Generate migration from entity changes |
| `npm run migration:run` | Run pending migrations |
| `npm run migration:revert` | Revert the last migration |

## 🔌 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |
| GET | `/pods` | Get all POD names | Yes (Admin) |
| POST | `/pods` | Add new POD | Yes (Admin) |
| DELETE | `/pods/:podName` | Delete POD | Yes (Admin) |

### Employees (`/api/employees`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all employees | Yes |
| GET | `/:id` | Get employee by ID | Yes |
| PUT | `/:id` | Update employee | Yes (Admin/Manager) |
| DELETE | `/:id` | Delete employee | Yes (Admin) |

### Timecards (`/api/timecards`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get user's timecards | Yes |
| POST | `/clock-in` | Clock in | Yes (Employee) |
| POST | `/clock-out` | Clock out | Yes (Employee) |
| GET | `/status` | Get current clock status | Yes (Employee) |

### Leave Requests (`/api/leave`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get user's leave requests | Yes |
| POST | `/` | Create leave request | Yes (Employee) |
| PUT | `/:id` | Update leave request | Yes |
| DELETE | `/:id` | Delete leave request | Yes |

### Tasks (`/api/tasks`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get user's tasks | Yes |
| POST | `/` | Create new task | Yes |
| PUT | `/:id` | Update task | Yes |
| DELETE | `/:id` | Delete task | Yes |

### Manager (`/api/manager`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/dashboard-stats` | Get manager dashboard statistics | Yes (Manager) |
| GET | `/employee-statuses` | Get all employees status | Yes (Manager) |
| GET | `/employees/:id` | Get employee details | Yes (Manager) |
| GET | `/leave-requests` | Get all leave requests | Yes (Manager) |
| PUT | `/leave-requests/:id` | Update leave request status | Yes (Manager) |

## 🗄️ Database Schema

### Entities

1. **Employee**
   - id, firstName, lastName, email, password
   - employeeId (auto-generated)
   - role (admin, manager, employee)
   - podName (dynamic POD assignment)
   - position, phone, address, joinDate

2. **TimeCard**
   - id, employeeId, date
   - clockIn, clockOut, totalHours
   - status (pending, approved, rejected)
   - location (Home, Office), notes

3. **LeaveRequest**
   - id, employeeId
   - leaveType (vacation, sick, personal, other)
   - startDate, endDate, reason
   - status (pending, approved, rejected)
   - managerNotes

4. **Task**
   - id, employeeId
   - title, description, estimatedHours
   - status (todo, ongoing, completed, in_progress)
   - dueDate, createdDate

### PostgreSQL Enums

- `employees_role_enum`: admin, manager, employee
- `employees_podname_enum`: Dynamic POD names (e.g., ADP1, ADP2, Loans1, Investments, etc.)

## 🔐 Authentication & Authorization

### JWT Token

- JWT tokens are issued upon successful login
- Token expiry: 24 hours (configurable)
- Token contains: user ID, email, role, POD name

### Protected Routes

Routes are protected using the `authMiddleware`:

```typescript
import { authMiddleware } from './middleware/authMiddleware';

router.get('/protected', authMiddleware, controller);
```

### Role-Based Access

Access control based on user roles:
- **Admin**: Full system access
- **Manager**: Team management, leave approvals
- **Employee**: Personal records only

## ⚙️ Configuration

### TypeORM Configuration

Database configuration in `src/config/data-source.ts`:

```typescript
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false, // Use migrations in production
  logging: false,
  entities: [Employee, TimeCard, LeaveRequest, Task],
  migrations: ["src/migrations/**/*.ts"],
});
```

### CORS Configuration

Configured for local development with support for:
- http://localhost:5173 (Vite default)
- http://localhost:5174 (Vite alternate)

## 🐛 Error Handling

Centralized error handling with custom error middleware:

- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Server errors (500)

## 🔧 Development Tips

### Adding New Migrations

```bash
npm run migration:create -- src/migrations/YourMigrationName
```

### Database Reset (Development Only)

```bash
# Drop and recreate database
dropdb employee_timecard
createdb employee_timecard
npm run db:init
```

### Checking Database Enums

```bash
psql -U postgres -d employee_timecard -c "SELECT unnest(enum_range(NULL::employees_podname_enum));"
```

## 🚨 Common Issues

### Issue: Port Already in Use

```bash
# Kill process on port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Issue: Database Connection Failed

- Verify PostgreSQL is running
- Check credentials in `.env`
- Ensure database exists

### Issue: POD Enum Errors

- Run `npm run db:init` to initialize enums
- Check enum synchronization in entity files

## 📚 Additional Resources

- [TypeORM Documentation](https://typeorm.io/)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT.io](https://jwt.io/)

## 👥 Team

- **Project**: StaffSync Employee TimeCard System
- **Repository**: prasadgore-dev/StaffSync

## 📄 License

MIT License - feel free to use this project for learning and development purposes.