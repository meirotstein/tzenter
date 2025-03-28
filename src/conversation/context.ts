import { KVClient } from "../clients/KVClient";

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
    this.kvClient = new KVClient(
      process.env.KV_REST_API_TOKEN!,
      process.env.KV_REST_API_URL!
    );
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
}
