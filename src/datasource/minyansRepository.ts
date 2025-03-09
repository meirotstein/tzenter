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
  return repo.findOne({ where: { name }, relations: ["users"] });
}

export async function getAllMinyans(): Promise<Minyan[]> {
  const repo = await getRepo();
  return repo.find();
}
