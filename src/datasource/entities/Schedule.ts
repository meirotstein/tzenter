import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Minyan } from "./Minyan";

export enum Prayer {
  Shacharit = 1,
  Mincha = 2,
  Arvit = 3,
  Slichot = 4,
}

export enum WeekDay {
  Sunday = 1,
  Monday = 2,
  Tuesday = 3,
  Wednesday = 4,
  Thursday = 5,
  Friday = 6,
  Saturday = 7,
}

export enum RelativeTime {
  BEFORE_SUNSET = "BEFORE_SUNSET",
  AFTER_SUNSET = "AFTER_SUNSET",
  BEFORE_SUNRISE = "BEFORE_SUNRISE",
  AFTER_SUNRISE = "AFTER_SUNRISE",
}

@Entity("schedules")
export class Schedule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @ManyToOne(() => Minyan, (minyan) => minyan.schedules, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "minyanId" })
  minyan!: Minyan;

  @Column({
    type: "integer",
  })
  prayer!: Prayer;

  @Column({ type: "time" })
  time!: string;

  @Column({ type: "boolean", default: true })
  enabled!: boolean;

  @Column({ nullable: true })
  relative?: RelativeTime;

  // On relative schedule, the weekly hour will be determine by this day for the whole week (Optional)
  @Column({
    type: "integer",
    nullable: true,
  })
  weeklyDetermineByDay?: WeekDay;

  // On relative schedule, the schedule hour will be round the nearest five-minutes hour (Optional)
  @Column({ type: "boolean", default: false, nullable: true })
  roundToNearestFiveMinutes?: boolean;

  // Start date of the schedule (Optional)
  @Column({ type: "datetime", nullable: true })
  startAt?: Date;

  // End date of the schedule (Optional)
  @Column({ type: "datetime", nullable: true })
  endAt?: Date;

  // Weekdays when the schedule should be invoked (Optional)
  @Column({ type: "simple-array", nullable: true })
  weekDays?: WeekDay[];

  // TODO: refer schedule type: one-time (= initiatedByUserId), recurring
}
