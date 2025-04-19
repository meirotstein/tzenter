import { Minyan } from "../../../src/datasource/entities/Minyan";
import { User } from "../../../src/datasource/entities/User";
import {
  getMinyanById,
  getMinyanByName,
  getRepo as getMinyanRepo,
  saveMinyan,
} from "../../../src/datasource/minyansRepository";
import {
  assignUserToAMinyan,
  getRepo as getUserRepo,
  saveUser,
} from "../../../src/datasource/usersRepository";

describe("minyansRepository", () => {
  let user: User;
  let minyan: Minyan;

  beforeEach(async () => {
    minyan = new Minyan();
    minyan.name = "Minyan A";
    minyan.city = "New York";
    minyan.users = [];
    await saveMinyan(minyan);

    user = new User();
    user.name = "John Doe";
    user.phone = "123456789";
    user.minyans = [];
    await saveUser(user);
  });

  afterEach(async () => {
    const minyanRepo = await getMinyanRepo();
    await minyanRepo.clear();

    const userRepo = await getUserRepo();
    await userRepo.clear();
  });

  it("should save a minyan", async () => {
    const repo = await getMinyanRepo();
    const savedMinyan = await repo.findOne({ where: { name: "Minyan A" } });
    expect(savedMinyan).toBeDefined();
    expect(savedMinyan?.city).toBe("New York");
  });

  it("should get a minyan by name", async () => {
    const foundMinyan = await getMinyanByName(minyan.name);
    expect(foundMinyan).toBeDefined();
    expect(foundMinyan?.name).toBe("Minyan A");
  });

  it("should return null if minyan not found by id", async () => {
    const foundMinyan = await getMinyanByName("foo");
    expect(foundMinyan).toBeNull();
  });

  it("should get minyan users", async () => {
    await assignUserToAMinyan(user.id, minyan.id);
    const _minyan = await getMinyanByName(minyan.name);
    expect(_minyan).toBeDefined();
    expect(_minyan!.users).toHaveLength(1);
    expect(_minyan!.users![0].id).toBe(user.id);
  });

  it("should get a minyan by id", async () => {
    const foundMinyan = await getMinyanById(minyan.id);
    expect(foundMinyan).toBeDefined();
    expect(foundMinyan?.id).toBe(minyan.id);
    expect(foundMinyan?.name).toBe("Minyan A");
  });

  it("should return null if minyan not found by id", async () => {
    const foundMinyan = await getMinyanById(9999); // Assuming 9999 is a non-existent ID
    expect(foundMinyan).toBeNull();
  });
});
