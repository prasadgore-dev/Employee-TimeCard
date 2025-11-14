import { AppDataSource } from "../config/data-source";
import { Employee } from "../entities/employee.entity";
import { TimeCard } from "../entities/timecard.entity";
import { LeaveRequest } from "../entities/leave-request.entity";
import { Task } from "../entities/task.entity";
import * as bcrypt from "bcryptjs";

async function initializeDatabase() {
    try {
        // Initialize the database connection
        await AppDataSource.initialize();
        console.log("Database connection initialized");

        // Drop existing tables if they exist (only in development)
        if (process.env.NODE_ENV === "development") {
            await AppDataSource.dropDatabase();
            await AppDataSource.synchronize();
            console.log("Database schema synchronized");
        }

        // Create an admin user
        const adminPassword = await bcrypt.hash("admin123", 10);
        const adminUser = new Employee();
        adminUser.firstName = "Admin";
        adminUser.lastName = "User";
        adminUser.email = "admin@bajajfinserv.in";
        adminUser.password = adminPassword;
        adminUser.role = "admin";
        adminUser.podName = "ADP1";
        adminUser.position = "System Administrator";

        await AppDataSource.manager.save(adminUser);
        console.log("Admin user created");

        // Create a sample employee
        const employeePassword = await bcrypt.hash("employee123", 10);
        const employee = new Employee();
        employee.firstName = "John";
        employee.lastName = "Doe";
        employee.email = "john.doe@bajajfinserv.in";
        employee.password = employeePassword;
        employee.role = "employee";
        employee.podName = "Investments";
        employee.position = "Software Engineer";

        await AppDataSource.manager.save(employee);
        console.log("Sample employee created");

        // Create a manager
        const managerPassword = await bcrypt.hash("manager123", 10);
        const manager = new Employee();
        manager.firstName = "Jane";
        manager.lastName = "Smith";
        manager.email = "jane.smith@bajajfinserv.in";
        manager.password = managerPassword;
        manager.role = "manager";
        manager.podName = "ADP2";
        manager.position = "Engineering Manager";

        await AppDataSource.manager.save(manager);
        console.log("Manager created");

        // Create multiple employees for testing
        const podNames = ["ADP1", "ADP2", "Loans1", "Investments", "Wheels", "SME", "CF360", "Consent", "Corporate", "Horizontal", "BALIC", "CPR", "Loans2"];
        const positions = ["Developer", "Senior Developer", "Quality Analyst", "QA Lead", "Tech Architect", "Principal Architect", "SDM", "DMT", "DMT Lead", "Content OPS", "Tech OPS"];

        const testEmployees: Employee[] = [];
        
        for (let i = 1; i <= 10; i++) {
            const pod = podNames[i % podNames.length];
            const pos = positions[i % positions.length];
            
            const testEmployee = new Employee();
            testEmployee.firstName = `Test${i}`;
            testEmployee.lastName = `User${i}`;
            testEmployee.email = `test.user${i}@bajajfinserv.in`;
            testEmployee.password = await bcrypt.hash("test123", 10);
            testEmployee.role = "employee";
            testEmployee.podName = pod;
            testEmployee.position = pos;
            
            const savedEmployee = await AppDataSource.manager.save(testEmployee);
            testEmployees.push(savedEmployee);
        }
        console.log("Test employees created");

        // Create timecards for today
        const today = new Date();
        today.setHours(9, 0, 0, 0); // Set to 9 AM
        const clockOutTime = new Date(today);
        clockOutTime.setHours(17, 0, 0, 0); // Set to 5 PM

        for (let i = 0; i < testEmployees.length; i++) {
            const timecard = new TimeCard();
            timecard.employee = testEmployees[i];
            timecard.date = today;
            timecard.clockIn = today;
            // Make some employees currently clocked in
            if (i < 5) {
                timecard.clockOut = null; // Still working
            } else {
                timecard.clockOut = clockOutTime; // Clocked out
            }
            await AppDataSource.manager.save(timecard);
        }
        console.log("Test timecards created");

        // Create some leave requests
        const leaveTypes = ["vacation", "sick", "personal"] as const;
        const leaveStatuses = ["pending", "approved", "rejected"] as const;
        
        for (let i = 0; i < 5; i++) {
            const leaveRequest = new LeaveRequest();
            leaveRequest.employee = testEmployees[i];
            leaveRequest.leaveType = leaveTypes[i % leaveTypes.length];
            leaveRequest.status = leaveStatuses[i % leaveStatuses.length];
            leaveRequest.startDate = new Date();
            leaveRequest.endDate = new Date();
            leaveRequest.endDate.setDate(leaveRequest.startDate.getDate() + 3);
            leaveRequest.reason = `Test leave request ${i + 1}`;
            if (leaveRequest.status === "approved") {
                leaveRequest.approvedBy = manager;
            }
            await AppDataSource.manager.save(leaveRequest);
        }
        console.log("Test leave requests created");

        // Create some tasks
        const taskStatuses = ["todo", "in_progress", "completed", "blocked"] as const;
        const priorities = ["low", "medium", "high"] as const;
        
        for (let i = 0; i < 8; i++) {
            const task = new Task();
            task.title = `Test Task ${i + 1}`;
            task.description = `Description for test task ${i + 1}`;
            task.assignedTo = testEmployees[i];
            task.assignedBy = manager;
            task.status = taskStatuses[i % taskStatuses.length];
            task.priority = priorities[i % priorities.length];
            task.dueDate = new Date();
            task.dueDate.setDate(task.dueDate.getDate() + 7);
            await AppDataSource.manager.save(task);
        }
        console.log("Test tasks created");

        console.log("Database initialization completed successfully");
        process.exit(0);
    } catch (error) {
        console.error("Error during database initialization:", error);
        process.exit(1);
    }
}

// Run the initialization
initializeDatabase();