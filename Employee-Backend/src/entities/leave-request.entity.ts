import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Employee } from "./employee.entity";

@Entity("leave_requests")
export class LeaveRequest {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    employeeId: string;

    @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "employeeId" })
    employee: Employee;

    @Column({ type: "date" })
    startDate: Date;

    @Column({ type: "date" })
    endDate: Date;

    @Column({
        type: "enum",
        enum: ["vacation", "sick", "personal", "other"],
        default: "vacation"
    })
    leaveType: "vacation" | "sick" | "personal" | "other";

    @Column({ type: "text" })
    reason: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    backupSpoke: string;

    @Column({ type: "integer", nullable: true })
    dayCount: number;

    @Column({
        type: "enum",
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    })
    status: "pending" | "approved" | "rejected";

    @Column({ nullable: true })
    managerNotes: string;

    @Column({ nullable: true })
    approvedById: string;

    @ManyToOne(() => Employee, { onDelete: 'SET NULL' })
    @JoinColumn({ name: "approvedById" })
    approvedBy: Employee;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}