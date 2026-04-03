import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";
import type { User } from "./User";
import type { Schedule } from "./Schedule";

@Entity("minyans")
export class Minyan {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column()
  city!: string;

  @ManyToMany("User", "minyans")
  @JoinTable()
  users?: Relation<User[]>;

  @ManyToMany("User", "adminMinyans")
  @JoinTable({ name: "minyan_admin_users" })
  admins?: Relation<User[]>;

  @OneToMany("Schedule", "minyan")
  schedules?: Relation<Schedule[]>; // Optional: a minyan may have no schedules

  @Column({ type: "boolean", nullable: true, default: false })
  hidden?: boolean;

  @Column("decimal", { nullable: true, precision: 9, scale: 6 })
  latitude?: number;

  @Column("decimal", { nullable: true, precision: 9, scale: 6 })
  longitude?: number;
}
