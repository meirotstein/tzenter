import { Repository } from "typeorm";
import { initDataSource } from ".";
import { ScheduleOccurrence } from "./entities/ScheduleOccurrence";

export async function getRepo(): Promise<Repository<ScheduleOccurrence>> {
  const ds = await initDataSource();
  return ds.getRepository(ScheduleOccurrence);
}

export async function saveScheduleOccurrence(
  occurrence: ScheduleOccurrence
): Promise<ScheduleOccurrence> {
  const repo = await getRepo();
  return repo.save(occurrence);
}

export async function getScheduleOccurrenceById(
  occurrenceId: number
): Promise<ScheduleOccurrence | null> {
  const repo = await getRepo();
  return repo.findOne({ where: { id: occurrenceId } });
}

export async function getScheduleInvocationOccurrence(
  invocationId: string
): Promise<ScheduleOccurrence | null> {
  const repo = await getRepo();
  return await repo.findOne({
    where: { invocationId },
  });
}
