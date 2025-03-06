import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

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
}
