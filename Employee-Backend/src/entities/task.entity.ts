import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Employee } from "./employee.entity";

@Entity("tasks")
export class Task {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    title: string;

    @Column({ type: "text" })
    description: string;

    @Column()
    assignedToId: string;

    @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "assignedToId" })
    assignedTo: Employee;

    @Column({ nullable: true })
    assignedById: string;

    @ManyToOne(() => Employee, { onDelete: 'SET NULL' })
    @JoinColumn({ name: "assignedById" })
    assignedBy: Employee;

    @Column({
        type: "enum",
        enum: ["todo", "in_progress", "completed", "blocked"],
        default: "todo"
    })
    status: "todo" | "in_progress" | "completed" | "blocked";

    @Column({ type: "date" })
    dueDate: Date;

    @Column({ type: "date", nullable: true })
    startDate: Date;

    @Column({ type: "date", nullable: true, default: () => "'2025-11-08'" })
    createdDate: Date;

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: true, default: 1 })
    estimatedHours: number;

    @Column({
        type: "enum",
        enum: ["low", "medium", "high"],
        default: "medium"
    })
    priority: "low" | "medium" | "high";

    @Column({ nullable: true })
    completedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}