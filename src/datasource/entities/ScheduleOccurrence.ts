import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

const isTestEnv = process.env.NODE_ENV === "test";

@Entity("schedule_occurrences")
export class ScheduleOccurrence {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  scheduleId!: number;

  @Column({
    type: isTestEnv ? "varchar" : "timestamp",
  })
  datetime!: Date;

  @Column()
  approved!: number;

  @Column()
  rejected!: number;

  @Column()
  snoozed!: number;

  @Column({ nullable: true })
  invocationId?: string;
}
