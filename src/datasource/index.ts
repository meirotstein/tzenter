// data-source.ts
import "reflect-metadata";
import { DataSource } from "typeorm";
import { Minyan } from "./entities/Minyan";
import { User } from "./entities/User";

const isTestEnv = process.env.NODE_ENV === "test";

const AppDataSource = new DataSource(
  isTestEnv
    ? {
        type: "sqlite",
        database: ":memory:",
        entities: [User, Minyan],
        synchronize: true,
        logging: ["query", "error"],
      }
    : {
        type: "postgres",
        host: process.env.DATABASE_HOST,
        port: Number(process.env.DATABASE_PORT),
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASS,
        database: process.env.DATABASE_NAME,
        ssl: {
          rejectUnauthorized: false,
        },
        synchronize: true,
        logging: true,
        entities: [User, Minyan],
        migrations: [],
        subscribers: [],
      }
);

export async function initDataSource(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log("Data Source has been initialized!");
  }
  return AppDataSource;
}
