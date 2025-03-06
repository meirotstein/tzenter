import "reflect-metadata";
import { initDataSource } from "./src/datasource";

beforeAll(async () => {
  const ds = await initDataSource();
  ds.query("PRAGMA foreign_keys=ON");
});

afterEach(async () => {
  const ds = await initDataSource();
  const entities = ds.entityMetadatas;
  for (const entity of entities) {
    const repository = ds.getRepository(entity.name);
    await repository.query(`DELETE FROM ${entity.tableName}`);
  }
});

afterAll(async () => {
  const ds = await initDataSource();
  if (ds.isInitialized) {
    await ds.destroy();
  }
});
