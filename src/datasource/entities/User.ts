import {
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";
import { Minyan } from "./Minyan";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  phone!: string;

  @Column()
  name!: string;

  @ManyToMany((type) => Minyan, (minyan) => minyan.users)
  minyans?: Relation<Minyan[]>;

  @ManyToMany((type) => Minyan, (minyan) => minyan.admins)
  adminMinyans?: Relation<Minyan[]>;
}
