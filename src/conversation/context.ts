import { KVClient } from "../clients/KVClient";

function getClient<T>() {
  return new KVClient<T>(
    process.env.KV_REST_API_TOKEN!,
    process.env.KV_REST_API_URL!
  );
}

export enum ContextType {
  User = "user",
  Schedule = "schedule",
}
export class Context<T> {
  private kvClient: KVClient<T>;
  private get contextKey(): string {
    return `${this.contextType}:${this.referenceId}`;
  }

  constructor(
    private referenceId: string,
    private contextType: ContextType,
    private expirationSecs: number = 60 * 30
  ) {
    this.kvClient = getClient<T>();
  }

  async set(context: T) {
    await this.kvClient.set(this.contextKey, context, this.expirationSecs);
  }

  async update(context: Partial<T>): Promise<T> {
    const existingContext = await this.get();
    const updatedContext = {
      ...existingContext,
      ...context,
    } as T;
    await this.kvClient.set(
      this.contextKey,
      updatedContext,
      this.expirationSecs
    );
    return updatedContext;
  }

  async get(): Promise<T | null> {
    return await this.kvClient.get(this.contextKey);
  }

  async delete() {
    await this.kvClient.del(this.contextKey);
  }

  static getContext<T>(
    referenceId: string,
    contextType: ContextType
  ): Context<T> {
    let expirationSecs; // default expiration time
    switch (contextType) {
      case ContextType.User:
        expirationSecs = 60 * 60; // 1 hour
        break;
      case ContextType.Schedule:
        expirationSecs = 60 * 60; // 1 hour
        break;
      default:
        throw new Error(`Invalid context type: ${contextType}`);
    }
    return new Context<T>(referenceId, contextType, expirationSecs);
  }

  static async getAllContexts<T>(
    contextType: ContextType
  ): Promise<Array<Context<T>>> {
    const client = getClient<T>();
    const pattern = `${contextType}:*`;
    const keys = await client.getMatchingKeys(pattern);
    const contexts: Array<Context<T>> = [];
    for (const key of keys) {
      const context = Context.getContext<T>(key, contextType);
      contexts.push(context);
    }
    return contexts;
  }
}
