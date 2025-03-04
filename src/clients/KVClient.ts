import { Redis } from "@upstash/redis";

export class KVClient {
  private redis: Redis;

  constructor(token: string, url: string) {
    this.redis = new Redis({
      url,
      token,
    });
  }

  async set(
    key: string,
    value: Record<string, any>,
    expirationSecs: number = 600
  ) {
    await this.redis.set<Record<string, any>>(key, value, {
      ex: expirationSecs,
    });
  }

  async get(key: string): Promise<Record<string, any> | null> {
    return await this.redis.get(key);
  }
}
