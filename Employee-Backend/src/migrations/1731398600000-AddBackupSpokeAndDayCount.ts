import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddBackupSpokeAndDayCount1731398600000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("leave_requests", new TableColumn({
            name: "backupSpoke",
            type: "varchar",
            length: "255",
            isNullable: true
        }));

        await queryRunner.addColumn("leave_requests", new TableColumn({
            name: "dayCount",
            type: "integer",
            isNullable: true
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("leave_requests", "backupSpoke");
        await queryRunner.dropColumn("leave_requests", "dayCount");
    }
}
