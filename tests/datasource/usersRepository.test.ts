import { Minyan } from "../../src/datasource/entities/Minyan";
import { User } from "../../src/datasource/entities/User";
import {
  getRepo as getMinyanRepo,
  saveMinyan,
} from "../../src/datasource/minyansRepository";
import {
  assignUserToAMinyan,
  getUserByPhone,
  getRepo as getUserRepo,
  saveUser,
} from "../../src/datasource/usersRepository";
import { MinyanNotFoundError, UserNotFoundError } from "../../src/errors";

describe("usersRepository", () => {
  let user: User;
  let minyan: Minyan;

  beforeEach(async () => {
    user = new User();
    user.name = "John Doe";
    user.phone = "123456789";
    user.minyans = [];
    await saveUser(user);

    minyan = new Minyan();
    minyan.name = "Minyan A";
    minyan.city = "New York";
    minyan.users = [];
    await saveMinyan(minyan);
  });

  afterEach(async () => {
    const minyanRepo = await getMinyanRepo();
    await minyanRepo.clear();

    const userRepo = await getUserRepo();
    await userRepo.clear();
  });

  it("should save a user", async () => {
    const repo = await getUserRepo();
    const savedUser = await repo.findOne({ where: { phone: "123456789" } });
    expect(savedUser).toBeDefined();
    expect(savedUser?.name).toBe("John Doe");
  });

  it("should get a user by phone", async () => {
    const foundUser = await getUserByPhone("123456789");
    expect(foundUser).toBeDefined();
    expect(foundUser?.name).toBe("John Doe");
  });

  it("should return null if user not found by phone", async () => {
    const foundUser = await getUserByPhone("987654321");
    expect(foundUser).toBeNull();
  });

  it("should assign a user to a minyan", async () => {
    await assignUserToAMinyan(user.id, minyan.id);
    const _user = await getUserByPhone("123456789");
    expect(_user).toBeDefined();
    expect(_user!.minyans).toHaveLength(1);
    expect(_user!.minyans![0].id).toBe(minyan.id);
  });

  it("should throw an error if user not found when assigning to a minyan", async () => {
    await expect(assignUserToAMinyan(999, minyan.id)).rejects.toThrow(
      UserNotFoundError
    );
  });

  it("should throw an error if minyan not found when assigning a user", async () => {
    await expect(assignUserToAMinyan(user.id, 999)).rejects.toThrow(
      MinyanNotFoundError
    );
  });
});
