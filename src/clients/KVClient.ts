import { Redis } from "@upstash/redis";
import { UserContext } from "../handlers/types";

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
    value: UserContext,
    expirationSecs: number = 60 * 30
  ) {
    await this.redis.set<UserContext>(key, value, {
      ex: expirationSecs,
    });
  }

  async del(key: string) {
    await this.redis.del(key);
  }

  async get(key: string): Promise<UserContext | null> {
    return await this.redis.get(key);
  }
}
