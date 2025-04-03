import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";
import { Schedule } from "./Schedule";

@Entity("minyans")
export class Minyan {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column()
  city!: string;

  @ManyToMany((type) => User, (user) => user.minyans)
  @JoinTable()
  users?: User[];

  @OneToMany(() => Schedule, (schedule) => schedule.minyan)
  schedules?: Schedule[]; // Optional: a minyan may have no schedules

  @Column({ type: "boolean", nullable: true, default: false })
  hidden?: boolean;
}
