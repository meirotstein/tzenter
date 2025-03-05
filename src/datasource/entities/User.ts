// entities/User.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinColumn,
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
  @JoinColumn()
  minyans?: Minyan[];
}
