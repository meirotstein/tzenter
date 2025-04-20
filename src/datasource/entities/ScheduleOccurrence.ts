import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("schedule_occurrences")
export class ScheduleOccurrence {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  scheduleId!: string;

  @Column()
  datetime!: Date;

  @Column()
  approved!: number;

  @Column()
  rejected!: number;

  @Column()
  snoozed!: number;
}
