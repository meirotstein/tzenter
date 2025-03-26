import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Minyan } from "./Minyan";

export enum Prayer {
  Shacharit = 1,
  Mincha = 2,
  Arvit = 3,
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

  // TODO: refer schedule type: one-time, recurring
}
