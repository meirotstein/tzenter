// entities/User.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  JoinColumn,
  ManyToMany,
} from "typeorm";
import { User } from "./User";

@Entity("minyans")
export class Minyan {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  city!: string;

  @ManyToMany((type) => User, (user) => user.minyans)
  @JoinColumn()
  users?: User[];
}
