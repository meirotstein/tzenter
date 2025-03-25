import { Repository } from "typeorm";
import { initDataSource } from ".";
import { MinyanNotFoundError, UserNotFoundError } from "../errors";
import { Minyan } from "./entities/Minyan";
import { User } from "./entities/User";

export async function getRepo(): Promise<Repository<User>> {
  const ds = await initDataSource();
  return ds.getRepository(User);
}

export async function saveUser(user: User): Promise<User> {
  const repo = await getRepo();
  return repo.save(user);
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const repo = await getRepo();
  return repo.findOne({ where: { phone }, relations: ["minyans"] });
}

export async function getUserById(userId: number): Promise<User | null> {
  const repo = await getRepo();
  return repo.findOne({ where: { id: userId }, relations: ["minyans"] });
}

export async function assignUserToAMinyan(
  userId: number,
  minyanId: number
): Promise<void> {
  const ds = await initDataSource();
  const userRepo = ds.getRepository(User);
  const minyanRepo = ds.getRepository(Minyan);

  // Fetch user by ID
  const user = await userRepo.findOne({ where: { id: userId } });

  if (!user) throw new UserNotFoundError(userId);

  // Fetch minyan with the related users
  const minyan = await minyanRepo.findOne({
    where: { id: minyanId },
    relations: ["users"],
  });

  if (!minyan) throw new MinyanNotFoundError(minyanId);

  minyan.users = minyan.users || [];

  await minyanRepo.save(minyan);

  // Avoid adding the same user twice
  if (!minyan.users.some((u: User) => u.id === user.id)) {
    minyan.users.push(user);
    await minyanRepo.save(minyan);
  }
}

export async function removeUserFromMinyan(
  userId: number,
  minyanId: number
): Promise<void> {
  const ds = await initDataSource();
  const userRepo = ds.getRepository(User);
  const minyanRepo = ds.getRepository(Minyan);

  // Fetch user by ID
  const user = await userRepo.findOne({ where: { id: userId } });

  if (!user) throw new UserNotFoundError(userId);

  // Fetch minyan with the related users
  const minyan = await minyanRepo.findOne({
    where: { id: minyanId },
    relations: ["users"],
  });

  if (!minyan) throw new MinyanNotFoundError(minyanId);

  if (minyan.users) {
    // Filter out the user from the minyan's users
    minyan.users = minyan.users.filter((u: User) => u.id !== user.id);
    await minyanRepo.save(minyan);
  }
}
