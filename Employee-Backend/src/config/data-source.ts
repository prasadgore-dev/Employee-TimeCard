import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    username: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB || "employee_timecard",
    synchronize: false, // Disabled to prevent auto-sync issues with dynamic enum
    logging: process.env.NODE_ENV === "development",
    entities: [join(__dirname, "..", "entities", "*.entity{.ts,.js}")],
    migrations: [join(__dirname, "..", "migrations", "*{.ts,.js}")],
    subscribers: [],
});