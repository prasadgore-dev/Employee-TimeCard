import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { TimeCard } from "./timecard.entity";
import { LeaveRequest } from "./leave-request.entity";
import { Task } from "./task.entity";

export type Role = "employee" | "admin" | "manager";

@Entity("employees")
export class Employee {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ unique: true })
    email: string;

    @Column({ unique: true, nullable: true })
    employeeId: string;

    @Column()
    password: string;

    @Column({
        type: "enum",
        enum: ["employee", "admin", "manager"],
        default: "employee"
    })
    role: "employee" | "admin" | "manager";

    @Column({
        type: "varchar"
    })
    podName: string;

    @Column()
    position: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    address: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @OneToMany(() => TimeCard, timecard => timecard.employee, { cascade: true, onDelete: 'CASCADE' })
    timecards: TimeCard[];

    @OneToMany(() => LeaveRequest, leaveRequest => leaveRequest.employee, { cascade: true, onDelete: 'CASCADE' })
    leaveRequests: LeaveRequest[];

    @OneToMany(() => LeaveRequest, leaveRequest => leaveRequest.approvedBy, { onDelete: 'SET NULL' })
    approvedLeaveRequests: LeaveRequest[];

    @OneToMany(() => Task, task => task.assignedTo, { cascade: true, onDelete: 'CASCADE' })
    assignedTasks: Task[];

    @OneToMany(() => Task, task => task.assignedBy, { onDelete: 'SET NULL' })
    tasksCreated: Task[];
}