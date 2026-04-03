import { Repository } from "typeorm";
import { initDataSource } from ".";
import { Minyan } from "./entities/Minyan";

export async function getRepo(): Promise<Repository<Minyan>> {
  const ds = await initDataSource();
  return ds.getRepository(Minyan);
}

export async function saveMinyan(minyan: Minyan): Promise<Minyan> {
  const repo = await getRepo();
  return repo.save(minyan);
}

export async function getMinyanByName(name: string): Promise<Minyan | null> {
  const repo = await getRepo();
  return repo.findOne({
    where: { name },
    relations: ["users", "admins", "schedules"],
  });
}

export async function getMinyanById(id: number): Promise<Minyan | null> {
  const repo = await getRepo();
  return repo.findOne({
    where: { id },
    relations: ["users", "admins", "schedules"],
  });
}

export async function getAllMinyans(): Promise<Minyan[]> {
  const repo = await getRepo();
  return repo.find({ where: { hidden: false } });
}

export async function updateMinyan(
  id: number,
  updatedData: Partial<Minyan>
): Promise<Minyan> {
  const repo = await getRepo();
  const minyan = await repo.findOneBy({ id });

  if (!minyan) {
    throw new Error(`Minyan with id ${id} not found`);
  }

  Object.assign(minyan, updatedData);
  return repo.save(minyan);
}
