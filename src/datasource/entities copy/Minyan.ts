// entities/User.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('minyans')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    city: string;
}
