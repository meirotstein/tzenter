import { KVClient } from "../clients/KVClient";
import { UserContext } from "../handlers/types";

export class Context {
  private kvClient: KVClient;
  private get userContextKey(): string {
    return `user:${this.userReferenceId}`;
  }

  constructor(private userReferenceId: string) {
    this.kvClient = new KVClient(
      process.env.KV_REST_API_TOKEN!,
      process.env.KV_REST_API_URL!
    );
  }

  async setUserContext(context: UserContext) {
    await this.kvClient.set(this.userContextKey, context);
  }

  async updateUserContext(context: Partial<UserContext>): Promise<UserContext> {
    const existingContext = await this.getUserContext();
    const updatedContext = {
      ...existingContext,
      ...context,
    };
    await this.kvClient.set(this.userContextKey, updatedContext);
    return updatedContext;
  }

  async getUserContext(): Promise<UserContext | null> {
    return await this.kvClient.get(this.userContextKey);
  }

  async deleteUserContext() {
    await this.kvClient.del(this.userContextKey);
  }
}
