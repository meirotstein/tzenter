import { Repository } from "typeorm";
import { initDataSource } from ".";
import { Schedule } from "./entities/Schedule";

export async function getRepo(): Promise<Repository<Schedule>> {
  const ds = await initDataSource();
  return ds.getRepository(Schedule);
}

export async function addSchedule(
  scheduleData: Partial<Schedule>
): Promise<Schedule> {
  const repo = await getRepo();
  const schedule = repo.create(scheduleData);
  return repo.save(schedule);
}

export async function getScheduleById(id: number): Promise<Schedule | null> {
  const repo = await getRepo();
  return repo.findOne({
    where: { id },
    relations: ["minyan"],
  });
}

export async function updateSchedule(
  id: number,
  updatedData: Partial<Schedule>
): Promise<Schedule> {
  const repo = await getRepo();
  const schedule = await repo.findOneBy({ id });

  if (!schedule) {
    throw new Error(`Schedule with id ${id} not found`);
  }

  Object.assign(schedule, updatedData);
  return repo.save(schedule);
}

export async function getUpcomingSchedules(
  minutes: number,
  from: Date = new Date(),
): Promise<Schedule[]> {
  const repo = await getRepo();

  const future = new Date(from.getTime() + minutes * 60 * 1000);

  const format = (d: Date) => d.toTimeString().split(" ")[0]; // "HH:MM:SS"
  const fromTime = format(from);
  const futureTime = format(future);

  const isWrappingMidnight = fromTime > futureTime;

  if (isWrappingMidnight) {
    return repo
      .createQueryBuilder("schedule")
      .where("schedule.time >= :currentTime OR schedule.time <= :futureTime", {
        currentTime: fromTime,
        futureTime,
      })
      .getMany();
  } else {
    return repo
      .createQueryBuilder("schedule")
      .where("schedule.time >= :currentTime AND schedule.time <= :futureTime", {
        currentTime: fromTime,
        futureTime,
      })
      .getMany();
  }
}
