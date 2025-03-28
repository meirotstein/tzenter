// data-source.ts
import "reflect-metadata";
import { DataSource } from "typeorm";
import { Minyan } from "./entities/Minyan";
import { Schedule } from "./entities/Schedule";
import { User } from "./entities/User";

const isTestEnv = process.env.NODE_ENV === "test";
const isDebugEnabled = process.env.DEBUG === "true";

const AppDataSource = new DataSource(
  isTestEnv
    ? {
        type: "sqlite",
        database: ":memory:",
        entities: [User, Minyan, Schedule],
        synchronize: true,
        logging: isDebugEnabled ? ["query", "error"] : undefined,
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
        logging: isDebugEnabled,
        entities: [User, Minyan, Schedule],
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
