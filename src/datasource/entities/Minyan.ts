import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
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

  @Column({ nullable: true })
  locationName?: string;

  @ManyToMany((type) => User, (user) => user.minyans)
  @JoinTable()
  users?: Relation<User[]>;

  @ManyToMany((type) => User, (user) => user.adminMinyans)
  @JoinTable({ name: "minyan_admin_users" })
  admins?: Relation<User[]>;

  @OneToMany((type) => Schedule, (schedule) => schedule.minyan)
  schedules?: Relation<Schedule[]>; // Optional: a minyan may have no schedules

  @Column({ type: "boolean", nullable: true, default: false })
  hidden?: boolean;

  @Column("decimal", { nullable: true, precision: 9, scale: 6 })
  latitude?: number;

  @Column("decimal", { nullable: true, precision: 9, scale: 6 })
  longitude?: number;
}
