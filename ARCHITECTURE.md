# Employee TimeCard System - Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 CLIENT LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         React Frontend (Vite)                            │   │
│  │                       TypeScript + Material-UI                           │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │   │
│  │  │   Employee   │  │   Manager    │  │    Admin     │  │   Common   │ │   │
│  │  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │  │   Login    │ │   │
│  │  │              │  │              │  │              │  │            │ │   │
│  │  │ • Timecard   │  │ • Employee   │  │ • User Mgmt  │  │ • Auth     │ │   │
│  │  │ • Tasks      │  │   Status     │  │ • Analytics  │  │ • Signup   │ │   │
│  │  │ • Leave Req  │  │ • Attendance │  │ • Reports    │  │            │ │   │
│  │  │ • Profile    │  │ • Leave Appr │  │ • POD Mgmt   │  │            │ │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │   │
│  │                                                                           │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                           │   │
│  │  ┌────────────────────────────────────────────────────────────────┐    │   │
│  │  │                    State Management Layer                       │    │   │
│  │  │                      Redux Toolkit Store                        │    │   │
│  │  │  • Auth Slice  • User State  • Application State               │    │   │
│  │  └────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                           │   │
│  │  ┌────────────────────────────────────────────────────────────────┐    │   │
│  │  │                      API Service Layer                          │    │   │
│  │  │  • authApi  • taskApi  • leaveApi  • managerApi  • adminApi    │    │   │
│  │  │  • Axios HTTP Client with Interceptors                          │    │   │
│  │  └────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                   │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                        │
                                        │ HTTPS / REST API
                                        │ JSON Web Token (JWT)
                                        │
┌───────────────────────────────────────▼───────────────────────────────────────┐
│                              APPLICATION LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    Node.js + Express Server                              │   │
│  │                          TypeScript                                      │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                           │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │   │
│  │  │                      Middleware Layer                             │  │   │
│  │  │                                                                    │  │   │
│  │  │  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐   │  │   │
│  │  │  │ Authentication  │  │     CORS     │  │  Error Handler   │   │  │   │
│  │  │  │  JWT Verify     │  │   Security   │  │  Global Catch    │   │  │   │
│  │  │  └─────────────────┘  └──────────────┘  └──────────────────┘   │  │   │
│  │  │                                                                    │  │   │
│  │  │  ┌─────────────────┐  ┌──────────────┐                          │  │   │
│  │  │  │  Role-Based     │  │  Ownership   │                          │  │   │
│  │  │  │ Authorization   │  │    Check     │                          │  │   │
│  │  │  └─────────────────┘  └──────────────┘                          │  │   │
│  │  └──────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                           │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │   │
│  │  │                        Route Layer                                │  │   │
│  │  │                                                                    │  │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │  │   │
│  │  │  │  /auth   │  │  /tasks  │  │ /leaves  │  │  /employees  │    │  │   │
│  │  │  │          │  │          │  │          │  │              │    │  │   │
│  │  │  │ • Login  │  │ • Create │  │ • Create │  │ • List       │    │  │   │
│  │  │  │ • Signup │  │ • Update │  │ • Update │  │ • Update     │    │  │   │
│  │  │  │ • Verify │  │ • Delete │  │ • Approve│  │ • Delete     │    │  │   │
│  │  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │  │   │
│  │  │                                                                    │  │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                       │  │   │
│  │  │  │/manager  │  │/timecard │  │  /admin  │                       │  │   │
│  │  │  │          │  │          │  │          │                       │  │   │
│  │  │  │• Reports │  │ • Clock  │  │• Analytics│                      │  │   │
│  │  │  │• Team    │  │ • History│  │• POD Mgmt │                      │  │   │
│  │  │  └──────────┘  └──────────┘  └──────────┘                       │  │   │
│  │  └──────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                           │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │   │
│  │  │                     Controller Layer                              │  │   │
│  │  │  • Request Validation (express-validator)                         │  │   │
│  │  │  • Business Logic Orchestration                                   │  │   │
│  │  │  • Response Formatting                                            │  │   │
│  │  └──────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                           │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │   │
│  │  │                      Service Layer                                │  │   │
│  │  │  • Auth Service (JWT, bcrypt)                                     │  │   │
│  │  │  • Timecard Service                                               │  │   │
│  │  │  • Task Management Service                                        │  │   │
│  │  │  • Leave Management Service                                       │  │   │
│  │  └──────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                   │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                        │
                                        │ TypeORM
                                        │ SQL Queries
                                        │
┌───────────────────────────────────────▼───────────────────────────────────────┐
│                               DATA LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         TypeORM ORM Layer                                │   │
│  │                                                                           │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │   │
│  │  │                      Entity Models                                │  │   │
│  │  │                                                                    │  │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │  │   │
│  │  │  │ Employee │  │   Task   │  │  Leave   │  │   Timecard   │    │  │   │
│  │  │  │  Entity  │  │  Entity  │  │  Request │  │    Entity    │    │  │   │
│  │  │  │          │  │          │  │  Entity  │  │              │    │  │   │
│  │  │  │• id      │  │• id      │  │• id      │  │• id          │    │  │   │
│  │  │  │• name    │  │• title   │  │• type    │  │• clockIn     │    │  │   │
│  │  │  │• email   │  │• status  │  │• status  │  │• clockOut    │    │  │   │
│  │  │  │• role    │  │• dates   │  │• dates   │  │• date        │    │  │   │
│  │  │  │• position│  │• hours   │  │• reason  │  │• hours       │    │  │   │
│  │  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │  │   │
│  │  │                                                                    │  │   │
│  │  │  Relationships:                                                   │  │   │
│  │  │  • Employee ──< Task (One-to-Many)                               │  │   │
│  │  │  • Employee ──< LeaveRequest (One-to-Many)                       │  │   │
│  │  │  • Employee ──< Timecard (One-to-Many)                           │  │   │
│  │  └──────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                           │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │   │
│  │  │                    Migration System                               │  │   │
│  │  │  • Schema Version Control                                         │  │   │
│  │  │  • Database Evolution                                             │  │   │
│  │  │  • Rollback Support                                               │  │   │
│  │  └──────────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        PostgreSQL Database                               │   │
│  │                                                                           │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │   │
│  │  │                         Tables                                    │  │   │
│  │  │                                                                    │  │   │
│  │  │  • employees         • tasks              • leave_requests        │  │   │
│  │  │  • timecards         • migrations                                 │  │   │
│  │  │                                                                    │  │   │
│  │  │  Indexes:                                                         │  │   │
│  │  │  • Primary Keys (id)                                              │  │   │
│  │  │  • Foreign Keys (employee_id, assigned_to_id, etc.)              │  │   │
│  │  │  • Date Indexes (for performance)                                │  │   │
│  │  └──────────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘


## Security Architecture

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            SECURITY LAYERS                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  Authentication:                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │  • JWT (JSON Web Tokens) for stateless authentication                  │    │
│  │  • bcryptjs for password hashing (10 salt rounds)                      │    │
│  │  • Email domain validation (@bajajfinserv.in, @bizsupportc.com)        │    │
│  │  • Token stored in localStorage with httpOnly consideration            │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                   │
│  Authorization:                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │  • Role-Based Access Control (RBAC)                                     │    │
│  │    - Admin: Full system access                                          │    │
│  │    - Manager: Team management, approvals                                │    │
│  │    - Employee: Personal data only                                       │    │
│  │  • Ownership verification for resource access                           │    │
│  │  • Route-level protection middleware                                    │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                   │
│  Data Protection:                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │  • CORS configuration for cross-origin requests                         │    │
│  │  • Input validation with express-validator                              │    │
│  │  • SQL injection prevention via TypeORM parameterized queries           │    │
│  │  • XSS protection through proper encoding                               │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘


## User Flow Architecture

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USER FLOWS                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  Authentication Flow:                                                             │
│  ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ Login   │───>│ Validate│───>│ Generate │───>│  Store   │───>│ Redirect │  │
│  │  Form   │    │  Creds  │    │   JWT    │    │  Token   │    │Dashboard │  │
│  └─────────┘    └─────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                                                                                   │
│  Task Management Flow:                                                            │
│  ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌──────────┐                   │
│  │ Create  │───>│  Auto   │───>│  Manual  │───>│ Complete │                   │
│  │  Task   │    │Progress │    │  Update  │    │   Task   │                   │
│  │(To Do)  │    │(On Date)│    │(Ongoing) │    │(Confirm) │                   │
│  └─────────┘    └─────────┘    └──────────┘    └──────────┘                   │
│                                                                                   │
│  Leave Request Flow:                                                              │
│  ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌──────────┐                   │
│  │Employee │───>│ Manager │───>│ Approve/ │───>│  Notify  │                   │
│  │ Submit  │    │ Review  │    │  Reject  │    │Employee  │                   │
│  └─────────┘    └─────────┘    └──────────┘    └──────────┘                   │
│                                                                                   │
│  Timecard Flow:                                                                   │
│  ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌──────────┐                   │
│  │ Clock   │───>│  Work   │───>│  Clock   │───>│Calculate │                   │
│  │   In    │    │  Hours  │    │   Out    │    │  Hours   │                   │
│  └─────────┘    └─────────┘    └──────────┘    └──────────┘                   │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘


## Technology Stack

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TECHNOLOGY STACK                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  Frontend:                                                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │  • React 18.3.1                    • TypeScript 5.5.3                   │    │
│  │  • Vite 5.4.2                      • Material-UI (MUI) 6.1.6           │    │
│  │  • Redux Toolkit 2.2.7             • Axios 1.7.7                        │    │
│  │  • React Router DOM 6.26.2         • date-fns 4.1.0                    │    │
│  │  • SCSS for styling                • ESLint + Prettier                  │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                   │
│  Backend:                                                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │  • Node.js (LTS)                   • Express 4.21.1                     │    │
│  │  • TypeScript 5.6.3                • TypeORM 0.3.20                     │    │
│  │  • PostgreSQL 14+                  • bcryptjs 2.4.3                     │    │
│  │  • jsonwebtoken 9.0.2              • express-validator 7.2.0           │    │
│  │  • cors 2.8.5                      • dotenv 16.4.5                      │    │
│  │  • ts-node-dev (development)       • pg (PostgreSQL driver)            │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                   │
│  Development Tools:                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │  • Git (Version Control)           • VS Code                            │    │
│  │  • npm/yarn (Package Manager)      • ESLint                             │    │
│  │  • Prettier (Code Formatting)      • TypeScript Compiler                │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘


## Deployment Architecture

┌─────────────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT ARCHITECTURE                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  Development Environment:                                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                          │    │
│  │  Frontend (Port 5173)                  Backend (Port 3000)              │    │
│  │  ┌───────────────────┐                ┌───────────────────┐            │    │
│  │  │  Vite Dev Server  │───────────────>│  Express Server   │            │    │
│  │  │  Hot Reload       │   API Calls    │  ts-node-dev      │            │    │
│  │  └───────────────────┘                └─────────┬─────────┘            │    │
│  │                                                  │                       │    │
│  │                                                  ▼                       │    │
│  │                                        ┌───────────────────┐            │    │
│  │                                        │  PostgreSQL DB    │            │    │
│  │                                        │  localhost:5432   │            │    │
│  │                                        └───────────────────┘            │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                   │
│  Production Environment (Recommended):                                            │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                          │    │
│  │  ┌───────────────────────────────────────────────────────────────┐    │    │
│  │  │                        CDN / Nginx                             │    │    │
│  │  │                   (Static Asset Delivery)                      │    │    │
│  │  └─────────────────────────┬─────────────────────────────────────┘    │    │
│  │                            │                                            │    │
│  │                            ▼                                            │    │
│  │  ┌───────────────────────────────────────────────────────────────┐    │    │
│  │  │              Frontend (React Build - Static Files)             │    │    │
│  │  │              Hosted on: Vercel / Netlify / AWS S3             │    │    │
│  │  └─────────────────────────┬─────────────────────────────────────┘    │    │
│  │                            │                                            │    │
│  │                            │ HTTPS API Calls                            │    │
│  │                            ▼                                            │    │
│  │  ┌───────────────────────────────────────────────────────────────┐    │    │
│  │  │                    Load Balancer (Optional)                    │    │    │
│  │  └─────────────────────────┬─────────────────────────────────────┘    │    │
│  │                            │                                            │    │
│  │                            ▼                                            │    │
│  │  ┌───────────────────────────────────────────────────────────────┐    │    │
│  │  │              Backend API Server (Node.js/Express)              │    │    │
│  │  │              Hosted on: Heroku / AWS EC2 / DigitalOcean       │    │    │
│  │  │              • PM2 Process Manager                              │    │    │
│  │  │              • Environment Variables                            │    │    │
│  │  │              • Logging & Monitoring                             │    │    │
│  │  └─────────────────────────┬─────────────────────────────────────┘    │    │
│  │                            │                                            │    │
│  │                            ▼                                            │    │
│  │  ┌───────────────────────────────────────────────────────────────┐    │    │
│  │  │              PostgreSQL Database (Production)                  │    │    │
│  │  │              Hosted on: AWS RDS / Heroku Postgres / Supabase  │    │    │
│  │  │              • Automated Backups                               │    │    │
│  │  │              • Replication                                      │    │    │
│  │  │              • SSL Connections                                  │    │    │
│  │  └───────────────────────────────────────────────────────────────┘    │    │
│  │                                                                          │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘


## Key Features & Components

┌─────────────────────────────────────────────────────────────────────────────────┐
│                          FEATURE ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  1. Authentication & Authorization                                                │
│     • JWT-based stateless authentication                                          │
│     • Role-based access control (Admin, Manager, Employee)                        │
│     • Protected routes with middleware                                            │
│     • Password encryption with bcrypt                                             │
│                                                                                   │
│  2. Task Management System                                                        │
│     • Three-state workflow: To Do → In Progress → Completed                       │
│     • Automatic status transitions based on start date                            │
│     • Confirmation dialogs for task completion                                    │
│     • Task filtering and categorization                                           │
│     • Date tracking: Created, Start, Due dates                                    │
│                                                                                   │
│  3. Leave Management                                                              │
│     • Employee leave request submission                                           │
│     • Manager approval workflow                                                   │
│     • Leave type categorization                                                   │
│     • Status tracking and history                                                 │
│                                                                                   │
│  4. Timecard System                                                               │
│     • Clock in/out functionality                                                  │
│     • Automatic hour calculation                                                  │
│     • Historical timecard viewing                                                 │
│     • Date-based filtering                                                        │
│                                                                                   │
│  5. Manager Dashboard                                                             │
│     • Team attendance overview                                                    │
│     • POD-based employee grouping                                                 │
│     • Leave approval interface                                                    │
│     • Employee status monitoring                                                  │
│     • Dialog-based detailed views                                                 │
│                                                                                   │
│  6. Admin Dashboard                                                               │
│     • User management (Create, Update, Delete)                                    │
│     • Employee onboarding with position assignment                                │
│     • Password management with confirmation                                       │
│     • System-wide analytics and reports                                           │
│     • POD management                                                              │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘


## Database Schema

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            DATABASE SCHEMA                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  employees                                    tasks                               │
│  ┌────────────────────────┐                  ┌─────────────────────────┐        │
│  │ id (PK)                │                  │ id (PK)                 │        │
│  │ name                   │                  │ title                   │        │
│  │ email (UNIQUE)         │                  │ description             │        │
│  │ password (HASHED)      │                  │ status                  │        │
│  │ role (ENUM)            │                  │ priority                │        │
│  │ position               │                  │ estimatedHours          │        │
│  │ phoneNumber            │                  │ createdDate             │        │
│  │ address                │                  │ startDate               │        │
│  │ createdAt              │                  │ dueDate                 │        │
│  │ updatedAt              │                  │ completedAt             │        │
│  └────────────────────────┘                  │ assignedToId (FK)       │        │
│           │                                   │ assignedById (FK)       │        │
│           │                                   │ createdAt               │        │
│           │                                   │ updatedAt               │        │
│           │                                   └─────────────────────────┘        │
│           │                                            │                          │
│           │◄───────────────────────────────────────────┘                          │
│           │                                                                        │
│           │                                   leave_requests                       │
│           │                                   ┌─────────────────────────┐        │
│           │                                   │ id (PK)                 │        │
│           │                                   │ type                    │        │
│           │                                   │ startDate               │        │
│           │                                   │ endDate                 │        │
│           │                                   │ reason                  │        │
│           │                                   │ status                  │        │
│           │                                   │ reviewComments          │        │
│           │                                   │ employeeId (FK)         │        │
│           │                                   │ reviewedBy (FK)         │        │
│           │                                   │ createdAt               │        │
│           │                                   │ updatedAt               │        │
│           │                                   └─────────────────────────┘        │
│           │                                            │                          │
│           │◄───────────────────────────────────────────┘                          │
│           │                                                                        │
│           │                                   timecards                            │
│           │                                   ┌─────────────────────────┐        │
│           │                                   │ id (PK)                 │        │
│           │                                   │ date                    │        │
│           │                                   │ clockInTime             │        │
│           │                                   │ clockOutTime            │        │
│           │                                   │ totalHours              │        │
│           │                                   │ employeeId (FK)         │        │
│           │                                   │ createdAt               │        │
│           │                                   │ updatedAt               │        │
│           │                                   └─────────────────────────┘        │
│           │                                            │                          │
│           └────────────────────────────────────────────┘                          │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘


## API Endpoints

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            REST API ENDPOINTS                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  Authentication (/api/auth)                                                       │
│  ├── POST   /signup                  Register new user                           │
│  ├── POST   /login                   Authenticate user                           │
│  └── GET    /verify                  Verify JWT token                            │
│                                                                                   │
│  Tasks (/api/tasks)                                                               │
│  ├── GET    /                        Get all tasks (filtered by role)            │
│  ├── GET    /:id                     Get single task                             │
│  ├── POST   /                        Create new task                             │
│  ├── PUT    /:id                     Update task                                 │
│  ├── PUT    /:id/status              Update task status                          │
│  └── DELETE /:id                     Delete task                                 │
│                                                                                   │
│  Leave Requests (/api/leaves)                                                     │
│  ├── GET    /                        Get leave requests                          │
│  ├── GET    /:id                     Get single leave request                    │
│  ├── POST   /                        Create leave request                        │
│  ├── PUT    /:id/review              Approve/reject leave                        │
│  └── DELETE /:id                     Delete leave request                        │
│                                                                                   │
│  Timecards (/api/timecards)                                                       │
│  ├── GET    /                        Get timecard history                        │
│  ├── GET    /today                   Get today's timecard                        │
│  ├── POST   /clock-in                Clock in                                    │
│  └── PUT    /clock-out               Clock out                                   │
│                                                                                   │
│  Employees (/api/employees)                                                       │
│  ├── GET    /                        Get all employees (Admin/Manager)           │
│  ├── GET    /:id                     Get employee details                        │
│  ├── POST   /                        Create employee (Admin)                     │
│  ├── PUT    /:id                     Update employee                             │
│  └── DELETE /:id                     Delete employee (Admin)                     │
│                                                                                   │
│  Manager (/api/manager)                                                           │
│  ├── GET    /team-attendance         Get team attendance                         │
│  ├── GET    /employee-status         Get employee statuses                       │
│  └── GET    /reports                 Generate reports                            │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

