import { Redis } from "@upstash/redis";

export class KVClient<T> {
  private redis: Redis;

  constructor(token: string, url: string) {
    this.redis = new Redis({
      url,
      token,
    });
  }

  async set(key: string, value: T, expirationSecs: number = 60 * 30) {
    await this.redis.set<T>(key, value, {
      ex: expirationSecs,
    });
  }

  async del(key: string) {
    await this.redis.del(key);
  }

  async get(key: string): Promise<T | null> {
    return await this.redis.get(key);
  }

  async getMatchingKeys(pattern: string): Promise<Array<string>> {
    let cursor = "0";
    const keys = [];

    do {
      const [nextCursor, foundKeys] = await this.redis.scan(cursor, {
        match: pattern,
        count: 100,
      });
      cursor = nextCursor;
      keys.push(...foundKeys);
    } while (cursor !== "0");

    return keys;
  }
}
