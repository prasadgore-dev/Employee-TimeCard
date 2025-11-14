import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Employee } from "./employee.entity";

@Entity("timecards")
export class TimeCard {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    employeeId: string;

    @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "employeeId" })
    employee: Employee;

    @Column({ type: "date" })
    date: Date;

    @Column({ type: "timestamp with time zone" })
    clockIn: Date;

    @Column({ type: "timestamp with time zone", nullable: true })
    clockOut: Date | null;

    @Column({ type: "decimal", precision: 5, scale: 2, default: 0 })
    totalHours: number;

    @Column({
        type: "enum",
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    })
    status: "pending" | "approved" | "rejected";

    @Column({
        type: "enum",
        enum: ["Home", "Office"],
        nullable: true
    })
    location: "Home" | "Office" | null;

    @Column({ nullable: true })
    notes: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}