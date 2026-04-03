import {
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";
import type { Minyan } from "./Minyan";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  phone!: string;

  @Column()
  name!: string;

  @ManyToMany("Minyan", "users")
  minyans?: Relation<Minyan[]>;

  @ManyToMany("Minyan", "admins")
  adminMinyans?: Relation<Minyan[]>;
}
