import { DateTime } from "luxon";
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
  timezone: string = "Asia/Jerusalem"
): Promise<Schedule[]> {
  const repo = await getRepo();

  const now = DateTime.fromJSDate(from, { zone: timezone });
  const later = now.plus({ minutes });

  const format = (dt: DateTime) => dt.toFormat("HH:mm:ss");

  const fromTime = format(now);
  const futureTime = format(later);

  const isWrappingMidnight = fromTime > futureTime;

  if (isWrappingMidnight) {
    return repo
      .createQueryBuilder("schedule")
      .where("schedule.time >= :fromTime OR schedule.time <= :futureTime", {
        fromTime,
        futureTime,
      })
      .getMany();
  } else {
    return repo
      .createQueryBuilder("schedule")
      .where("schedule.time >= :fromTime AND schedule.time <= :futureTime", {
        fromTime,
        futureTime,
      })
      .getMany();
  }
}
