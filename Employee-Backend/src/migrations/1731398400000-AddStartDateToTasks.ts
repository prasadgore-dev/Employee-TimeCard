import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddStartDateToTasks1731398400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            "tasks",
            new TableColumn({
                name: "startDate",
                type: "date",
                isNullable: true,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("tasks", "startDate");
    }
}
