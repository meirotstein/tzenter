// data-source.ts
import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Minyan } from "./entities/Minyan";

const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.POSTGRES_URL,
  // ssl: {
  //   rejectUnauthorized: false,
  // },
  synchronize: true,
  logging: true,
  entities: [User, Minyan],
  migrations: [],
  subscribers: [],
});

export async function getDataSource(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log("Data Source has been initialized!");
  }
  return AppDataSource;
}
