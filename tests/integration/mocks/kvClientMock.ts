type KVStore<T> = Record<string, T>;

export class KVClientMock<T> {
  private store: KVStore<T>;

  constructor() {
    this.store = {};
  }

  async set(key: string, value: T): Promise<void> {
    this.store[key] = value;
  }

  async del(key: string) {
    delete this.store[key];
  }

  async get(key: string): Promise<T | null> {
    return this.store[key] ?? null;
  }

  async getMatchingKeys(pattern: string): Promise<Array<string>> {
    const regex = new RegExp(`^${pattern.replace("*", ".*")}$`);
    return Object.keys(this.store).filter((key) => regex.test(key));
  }
}
