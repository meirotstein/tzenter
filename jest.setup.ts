import "reflect-metadata";
import { initDataSource } from "./src/datasource";

beforeAll(async () => {
  const ds = await initDataSource();
  ds.query("PRAGMA foreign_keys=ON");
});

afterAll(async () => {
  const ds = await initDataSource();
  if (ds.isInitialized) {
    await ds.destroy();
  }
});
